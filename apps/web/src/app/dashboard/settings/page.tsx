import { createClient } from "@/lib/supabase/server";
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
    <div className="max-w-3xl space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Account Settings</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Manage your personal profile, avatar storage assets, and account details.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl space-y-6">
        <h2 className="text-base font-bold text-white border-b border-zinc-800/80 pb-3">
          Profile Identity & Avatar
        </h2>
        
        <AvatarUploader currentAvatarUrl={profile?.avatar_url ?? null} />
      </div>

      {/* User Info Details */}
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white border-b border-zinc-800/80 pb-3">
          Account Metadata
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 font-medium block mb-1">Email Address</span>
            <span className="text-zinc-200 font-mono bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800/80 block truncate">
              {user.email}
            </span>
          </div>

          <div>
            <span className="text-zinc-500 font-medium block mb-1">User Identifier (UUID)</span>
            <span className="text-zinc-400 font-mono bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800/80 block truncate">
              {user.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

