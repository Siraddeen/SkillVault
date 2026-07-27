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
    <div className="space-y-10 p-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <AdminClient initialCourses={courses ?? []} users={users ?? []} />
    </div>
  );
}
