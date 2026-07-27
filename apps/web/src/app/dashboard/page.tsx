import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const quickLinks = [
    {
      href: "/dashboard/courses",
      title: "Courses",
      description: "Browse lessons available at your tier",
    },
    {
      href: "/dashboard/subscription",
      title: "Subscription",
      description: "View or change your plan",
    },
    {
      href: "/dashboard/analytics",
      title: "Analytics",
      description: "Usage and engagement insights",
    },
    {
      href: "/dashboard/settings",
      title: "Settings",
      description: "Update your profile and avatar",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome back{user?.email ? `, ${user.email}` : ""}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Here&apos;s what&apos;s available to you.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-semibold text-gray-900">{link.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
