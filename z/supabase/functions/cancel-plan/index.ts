// Edge Function: cancel-plan
// Purpose: Downgrade a user back to Free tier at period end.
Deno.serve(async (req: Request) => {
  return new Response(JSON.stringify({ message: "cancel-plan: not yet implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
});
