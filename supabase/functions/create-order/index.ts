// Edge Function: create-order
// Purpose: Create a Razorpay order for a plan purchase (Free -> Basic/Premium upgrade).
// TODO: validate requested plan, create Razorpay order via API, return order_id to client.

// Deno.serve(async (req: Request) => {
//   return new Response(JSON.stringify({ message: "create-order: not yet implemented" }), {
//     headers: { "Content-Type": "application/json" },
//   });
// });

// Edge Function: create-order
// Purpose: Create a Razorpay order for a plan purchase (Free -> Basic/Premium upgrade).
// Flow: verify user JWT -> look up plan price -> create Razorpay order -> insert pending row -> return order details

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

// service_role client - bypasses RLS, only used server-side inside this function
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

  // 1. Verify the caller's JWT and get the user
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

  // 2. Parse and validate request body
  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const planName = body.plan;
  if (!planName || !["basic", "premium"].includes(planName)) {
    return jsonResponse({ error: "plan must be 'basic' or 'premium'" }, 400);
  }

  // 3. Look up the plan (price is the source of truth, never trust client-sent amounts)
  const { data: plan, error: planError } = await supabaseAdmin
    .from("plans")
    .select("id, name, price, currency")
    .eq("name", planName)
    .eq("is_active", true)
    .single();

  if (planError || !plan) {
    return jsonResponse({ error: "Plan not found or inactive" }, 404);
  }

  // 4. Build a receipt (your own idempotency key, Razorpay just stores it)
  const receipt = `SV-${Date.now()}-${userId.slice(0, 8)}`;

  // 5. Create the Razorpay order
  const razorpayAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

  let razorpayOrder: { id: string; amount: number; currency: string };
  try {
    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${razorpayAuth}`,
      },
      body: JSON.stringify({
        amount: plan.price, // already in paise
        currency: plan.currency,
        receipt,
        notes: {
          user_id: userId,
          plan: plan.name,
        },
      }),
    });

    if (!rzpResponse.ok) {
      const errText = await rzpResponse.text();
      console.error("Razorpay order creation failed:", errText);
      return jsonResponse({ error: "Failed to create payment order" }, 502);
    }

    razorpayOrder = await rzpResponse.json();
  } catch (err) {
    console.error("Razorpay request error:", err);
    return jsonResponse({ error: "Payment provider unreachable" }, 502);
  }

  // 6. Insert a pending order row
  const { data: orderRow, error: insertError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      plan_id: plan.id,
      receipt,
      amount: plan.price,
      currency: plan.currency,
      razorpay_order_id: razorpayOrder.id,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to insert order row:", insertError);
    return jsonResponse({ error: "Failed to record order" }, 500);
  }

  // 7. Return what the frontend needs to open Razorpay Checkout
  return jsonResponse({
    order_id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key_id: RAZORPAY_KEY_ID, // safe to expose, needed by Razorpay Checkout JS on the frontend
    receipt,
  });
});
