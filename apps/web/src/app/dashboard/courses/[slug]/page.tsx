import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserTier } from "@/lib/supabase/session";
import { RecordView } from "./record-view";

// Matches supabase/migrations/xxxx_create_courses.sql exactly.
type Course = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tier: "free" | "basic" | "premium";
};

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
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

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Course lookup and tier lookup don't depend on each other — run together.
  const [{ data: course, error: courseError }, userTier] = await Promise.all([
    supabase
      .from("courses")
      .select("id, slug, title, description, tier")
      .eq("slug", slug)
      .single<Course>(),
    getCurrentUserTier() as Promise<Course["tier"]>,
  ]);

  if (courseError || !course) {
    notFound();
  }

  const locked = (TIER_RANK[course.tier] ?? 0) > (TIER_RANK[userTier] ?? 0);

  const { data: lessons } = locked
    ? { data: [] as Lesson[] }
    : await supabase
        .from("lessons")
        .select("id, title, content, video_url, order_index")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true })
        .returns<Lesson[]>();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!locked && <RecordView courseId={course.id} />}

      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Course Catalog
        </Link>
      </div>

      {/* Header Banner */}
      <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{course.title}</h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${
              course.tier === "premium"
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                : course.tier === "basic"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
            }`}
          >
            {course.tier} Access
          </span>
        </div>

        {course.description && (
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">{course.description}</p>
        )}
      </div>

      {/* Lessons List or Locked Prompt */}
      {locked ? (
        <div className="p-10 rounded-2xl bg-gradient-to-b from-zinc-900/80 to-zinc-950 border border-zinc-800 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 1.5a4.5 4.5 0 00-4.5 4.5v3H6a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 006 22.5h12a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0018 9h-1.5V6a4.5 4.5 0 00-4.5-4.5zm3 7.5V6a3 3 0 10-6 0v3h6z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-1">
            This course requires the {TIER_LABEL[course.tier]} Plan
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mb-6">
            You are currently on the <span className="text-zinc-200 font-semibold">{TIER_LABEL[userTier]}</span> plan. Upgrade your plan to instantly unlock this curriculum and exercises.
          </p>
          <Link
            href="/dashboard/subscription"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
          >
            Upgrade Plan to Unlock →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Course Curriculum & Lessons ({(lessons ?? []).length})
          </h2>

          {(lessons ?? []).map((lesson, i) => (
            <div
              key={lesson.id}
              className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-1">
                    {lesson.title}
                  </h3>
                  {lesson.content && (
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                      {lesson.content}
                    </p>
                  )}
                  {lesson.video_url && (
                    <a
                      href={lesson.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/20 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Watch Lesson Video
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {(lessons ?? []).length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <p className="text-xs text-zinc-400">No lessons published for this course yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

