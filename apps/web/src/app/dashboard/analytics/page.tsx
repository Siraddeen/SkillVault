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
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics & Telemetry</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Usage metrics, daily active user trends, and top course engagement queried live via PostgreSQL RPCs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Premium Conversion Card */}
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Conversion Rate
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <h2 className="font-bold text-white text-base">
              Premium Paid Ratio
            </h2>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Share of active paid subscribers upgraded to Premium tier.
            </p>
          </div>

          {conversionRes.error ? (
            <p className="mt-4 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {conversionRes.error.message}
            </p>
          ) : (
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <div className="text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-zinc-100 to-indigo-200 bg-clip-text text-transparent">
                {conversion ? `${conversion.conversion_rate}%` : "—"}
              </div>
              <p className="mt-1.5 text-xs text-zinc-400">
                {conversion
                  ? `${conversion.premium_subscriptions} of ${conversion.active_subscriptions} active paid subscriptions`
                  : "No conversion data recorded yet"}
              </p>
            </div>
          )}
        </div>

        {/* Daily Active Users (DAU) */}
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-white text-base">
                Daily Active Users (Last 14 Days)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
                Telemetry Log
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Distinct logged-in users generating telemetry events per day.
            </p>
          </div>

          {dauRes.error ? (
            <p className="mt-4 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {dauRes.error.message}
            </p>
          ) : dau.length === 0 ? (
            <div className="mt-6 py-12 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800/60 flex flex-col items-center gap-3">
              <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <p className="text-xs text-zinc-500">
                No telemetry recorded yet — viewing courses populates this timeline.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              {dau.map((row) => (
                <div key={row.day} className="flex items-center gap-3 text-xs" role="listitem">
                  <span className="w-24 shrink-0 text-zinc-400 font-mono" aria-hidden="true">
                    {row.day}
                  </span>
                  <div className="h-5 flex-1 rounded-lg bg-zinc-950 overflow-hidden border border-zinc-800/60 p-0.5" role="meter" aria-valuenow={row.dau} aria-valuemin={0} aria-valuemax={maxDau} aria-label={`${row.day}: ${row.dau} active users`}>
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500"
                      style={{ width: `${(row.dau / maxDau) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-bold text-white font-mono">
                    {row.dau}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Courses Table */}
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-white text-base">
                Top Courses by Views
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Telemetry counts for <code className="text-indigo-400 font-mono">lesson_view</code> events.
              </p>
            </div>
          </div>

          {topCoursesRes.error ? (
            <p className="mt-4 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {topCoursesRes.error.message}
            </p>
          ) : topCourses.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800/60 flex flex-col items-center gap-3">
              <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-xs text-zinc-500">
                No course views recorded yet — visit an unlocked course to generate telemetry.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Course Title</th>
                    <th className="py-3 px-4 font-semibold font-mono">Course ID</th>
                    <th className="py-3 px-4 font-semibold text-right">Telemetry Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {topCourses.map((row) => (
                    <tr
                      key={row.course_id}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-white">{row.title}</td>
                      <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px] max-w-[200px] truncate">{row.course_id}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-300 font-mono">{row.view_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

