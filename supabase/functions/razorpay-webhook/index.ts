import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  verifyWebhookSignature,
  findOrderByRazorpayOrderId,
  markOrderPaid,
  activateSubscription,
  recordPayment,
} from "../_shared/payment.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // 1. Read the RAW body first — signature verification needs the exact bytes Razorpay sent.
  //    Do NOT req.json() before this or you lose the raw string.
  const rawBody = await req.text();

  const signatureHeader = req.headers.get("x-razorpay-signature");
  const isValid = await verifyWebhookSignature(rawBody, signatureHeader);

  if (!isValid) {
    console.error("Webhook signature verification failed");
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  // 2. Now safe to parse
  let payload: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // 3. We only care about payment.captured for now.
  //    Razorpay sends many event types (order.paid, payment.failed, refund.*, etc.)
  //    — ignore anything else with a 200 so Razorpay doesn't keep retrying it.
  if (payload.event !== "payment.captured") {
    return jsonResponse({ received: true, ignored: payload.event });
  }

  const paymentEntity = payload.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;
  const razorpayPaymentId = paymentEntity?.id;

  if (!razorpayOrderId || !razorpayPaymentId) {
    console.error("Webhook payload missing order_id or payment_id");
    return jsonResponse({ error: "Malformed payment.captured payload" }, 400);
  }

  // 4. Find the pending order — note there's no userId to check ownership against here
  //    (unlike verify-payment, which has an authenticated caller). That's fine: this
  //    endpoint's trust comes entirely from the signature check above, not from auth.
  const order = await findOrderByRazorpayOrderId(
    supabaseAdmin,
    razorpayOrderId,
  );

  if (!order) {
    console.error(`Webhook: no matching order for ${razorpayOrderId}`);
    // Still 200 — order might belong to a different environment/test order, not our problem to retry
    return jsonResponse({ received: true, warning: "order not found" });
  }

  // 5. Mark paid (idempotent — this is exactly the race this function exists to win or lose gracefully)
  const result = await markOrderPaid(
    supabaseAdmin,
    order.id,
    razorpayPaymentId,
    { source: "webhook", event: payload.event, raw_entity: paymentEntity },
  );

  if (!result.alreadyProcessed) {
    await activateSubscription(supabaseAdmin, order.user_id, order.plan_id);
    await recordPayment(supabaseAdmin, order.id, order.user_id, order.amount);
  }

  return jsonResponse({ received: true, order_id: order.id, status: "paid" });
});
