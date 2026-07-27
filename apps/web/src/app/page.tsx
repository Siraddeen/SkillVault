import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      {/* Background Decorative Gradients & Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/20 to-transparent blur-3xl pointer-events-none rounded-full opacity-60" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/70 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              SkillVault
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Backend Case Study
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors font-medium hidden md:block"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 flex flex-col items-center text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 hover:bg-indigo-500/15 transition-colors cursor-default">
          <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
          Backend Engineering Case Study & Architecture Showcase
        </div>

        {/* Hero Title */}
        <h1 className="max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent leading-[1.1] mb-6">
          Production-Grade Architecture. <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            PostgreSQL RLS & Edge Functions.
          </span>
        </h1>

        {/* Hero Description */}
        <p className="max-w-2xl text-lg sm:text-xl text-zinc-400 font-normal leading-relaxed mb-10">
          SkillVault is a backend engineering portfolio project demonstrating multi-tier Row Level Security, 
          Supabase Edge Functions, Razorpay billing integration, and telemetry analytics.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center sm:w-auto">
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-white/10"
          >
            Launch Demo App
            <svg
              className="w-4 h-4 text-zinc-950 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-sm border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            View Dashboard Demo
          </Link>
        </div>

        {/* System Stats Row */}
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md">
          <div className="p-3 text-center sm:text-left border-r border-zinc-800/50 last:border-0">
            <div className="text-2xl font-bold text-white tracking-tight">4 Role Tiers</div>
            <div className="text-xs text-zinc-400 mt-0.5">Free, Basic, Premium, Admin</div>
          </div>
          <div className="p-3 text-center sm:text-left border-r border-zinc-800/50 last:border-0">
            <div className="text-2xl font-bold text-white tracking-tight">PostgreSQL</div>
            <div className="text-xs text-zinc-400 mt-0.5">Database Row Level Security</div>
          </div>
          <div className="p-3 text-center sm:text-left border-r border-zinc-800/50 last:border-0">
            <div className="text-2xl font-bold text-white tracking-tight">Deno / TS</div>
            <div className="text-xs text-zinc-400 mt-0.5">Supabase Edge Functions</div>
          </div>
          <div className="p-3 text-center sm:text-left">
            <div className="text-2xl font-bold text-white tracking-tight">Razorpay</div>
            <div className="text-xs text-zinc-400 mt-0.5">Test-Mode Tier Billing</div>
          </div>
        </div>

        {/* Feature Bento Grid */}
        <div className="w-full max-w-6xl mt-24 text-left">
          <div className="text-center mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">
              Core Backend Implementation
            </h2>
            <p className="text-3xl font-bold text-white tracking-tight">
              Demonstrating system design & database security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Supabase Authentication</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Secure Auth flow using Email Magic Links, Passwords, and custom JWT claim injection for role-based system access.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">PostgreSQL & Row Level Security</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Zero-trust RLS policies isolating data at the database level according to user subscription tiers and roles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Razorpay Subscription System</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Integrated order creation, webhook verification, signature validation, and automated plan upgrades and cancellations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Supabase Edge Functions</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Lightweight Deno serverless endpoints executing core business operations (`create-order`, `verify-payment`, `upgrade-plan`).
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Tier-Based Course Access</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Dynamic course catalog filtered by user tier (Free, Basic, Premium) with server-side validation and access restrictions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Telemetry Events & Admin Panel</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Event recording for user actions, ad-frequency calculations, and administrative data inspection via custom database RPCs.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">SkillVault</span> — Backend Engineering Case Study
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-300 transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


