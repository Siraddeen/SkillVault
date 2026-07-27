import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tier, error: tierError } = await supabase.rpc(
    "current_user_tier",
    { uid: user.id },
  );

  const tierLabel = tierError || !tier ? "free" : String(tier).toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const navLinks = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/courses", label: "Courses" },
    { href: "/dashboard/subscription", label: "Subscription" },
    { href: "/dashboard/analytics", label: "Analytics" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <svg
                  className="w-4 h-4 text-white"
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
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                SkillVault
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5" aria-label="Dashboard navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all duration-150"
                >
                  {link.label}
                </Link>
              ))}
              {profile?.is_admin && (
                <Link
                  href="/dashboard/admin"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Tier Badge */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border flex items-center gap-1.5 ${
                tierLabel === "premium"
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-sm shadow-indigo-500/10"
                  : tierLabel === "basic"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10"
                    : "bg-zinc-800/80 border-zinc-700/60 text-zinc-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  tierLabel === "premium"
                    ? "bg-indigo-400 animate-pulse"
                    : tierLabel === "basic"
                      ? "bg-emerald-400"
                      : "bg-zinc-500"
                }`}
              />
              {tierLabel} Plan
            </div>

            {/* User Info & Sign Out */}
            <div className="flex items-center gap-3 pl-3 border-l border-zinc-800">
              <span className="text-xs text-zinc-400 font-medium hidden sm:inline-block max-w-[160px] truncate">
                {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  aria-label="Sign out of SkillVault"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-zinc-900 overflow-x-auto no-scrollbar" role="navigation" aria-label="Mobile dashboard navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 whitespace-nowrap transition-all duration-150"
            >
              {link.label}
            </Link>
          ))}
          {profile?.is_admin && (
            <Link
              href="/dashboard/admin"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-500/10 whitespace-nowrap transition-all duration-150"
            >
              Admin
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

