// Edge Function: record-telemetry
// Purpose: Ingest usage events (lesson opens, video clicks, PDF downloads, plan changes, logout).
// TODO: accept a batch of events, insert into usage_events table.
// Deno.serve(async (req: Request) => {
//   return new Response(JSON.stringify({ message: "record-telemetry: not yet implemented" }), {
//     headers: { "Content-Type": "application/json" },
//   });
// });
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOptionalUser } from "../_shared/auth.ts";
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
  // (Same fix as create-order/verify-payment: this function is now called
  // directly from the browser via supabase.functions.invoke on the course
  // detail page, so it needs the same CORS handling.)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // 1. Auth is OPTIONAL — anon visitors generate telemetry too (page views, signup drop-off)
  const user = await getOptionalUser(supabaseAdmin, req);

  // 2. Parse + validate body
  let body: { event_type?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body.event_type || typeof body.event_type !== "string") {
    return jsonResponse({ error: "event_type is required" }, 400);
  }

  // 3. Insert — no RLS policy exists for this table by design, so this only
  //    works via the service-role client, never a direct client-side insert.
  const { error } = await supabaseAdmin.from("telemetry_events").insert({
    user_id: user?.id ?? null,
    event_type: body.event_type,
    payload: body.payload ?? {},
  });

  if (error) {
    console.error("telemetry_events insert failed", error);
    return jsonResponse({ error: "Could not record event" }, 500);
  }

  return jsonResponse({ received: true });
});
