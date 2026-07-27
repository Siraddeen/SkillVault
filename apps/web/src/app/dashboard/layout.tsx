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

  // current_user_tier(uid uuid) is a SECURITY DEFINER SQL function (see
  // supabase/migrations/xxxx_create_courses.sql) that resolves the caller's
  // tier from subscriptions + plans. It requires the user's id as an
  // argument — calling it with none (as this previously did) fails silently
  // and always falls back to "free" below.
  const { data: tier, error: tierError } = await supabase.rpc(
    "current_user_tier",
    { uid: user.id },
  );

  const tierLabel = tierError || !tier ? "free" : String(tier);

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/courses", label: "Courses" },
    { href: "/dashboard/subscription", label: "Subscription" },
    { href: "/dashboard/analytics", label: "Analytics" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900">SkillVault</span>
            <nav className="flex gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {link.label}
                </Link>
              ))}
              {profile?.is_admin && (
                <Link
                  href="/dashboard/admin"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                tierLabel === "premium"
                  ? "bg-indigo-100 text-indigo-700"
                  : tierLabel === "basic"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {tierLabel}
            </span>
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
