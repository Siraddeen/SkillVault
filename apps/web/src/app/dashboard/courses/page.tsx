import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Matches supabase/migrations/xxxx_create_courses.sql exactly.
type Course = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  tier: "free" | "basic" | "premium";
};

const TIER_RANK: Record<Course["tier"], number> = {
  free: 0,
  basic: 1,
  premium: 2,
};

const TIER_LABEL: Record<Course["tier"], string> = {
  free: "Free",
  basic: "Basic",
  premium: "Premium",
};

export default async function CoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // current_user_tier(uid uuid) requires the caller's id — the same fix
  // needed in dashboard/layout.tsx, which currently calls this with no
  // args and silently falls back to "free" on every load.
  const { data: tierData, error: tierError } = user
    ? await supabase.rpc("current_user_tier", { uid: user.id })
    : { data: null, error: null };

  const userTier: Course["tier"] =
    tierError || !tierData ? "free" : (String(tierData) as Course["tier"]);

  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, slug, title, description, thumbnail_url, tier")
    .order("tier", { ascending: true })
    .order("title", { ascending: true });

  if (coursesError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Couldn&apos;t load courses: {coursesError.message}
      </div>
    );
  }

  const userRank = TIER_RANK[userTier];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
      <p className="mt-1 text-sm text-gray-500">
        Browse everything on SkillVault. Upgrade to unlock higher-tier
        content.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(courses ?? []).map((course: Course) => {
          const locked = TIER_RANK[course.tier] > userRank;

          const card = (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
              <div className="relative aspect-video bg-gray-100">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className={`h-full w-full object-cover ${
                      locked ? "scale-105 blur-sm" : ""
                    }`}
                  />
                ) : (
                  <div
                    className={`h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 ${
                      locked ? "blur-sm" : ""
                    }`}
                  />
                )}

                {locked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 1.5a4.5 4.5 0 00-4.5 4.5v3H6a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 006 22.5h12a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0018 9h-1.5V6a4.5 4.5 0 00-4.5-4.5zm3 7.5V6a3 3 0 10-6 0v3h6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium">
                      {TIER_LABEL[course.tier]} only
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-gray-900">
                    {course.title}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      course.tier === "premium"
                        ? "bg-indigo-100 text-indigo-700"
                        : course.tier === "basic"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {course.tier}
                  </span>
                </div>
                {course.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {course.description}
                  </p>
                )}

                {locked ? (
                  <span className="mt-3 inline-block text-sm font-medium text-indigo-600">
                    Upgrade to unlock →
                  </span>
                ) : (
                  <span className="mt-3 inline-block text-sm font-medium text-gray-700">
                    View course →
                  </span>
                )}
              </div>
            </div>
          );

          return (
            <Link
              key={course.id}
              href={
                locked
                  ? "/dashboard/subscription"
                  : `/dashboard/courses/${course.slug}`
              }
              className="block"
            >
              {card}
            </Link>
          );
        })}
      </div>

      {(courses ?? []).length === 0 && (
        <p className="mt-8 text-sm text-gray-500">
          No courses published yet.
        </p>
      )}
    </div>
  );
}
