import { createClient } from "@/lib/supabase/server";
import { SubscriptionClient } from "./subscription-client";

// Matches supabase/migrations/create_orders.sql exactly.
type Plan = {
  id: string;
  name: "free" | "basic" | "premium";
  price: number; // paise
  currency: string;
  features: Record<string, unknown>;
};

export default async function SubscriptionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // current_user_tier(uid uuid) requires the caller's id — see the fix
  // already applied in dashboard/layout.tsx.
  const { data: tierData, error: tierError } = user
    ? await supabase.rpc("current_user_tier", { uid: user.id })
    : { data: null, error: null };

  const currentTier: Plan["name"] =
    tierError || !tierData ? "free" : (String(tierData) as Plan["name"]);

  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select("id, name, price, currency, features")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (plansError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Couldn&apos;t load plans: {plansError.message}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
      <p className="mt-1 text-sm text-gray-500">
        You&apos;re currently on the{" "}
        <span className="font-medium capitalize">{currentTier}</span> plan.
      </p>

      <SubscriptionClient plans={(plans ?? []) as Plan[]} currentTier={currentTier} />
    </div>
  );
}
