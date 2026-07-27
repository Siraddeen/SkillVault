import { createClient } from "@/lib/supabase/server"; // use your server-side client helper, adjust path if different
import { redirect } from "next/navigation";
import { AvatarUploader } from "./avatar-uploader";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-lg space-y-6 p-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <AvatarUploader currentAvatarUrl={profile?.avatar_url ?? null} />
    </div>
  );
}
