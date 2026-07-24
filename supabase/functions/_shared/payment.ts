// supabase/functions/_shared/payment.ts
// Shared payment-processing utilities used by both:
//
// 1. verify-payment      (Frontend callback after Razorpay Checkout)
// 2. razorpay-webhook    (Authoritative payment confirmation)
//
// Both flows reuse the same business logic so payment handling stays consistent.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/* -------------------------------------------------------------------------- */
/*                              Environment Vars                              */
/* -------------------------------------------------------------------------- */

function requireEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const RAZORPAY_KEY_SECRET = requireEnv("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = requireEnv("RAZORPAY_WEBHOOK_SECRET");

/* -------------------------------------------------------------------------- */
/*                              Crypto Helpers                                */
/* -------------------------------------------------------------------------- */

/**
 * Generates a SHA256 HMAC in hexadecimal format.
 */
async function createHmac(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(payload),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time comparison.
 * Helps avoid timing attacks caused by early string comparison exits.
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;

  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

/* -------------------------------------------------------------------------- */
/*                      Razorpay Checkout Verification                         */
/* -------------------------------------------------------------------------- */

/**
 * Checkout Success Verification
 *
 * Razorpay signs:
 *
 * order_id + "|" + payment_id
 *
 * using RAZORPAY_KEY_SECRET.
 */
export async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  const expected = await createHmac(
    RAZORPAY_KEY_SECRET,
    `${orderId}|${paymentId}`,
  );

  return constantTimeEquals(expected, signature);
}

/* -------------------------------------------------------------------------- */
/*                       Razorpay Webhook Verification                         */
/* -------------------------------------------------------------------------- */

/**
 * Webhook Verification
 *
 * IMPORTANT:
 *
 * The payload MUST be the raw request body.
 *
 * Never do:
 *
 * JSON.stringify(await req.json())
 *
 * because even tiny formatting differences will invalidate the signature.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader) {
    return false;
  }

  const expected = await createHmac(RAZORPAY_WEBHOOK_SECRET, rawBody);

  return constantTimeEquals(expected, signatureHeader);
}

/* -------------------------------------------------------------------------- */
/*                              Order Helpers                                 */
/* -------------------------------------------------------------------------- */

/**
 * Finds an order using Razorpay's order id.
 */
export async function findOrderByRazorpayOrderId(
  supabase: SupabaseClient,
  razorpayOrderId: string,
) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("razorpay_order_id", razorpayOrderId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Marks an order as paid.
 *
 * Idempotent:
 * Safe to call multiple times.
 */
export async function markOrderPaid(
  supabase: SupabaseClient,
  orderId: string,
  razorpayPaymentId: string,
  paymentMetadata: Record<string, unknown> = {},
) {
  const { data: existing, error } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (error) {
    throw error;
  }

  if (existing?.status === "paid") {
    return {
      alreadyProcessed: true,
    };
  }

  const { data, error: updateError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      razorpay_payment_id: razorpayPaymentId,
      payment_metadata: paymentMetadata,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  return {
    alreadyProcessed: false,
    order: data,
  };
}

/* -------------------------------------------------------------------------- */
/*                          Subscription Helpers                              */
/* -------------------------------------------------------------------------- */

/**
 * Activates the purchased subscription.
 *
 * Only one active subscription is allowed per user.
 */
export async function activateSubscription(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
) {
  await supabase
    .from("subscriptions")
    .update({
      status: "expired",
    })
    .eq("user_id", userId)
    .eq("status", "active");

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan_id: planId,
      status: "active",
      starts_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/*                               Telemetry                                    */
/* -------------------------------------------------------------------------- */

/**
 * Temporary payment audit.
 *
 * Can later be replaced with:
 *
 * payment_events table
 * telemetry queue
 * BigQuery export
 */
export async function recordPayment(
  _supabase: SupabaseClient,
  orderId: string,
  userId: string,
  amount: number,
) {
  console.log({
    event: "payment_recorded",
    orderId,
    userId,
    amount,
    timestamp: new Date().toISOString(),
  });
}

// // supabase/functions/_shared/payments.ts
// // Shared payment-processing logic used by both verify-payment (client callback)
// // and razorpay-webhook (authoritative source of truth). Keeping this in one place
// // avoids the two paths drifting out of sync with each other.

// import {
//   createClient,
//   SupabaseClient,
// } from "https://esm.sh/@supabase/supabase-js@2";

// const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

// // --- Signature verification ---
// // Razorpay signs `order_id|payment_id` with HMAC-SHA256 using your key secret.
// // We recompute it server-side and compare - this is what proves the payment
// // callback actually came from Razorpay and wasn't forged by a client.
// export async function verifySignature(
//   orderId: string,
//   paymentId: string,
//   signature: string,
// ): Promise<boolean> {
//   const encoder = new TextEncoder();
//   const key = await crypto.subtle.importKey(
//     "raw",
//     encoder.encode(RAZORPAY_KEY_SECRET),
//     { name: "HMAC", hash: "SHA-256" },
//     false,
//     ["sign"],
//   );

//   const signatureBytes = await crypto.subtle.sign(
//     "HMAC",
//     key,
//     encoder.encode(`${orderId}|${paymentId}`),
//   );

//   const computedSignature = Array.from(new Uint8Array(signatureBytes))
//     .map((b) => b.toString(16).padStart(2, "0"))
//     .join("");

//   return computedSignature === signature;
// }

// // --- Find the pending order this payment belongs to ---
// export async function findPendingOrder(
//   supabase: SupabaseClient,
//   razorpayOrderId: string,
// ) {
//   const { data, error } = await supabase
//     .from("orders")
//     .select("*")
//     .eq("razorpay_order_id", razorpayOrderId)
//     .single();

//   if (error || !data) return null;
//   return data;
// }

// // --- Mark an order as paid (idempotent: safe to call twice) ---
// export async function markOrderPaid(
//   supabase: SupabaseClient,
//   orderId: string,
//   razorpayPaymentId: string,
//   paymentMetadata: Record<string, unknown> = {},
// ) {
//   // If it's already paid, don't touch it again - this is what makes
//   // webhook retries and a duplicate client call both safe.
//   const { data: existing } = await supabase
//     .from("orders")
//     .select("status")
//     .eq("id", orderId)
//     .single();

//   if (existing?.status === "paid") {
//     return { alreadyProcessed: true };
//   }

//   const { data, error } = await supabase
//     .from("orders")
//     .update({
//       status: "paid",
//       razorpay_payment_id: razorpayPaymentId,
//       payment_metadata: paymentMetadata,
//       paid_at: new Date().toISOString(),
//     })
//     .eq("id", orderId)
//     .select()
//     .single();

//   if (error) throw error;
//   return { alreadyProcessed: false, order: data };
// }

// // --- Activate (or extend) the user's subscription for the purchased plan ---
// export async function activateSubscription(
//   supabase: SupabaseClient,
//   userId: string,
//   planId: string,
// ) {
//   // Expire any existing active subscription first - the partial unique index
//   // on subscriptions(user_id) where status='active' means only one can exist,
//   // so we must clear the old one before inserting a new one.
//   await supabase
//     .from("subscriptions")
//     .update({ status: "expired" })
//     .eq("user_id", userId)
//     .eq("status", "active");

//   const { data, error } = await supabase
//     .from("subscriptions")
//     .insert({
//       user_id: userId,
//       plan_id: planId,
//       status: "active",
//       starts_at: new Date().toISOString(),
//     })
//     .select()
//     .single();

//   if (error) throw error;
//   return data;
// }

// // --- Record a payment event for telemetry/audit (optional, cheap to keep) ---
// export async function recordPayment(
//   supabase: SupabaseClient,
//   orderId: string,
//   userId: string,
//   amount: number,
// ) {
//   console.log(
//     `Payment recorded: order=${orderId} user=${userId} amount=${amount}`,
//   );
//   // Extend this later to write into a dedicated payments/audit log table if needed.
// }
