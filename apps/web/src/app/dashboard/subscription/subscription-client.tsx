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
      // 1. Ask our create-order function for a Razorpay order.
      //    supabase.functions.invoke automatically attaches the current
      //    session's access token as the Authorization header.
      const { data: orderData, error: orderError } =
        await supabase.functions.invoke("create-order", {
          body: { plan: plan.name },
        });

      if (orderError || !orderData) {
        throw new Error(orderError?.message ?? "Could not create order");
      }

      // 2. Load Razorpay's checkout script on demand.
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load payment gateway. Check your connection.");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 3. Open the checkout modal.
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
          // 4. Fast-path confirmation. The razorpay-webhook function is the
          // authoritative source of truth if this call never fires (e.g.
          // user closes the tab right after paying).
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

          // 5. Success — re-fetch the server component so the tier badge,
          // plan list, etc. all reflect the new subscription.
          router.refresh();
        },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
        theme: { color: "#4f46e5" },
      });

      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentTier;
          const isDowngrade = TIER_RANK[plan.name] < TIER_RANK[currentTier];
          const priceLabel =
            plan.price === 0
              ? "Free"
              : `₹${(plan.price / 100).toLocaleString("en-IN")}/mo`;

          return (
            <div
              key={plan.id}
              className={`rounded-lg border bg-white p-5 shadow-sm ${
                isCurrent ? "border-indigo-300 ring-1 ring-indigo-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold capitalize text-gray-900">
                  {plan.name}
                </h2>
                {isCurrent && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    Current plan
                  </span>
                )}
              </div>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {priceLabel}
              </p>

              <ul className="mt-4 space-y-1 text-sm text-gray-600">
                {Object.entries(plan.features).map(([key, value]) => (
                  <li key={key}>
                    {key}: {String(value)}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isCurrent || isDowngrade || loadingPlan !== null || plan.price === 0}
                onClick={() => handleUpgrade(plan)}
                className="mt-5 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isCurrent
                  ? "Current plan"
                  : isDowngrade
                    ? "Not available"
                    : loadingPlan === plan.name
                      ? "Processing…"
                      : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
