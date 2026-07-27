import { createClient } from "@/lib/supabase/server";

// Return shapes match the RPCs in
// supabase/migrations/xxxx_create_analytics_rpcs.sql exactly.
type ConversionRow = {
  active_subscriptions: number;
  premium_subscriptions: number;
  conversion_rate: number;
};

type DauRow = { day: string; dau: number };

type TopCourseRow = { course_id: string; title: string; view_count: number };

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // NOTE: this project's supabase clients (lib/supabase/server.ts /
  // client.ts) aren't parameterized with generated Database types, so
  // postgrest-js can't infer whether analytics_dau/analytics_top_courses
  // return a set or a single row. Chaining .single<T>()/.returns<T[]>()
  // on top of that unresolved inference is what throws the "Cannot cast
  // single object to array type" TS error. Casting the plain `.data` below
  // does the same job without depending on that inference.
  const [conversionRes, dauRes, topCoursesRes] = await Promise.all([
    supabase.rpc("analytics_conversion_rate").single(),
    supabase.rpc("analytics_dau", { days: 14 }),
    supabase.rpc("analytics_top_courses", { result_limit: 5 }),
  ]);

  const conversion = conversionRes.data as ConversionRow | null;
  const dau = (dauRes.data as DauRow[] | null) ?? [];
  const topCourses = (topCoursesRes.data as TopCourseRow[] | null) ?? [];

  const maxDau = Math.max(1, ...dau.map((d) => d.dau));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="mt-1 text-sm text-gray-500">
        Usage and engagement insights, queried live from Postgres.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Conversion rate */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">
            Premium conversion (paid subscribers)
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Share of active paid (basic/premium) subscribers on Premium —
            not a share of total signups, since free-tier users don&apos;t
            have a subscriptions row.
          </p>
          {conversionRes.error ? (
            <p className="mt-4 text-sm text-red-600">
              {conversionRes.error.message}
            </p>
          ) : (
            <>
              <p className="mt-4 text-3xl font-bold text-gray-900">
                {conversion ? `${conversion.conversion_rate}%` : "—"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {conversion
                  ? `${conversion.premium_subscriptions} of ${conversion.active_subscriptions} active paid subscriptions`
                  : "No data yet"}
              </p>
            </>
          )}
        </div>

        {/* DAU */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-gray-900">
            Daily active users (last 14 days)
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Distinct logged-in users generating a telemetry event per day.
          </p>

          {dauRes.error ? (
            <p className="mt-4 text-sm text-red-600">{dauRes.error.message}</p>
          ) : dau.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No telemetry recorded yet — this fills in as users view
              courses.
            </p>
          ) : (
            <div className="mt-4 space-y-1.5">
              {dau.map((row) => (
                <div key={row.day} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-gray-500">
                    {row.day}
                  </span>
                  <div className="h-4 flex-1 rounded bg-gray-100">
                    <div
                      className="h-4 rounded bg-indigo-500"
                      style={{ width: `${(row.dau / maxDau) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-medium text-gray-700">
                    {row.dau}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top courses */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="font-semibold text-gray-900">
            Top courses by views
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Counts a &quot;lesson_view&quot; telemetry event per course
            visit.
          </p>

          {topCoursesRes.error ? (
            <p className="mt-4 text-sm text-red-600">
              {topCoursesRes.error.message}
            </p>
          ) : topCourses.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No course views recorded yet — visit an unlocked course to
              generate data.
            </p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="pb-2 font-medium">Course</th>
                  <th className="pb-2 font-medium text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {topCourses.map((row) => (
                  <tr
                    key={row.course_id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-2 text-gray-900">{row.title}</td>
                    <td className="py-2 text-right font-medium text-gray-700">
                      {row.view_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
