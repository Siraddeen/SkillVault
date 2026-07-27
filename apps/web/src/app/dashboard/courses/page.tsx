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

  const { data: tierData, error: tierError } = user
    ? await supabase.rpc("current_user_tier", { uid: user.id })
    : { data: null, error: null };

  const userTier: Course["tier"] =
    tierError || !tierData ? "free" : (String(tierData).toLowerCase() as Course["tier"]);

  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, slug, title, description, thumbnail_url, tier")
    .order("tier", { ascending: true })
    .order("title", { ascending: true });

  if (coursesError) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400 flex items-center gap-3">
        <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Couldn&apos;t load courses: {coursesError.message}</span>
      </div>
    );
  }

  const userRank = TIER_RANK[userTier] ?? 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Course Roadmaps</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Browse lessons available at your access tier. Upgrade to unlock higher-tier curriculum.
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(courses ?? []).map((course: Course) => {
          const courseTierRank = TIER_RANK[course.tier] ?? 0;
          const locked = courseTierRank > userRank;

          return (
            <Link
              key={course.id}
              href={
                locked
                  ? "/dashboard/subscription"
                  : `/dashboard/courses/${course.slug}`
              }
              aria-label={locked ? `Upgrade to ${TIER_LABEL[course.tier]} to unlock ${course.title}` : `Open ${course.title}`}
              className="group block rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              <div className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200 shadow-xl shadow-black/20 flex flex-col h-full">
                {/* Thumbnail / Header Aspect Container */}
                <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        locked ? "blur-md scale-105 opacity-40" : ""
                      }`}
                    />
                  ) : (
                    <div
                      className={`h-full w-full bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 flex items-center justify-center ${
                        locked ? "blur-md opacity-40" : ""
                      }`}
                    >
                      <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}

                  {locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/70 backdrop-blur-sm text-white">
                      <div className="w-10 h-10 rounded-full bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center shadow-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5 text-indigo-400"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 1.5a4.5 4.5 0 00-4.5 4.5v3H6a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 006 22.5h12a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0018 9h-1.5V6a4.5 4.5 0 00-4.5-4.5zm3 7.5V6a3 3 0 10-6 0v3h6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                        {TIER_LABEL[course.tier]} Plan Required
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="font-semibold text-white group-hover:text-indigo-300 transition-colors text-base">
                        {course.title}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                          course.tier === "premium"
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                            : course.tier === "basic"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400"
                        }`}
                      >
                        {course.tier}
                      </span>
                    </div>
                    {course.description && (
                      <p className="line-clamp-2 text-xs text-zinc-400 leading-relaxed">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                    {locked ? (
                      <span className="text-xs font-medium text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                        Upgrade plan to unlock →
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-zinc-300 group-hover:text-white flex items-center gap-1">
                        View course content →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {(courses ?? []).length === 0 && (
        <div className="py-16 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300">No courses published yet</p>
            <p className="text-xs text-zinc-500 mt-1">Check back soon — courses will appear here once published by an admin.</p>
          </div>
        </div>
      )}
    </div>
  );
}

