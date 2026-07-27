import { cache } from "react";
import { createClient } from "./server";

export type Tier = "free" | "basic" | "premium";

/**
 * Deduped per-request. Next.js/React `cache()` memoizes this function's
 * result for the lifetime of a single server render — so if the layout
 * and a page both call getCurrentUser() during the same navigation,
 * only ONE network round trip to Supabase happens instead of two.
 * (It does NOT cache across separate navigations — each new request
 * gets a fresh call, which is what we want for auth freshness.)
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentUserTier = cache(async (): Promise<Tier> => {
  const user = await getCurrentUser();
  if (!user) return "free";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("current_user_tier", {
    uid: user.id,
  });

  if (error || !data) return "free";
  return String(data).toLowerCase() as Tier;
});

type ProfileRow = {
  is_admin: boolean;
  avatar_url: string | null;
};

export const getCurrentUserProfile = cache(async (): Promise<ProfileRow | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_admin, avatar_url")
    .eq("id", user.id)
    .single();

  return (data as ProfileRow) ?? null;
});
