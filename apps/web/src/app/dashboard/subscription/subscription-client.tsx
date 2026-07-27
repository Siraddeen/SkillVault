"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Plan = {
  id: string;
  name: "free" | "basic" | "premium";
  price: number; // paise
  currency: string;
  features: Record<string, unknown>;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const TIER_RANK: Record<Plan["name"], number> = {
  free: 0,
  basic: 1,
  premium: 2,
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function SubscriptionClient({
  plans,
  currentTier,
}: {
  plans: Plan[];
  currentTier: Plan["name"];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(plan: Plan) {
    setError(null);
    setLoadingPlan(plan.name);

    try {
      const { data: orderData, error: orderError } =
        await supabase.functions.invoke("create-order", {
          body: { plan: plan.name },
        });

      if (orderError || !orderData) {
        throw new Error(orderError?.message ?? "Could not create order");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load payment gateway. Check your connection.");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const razorpay = new window.Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SkillVault",
        description: `Upgrade to ${plan.name} plan`,
        order_id: orderData.order_id,
        prefill: { email: user?.email },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const { data: verifyData, error: verifyError } =
            await supabase.functions.invoke("verify-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

          if (verifyError || !verifyData?.success) {
            setError(
              "Payment succeeded but verification failed. If your money was deducted, it will reflect once our webhook confirms it — contact support if it doesn't within a few minutes.",
            );
            return;
          }

          router.refresh();
        },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
        theme: { color: "#6366f1" },
      });

      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-medium text-red-400 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentTier;
          const isDowngrade = (TIER_RANK[plan.name] ?? 0) < (TIER_RANK[currentTier] ?? 0);
          const isPopular = plan.name === "premium";
          const priceLabel =
            plan.price === 0
              ? "Free"
              : `₹${(plan.price / 100).toLocaleString("en-IN")}`;

          return (
            <div
              key={plan.id}
              className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                isCurrent
                  ? "border-indigo-500 bg-indigo-950/20 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                  : isPopular
                    ? "border-zinc-700 bg-zinc-900/80 hover:border-zinc-600 shadow-xl"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 shadow-lg"
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0 rounded-bl-xl bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  Active Tier
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold uppercase tracking-wide text-white">
                    {plan.name}
                  </h2>
                </div>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {priceLabel}
                  </span>
                  {plan.price > 0 && <span className="text-xs text-zinc-400">/ month</span>}
                </div>

                <div className="space-y-3 pt-4 border-t border-zinc-800/80 mb-8">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Included Capabilities:
                  </div>
                  {Object.entries(plan.features).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        <span className="font-medium capitalize text-white">{key.replace(/_/g, " ")}</span>:{" "}
                        <span className="text-zinc-400">{String(value)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isCurrent || isDowngrade || loadingPlan !== null || plan.price === 0}
                onClick={() => handleUpgrade(plan)}
                aria-label={isCurrent ? `${plan.name} is your current plan` : `Upgrade to ${plan.name} plan`}
                className={`w-full rounded-xl py-3 text-xs font-semibold shadow-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                  isCurrent
                    ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700/50"
                    : isDowngrade
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800"
                      : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-indigo-600/20"
                }`}
              >
                {loadingPlan === plan.name && (
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isCurrent
                  ? "Current Active Plan"
                  : isDowngrade
                    ? "Tier Managed by Admin"
                    : loadingPlan === plan.name
                      ? "Initializing Razorpay..."
                      : `Upgrade to ${plan.name.toUpperCase()}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

