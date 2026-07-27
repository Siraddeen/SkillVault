"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  tier: string;
  thumbnail_url: string | null;
  created_at: string;
};

type AdminUser = {
  id: string;
  email: string;
  is_admin: boolean;
  tier: string;
  subscription_status: string | null;
  created_at: string;
};

const TIERS = ["free", "basic", "premium"];

export function AdminClient({
  initialCourses,
  users,
}: {
  initialCourses: Course[];
  users: AdminUser[];
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    tier: "free",
    thumbnail_url: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setForm({
      title: "",
      slug: "",
      description: "",
      tier: "free",
      thumbnail_url: "",
    });
    setEditingId(null);
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description ?? "",
      tier: course.tier,
      thumbnail_url: course.thumbnail_url ?? "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();

    try {
      if (editingId) {
        const { data, error: updateError } = await supabase
          .from("courses")
          .update(form)
          .eq("id", editingId)
          .select()
          .single();
        if (updateError) throw updateError;
        setCourses((prev) => prev.map((c) => (c.id === editingId ? data : c)));
      } else {
        const { data, error: insertError } = await supabase
          .from("courses")
          .insert(form)
          .select()
          .single();
        if (insertError) throw insertError;
        setCourses((prev) => [data, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course? Lessons under it will also be removed."))
      return;
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-10">
      {/* Users Section */}
      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            Registered Users & Tier Permissions
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            {users.length} Total Users
          </span>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[520px] rounded-lg border border-zinc-800/60">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-zinc-900">
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">User Email</th>
                <th className="py-3 px-4 font-semibold">Access Tier</th>
                <th className="py-3 px-4 font-semibold">Subscription Status</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-zinc-200">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                        u.tier === "premium"
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                          : u.tier === "basic"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {u.tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono">
                    {u.subscription_status ?? "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    {u.is_admin ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[10px]">USER</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500 font-mono">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Courses Management Section */}
      <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl space-y-6">
        <h2 className="text-base font-bold text-white border-b border-zinc-800/80 pb-3">
          {editingId ? "Edit Course Entry" : "Create New Course Roadmap"}
        </h2>

        {/* Course Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Course Title
              </label>
              <input
                placeholder="e.g. Advanced PostgreSQL Architecture"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                URL Slug
              </label>
              <input
                placeholder="e.g. postgresql-architecture"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
                className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Required Access Tier
              </label>
              <select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
                className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all capitalize"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Thumbnail URL
              </label>
              <input
                placeholder="https://images.unsplash.com/..."
                value={form.thumbnail_url}
                onChange={(e) =>
                  setForm({ ...form, thumbnail_url: e.target.value })
                }
                className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Description
              </label>
              <textarea
                placeholder="Detailed course description..."
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Course"
                  : "Add Course Entry"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-400 font-medium">
              {error}
            </div>
          )}
        </form>

        {/* Existing Courses List */}
        <div className="space-y-3 pt-4 border-t border-zinc-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Published Courses ({(courses ?? []).length})
          </h3>

          <div className="space-y-2">
            {courses.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {c.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-semibold uppercase text-zinc-400">
                      {c.tier}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    /{c.slug}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(c)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-indigo-300 text-xs font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
