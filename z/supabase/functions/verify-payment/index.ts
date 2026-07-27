// Edge Function: verify-payment
// Purpose: Razorpay webhook receiver.
// TODO:
//   1. Verify Razorpay signature (RAZORPAY_WEBHOOK_SECRET)
//   2. Deduplicate by event id (idempotency — webhooks can retry)
//   3. Update subscriptions table + user's plan_tier on success

// Deno.serve(async (req: Request) => {
//   return new Response(
//     JSON.stringify({ message: "verify-payment: not yet implemented" }),
//     {
//       headers: { "Content-Type": "application/json" },
//     },
//   );
// });

// Edge Function: verify-payment
// Called by the frontend right after Razorpay Checkout succeeds.
// Verifies the payment signature, marks the order paid, activates the subscription.
// NOTE: this is the fast client-side path for instant UI feedback - the webhook
// (built later) is the authoritative source of truth in case this call never happens.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  verifySignature,
  findOrderByRazorpayOrderId,
  markOrderPaid,
  activateSubscription,
  recordPayment,
} from "../_shared/payment.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req: Request) => {
  // Browser preflight - must be answered before the actual POST is allowed.
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // 1. Auth check - same pattern as create-order
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userData?.user) {
    return jsonResponse({ error: "Invalid or expired session" }, 401);
  }

  const userId = userData.user.id;

  // 2. Parse body - these three fields come from Razorpay Checkout's success callback
  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonResponse({ error: "Missing payment verification fields" }, 400);
  }

  // 3. Verify signature - this proves the payment really came from Razorpay
  const isValid = await verifySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );

  if (!isValid) {
    console.error(`Signature mismatch for order ${razorpay_order_id}`);
    return jsonResponse({ error: "Payment verification failed" }, 400);
  }

  // 4. Find the pending order
  const order = await findOrderByRazorpayOrderId(
    supabaseAdmin,
    razorpay_order_id,
  );

  if (!order) {
    return jsonResponse({ error: "Order not found" }, 404);
  }

  // Make sure this order actually belongs to the caller
  if (order.user_id !== userId) {
    return jsonResponse({ error: "Order does not belong to this user" }, 403);
  }

  // 5. Mark paid (idempotent - safe even if webhook already did this)
  const result = await markOrderPaid(
    supabaseAdmin,
    order.id,
    razorpay_payment_id,
    { source: "verify-payment", verified_at: new Date().toISOString() },
  );

  // 6. Activate the subscription (only if this call is the one actually doing the work)
  if (!result.alreadyProcessed) {
    await activateSubscription(supabaseAdmin, userId, order.plan_id);
    await recordPayment(supabaseAdmin, order.id, userId, order.amount);
  }

  // 7. Respond
  return jsonResponse({
    success: true,
    order_id: order.id,
    status: "paid",
  });
});
