import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Returns the caller's user id if a valid session token is present,
 * or null if the request is unauthenticated. Never throws — callers
 * that require auth should check for null themselves and 401.
 */
export async function getOptionalUser(
  supabase: SupabaseClient,
  req: Request,
): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) return null;
  return { id: data.user.id };
}
