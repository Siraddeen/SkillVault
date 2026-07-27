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
      <section>
        <h2 className="mb-3 text-lg font-semibold">Users</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-2">Email</th>
                <th className="p-2">Tier</th>
                <th className="p-2">Subscription</th>
                <th className="p-2">Admin</th>
                <th className="p-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.email}</td>
                  <td className="p-2 capitalize">{u.tier}</td>
                  <td className="p-2">{u.subscription_status ?? "—"}</td>
                  <td className="p-2">{u.is_admin ? "Yes" : "No"}</td>
                  <td className="p-2">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Courses</h2>

        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="rounded border p-2"
          />
          <input
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
            className="rounded border p-2"
          />
          <select
            value={form.tier}
            onChange={(e) => setForm({ ...form, tier: e.target.value })}
            className="rounded border p-2"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            placeholder="Thumbnail URL"
            value={form.thumbnail_url}
            onChange={(e) =>
              setForm({ ...form, thumbnail_url: e.target.value })
            }
            className="rounded border p-2"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded border p-2 sm:col-span-2"
          />
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update course"
                  : "Add course"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded border px-4 py-2"
              >
                Cancel
              </button>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
          )}
        </form>

        <div className="space-y-2">
          {courses.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded border p-3"
            >
              <div>
                <p className="font-medium">
                  {c.title}{" "}
                  <span className="text-xs uppercase text-gray-500">
                    ({c.tier})
                  </span>
                </p>
                <p className="text-sm text-gray-500">{c.slug}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(c)}
                  className="text-sm text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-sm text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
