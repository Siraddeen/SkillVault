// Shared CORS headers for all Edge Functions called directly from the browser
// (via supabase.functions.invoke). Without these, the browser's preflight
// OPTIONS request gets no valid response and blocks the real request before
// it ever reaches your code — this is what "Failed to send a request to the
// Edge Function" almost always means.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
