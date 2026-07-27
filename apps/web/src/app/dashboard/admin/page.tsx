import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const [{ data: courses }, { data: users }] = await Promise.all([
    supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.rpc("admin_list_users"),
  ]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Administrative Control Panel
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Platform Administration</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage course roadmaps, inspect user role tiers, and control platform content.
          </p>
        </div>
      </div>

      <AdminClient initialCourses={courses ?? []} users={users ?? []} />
    </div>
  );
}

