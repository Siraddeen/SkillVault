import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tier } = await supabase.rpc("current_user_tier", {
    uid: user?.id ?? "",
  });

  const tierName = tier ? String(tier).toUpperCase() : "FREE";

  const quickLinks = [
    {
      href: "/dashboard/courses",
      title: "Course Catalog",
      description: "Browse lessons & roadmap content available at your tier",
      badge: "RLS Protected",
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      href: "/dashboard/subscription",
      title: "Subscription Tier",
      description: "Upgrade plan via Razorpay or manage active subscription",
      badge: "Razorpay Test Mode",
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/analytics",
      title: "Telemetry & Logs",
      description: "View real-time event logs and frequency analytics",
      badge: "Edge Telemetry",
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/settings",
      title: "Account & Profile",
      description: "Update avatar uploads & profile preferences",
      badge: "Cloud Storage",
      icon: (
        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* User Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-zinc-900 to-zinc-900 border border-zinc-800 p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Authenticated Session
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">{user?.email?.split("@")[0] || "Developer"}</span>
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400 max-w-xl">
              SkillVault backend portfolio active. Your permissions are dynamically evaluated via PostgreSQL Row Level Security.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl backdrop-blur-md">
            <div>
              <div className="text-xs text-zinc-500 font-medium">Current Access Level</div>
              <div className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {tierName} TIER
              </div>
            </div>
            <Link
              href="/dashboard/subscription"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white transition-all duration-150 shadow-md shadow-indigo-600/20 whitespace-nowrap"
            >
              Manage Plan
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards Grid */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
          Platform Hub & Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all duration-200 group flex flex-col justify-between shadow-lg shadow-black/20"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {link.icon}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
                    {link.badge}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {link.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  {link.description}
                </p>
              </div>
              <div className="mt-5 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                Open Section →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

