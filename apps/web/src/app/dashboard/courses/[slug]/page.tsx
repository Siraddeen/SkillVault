import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // `courses` is public metadata (courses_select_public), so this always
  // returns the course regardless of tier — see xxxx_relax_courses_rls.sql.
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, slug, title, description, tier")
    .eq("slug", slug)
    .single<Course>();

  if (courseError || !course) {
    notFound();
  }

  const { data: tierData, error: tierError } = user
    ? await supabase.rpc("current_user_tier", { uid: user.id })
    : { data: null, error: null };

  const userTier: Course["tier"] =
    tierError || !tierData ? "free" : (String(tierData) as Course["tier"]);

  const locked = TIER_RANK[course.tier] > TIER_RANK[userTier];

  // `lessons` stays tier-gated (lessons_select_by_parent_course_tier) — if
  // the user's tier is below the course's tier, RLS silently returns zero
  // rows here rather than an error, which is why we compare tiers above
  // instead of relying on an empty array to mean "locked".
  const { data: lessons } = locked
    ? { data: [] as Lesson[] }
    : await supabase
        .from("lessons")
        .select("id, title, content, video_url, order_index")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true })
        .returns<Lesson[]>();

  return (
    <div>
      {!locked && <RecordView courseId={course.id} />}

      <Link
        href="/dashboard/courses"
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← Back to courses
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
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
        <p className="mt-2 text-sm text-gray-500">{course.description}</p>
      )}

      {locked ? (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-gray-900">
            This course requires the {TIER_LABEL[course.tier]} plan.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            You&apos;re currently on {TIER_LABEL[userTier]}.
          </p>
          <Link
            href="/dashboard/subscription"
            className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Upgrade to unlock →
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {(lessons ?? []).map((lesson, i) => (
            <div
              key={lesson.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">
                  {i + 1}
                </span>
                <h2 className="font-semibold text-gray-900">
                  {lesson.title}
                </h2>
              </div>
              {lesson.content && (
                <p className="mt-1 text-sm text-gray-600">
                  {lesson.content}
                </p>
              )}
              {lesson.video_url && (
                <a
                  href={lesson.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-indigo-600"
                >
                  Watch video →
                </a>
              )}
            </div>
          ))}

          {(lessons ?? []).length === 0 && (
            <p className="text-sm text-gray-500">
              No lessons published for this course yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
