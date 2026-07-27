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

  const { data: tierData, error: tierError } = user
    ? await supabase.rpc("current_user_tier", { uid: user.id })
    : { data: null, error: null };

  const currentTier: Plan["name"] =
    tierError || !tierData ? "free" : (String(tierData).toLowerCase() as Plan["name"]);

  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select("id, name, price, currency, features")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (plansError) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400 flex items-center gap-3">
        <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Couldn&apos;t load plans: {plansError.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Subscription Plans</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          You are currently on the{" "}
          <span className="font-semibold text-indigo-400 uppercase tracking-wider">{currentTier}</span> tier. Upgrade your plan anytime via Razorpay.
        </p>
      </div>

      <SubscriptionClient plans={(plans ?? []) as Plan[]} currentTier={currentTier} />
    </div>
  );
}

