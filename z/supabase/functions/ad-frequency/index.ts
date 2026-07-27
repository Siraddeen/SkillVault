// Edge Function: ad-frequency
// Purpose: Enforce ad frequency capping per user per day, based on plan tier.
//   Free    -> e.g. 5 ads/day
//   Basic   -> e.g. 2 ads/day
//   Premium -> 0 ads/day
// TODO: check ad_impressions count for today against tier limit before allowing an ad.
// Deno.serve(async (req: Request) => {
//   return new Response(JSON.stringify({ message: "ad-frequency: not yet implemented" }), {
//     headers: { "Content-Type": "application/json" },
//   });
// });
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AD_DAILY_CAP = Number(Deno.env.get("AD_DAILY_CAP") ?? "5");

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

  // 1. Auth is required — this endpoint answers "should THIS user see an ad"
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

  // 2. Parse body — context is just a label for where the ad slot lives
  let body: { context?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const context = body.context ?? "unspecified";

  // 3. Paid tiers never see ads — short-circuit before touching ad_impressions at all
  const { data: tier, error: tierError } = await supabaseAdmin.rpc(
    "current_user_tier",
    { uid: userId },
  );

  if (tierError) {
    console.error("current_user_tier RPC failed", tierError);
    return jsonResponse({ error: "Could not resolve subscription tier" }, 500);
  }

  if (tier !== "free") {
    return jsonResponse({ shouldShowAd: false, reason: "paid_tier" });
  }

  // 4. Count impressions in the trailing 24h window
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error: countError } = await supabaseAdmin
    .from("ad_impressions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("shown_at", windowStart);

  if (countError) {
    console.error("ad_impressions count failed", countError);
    return jsonResponse({ error: "Could not check ad frequency" }, 500);
  }

  const impressionsToday = count ?? 0;

  if (impressionsToday >= AD_DAILY_CAP) {
    return jsonResponse({
      shouldShowAd: false,
      reason: "cap_reached",
      cap: AD_DAILY_CAP,
    });
  }

  // 5. Under the cap — record this impression and greenlight it
  const { error: insertError } = await supabaseAdmin
    .from("ad_impressions")
    .insert({ user_id: userId, context });

  if (insertError) {
    console.error("ad_impressions insert failed", insertError);
    return jsonResponse({ error: "Could not record ad impression" }, 500);
  }

  return jsonResponse({
    shouldShowAd: true,
    remaining: AD_DAILY_CAP - impressionsToday - 1,
  });
});
