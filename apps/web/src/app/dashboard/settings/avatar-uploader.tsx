"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AvatarUploader({
  currentAvatarUrl,
}: {
  currentAvatarUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File too large (max 2MB)");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (updateError) throw updateError;

      setPreview(`${publicUrl}?t=${Date.now()}`);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
      {/* Avatar Preview Ring */}
      <div className="relative group shrink-0">
        <div className="h-20 w-20 overflow-hidden rounded-2xl bg-zinc-950 border-2 border-indigo-500/30 group-hover:border-indigo-500 transition-all shadow-xl shadow-indigo-500/10 flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
      </div>

      {/* Upload Instructions & Action */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-3">
          <label
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-150"
            aria-label="Upload avatar image"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Choose Avatar Image</span>
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        <p className="text-xs text-zinc-500">
          Supports PNG, JPEG, or WebP. Max file size 2MB. Uploads directly to Supabase Cloud Storage.
        </p>

        {error && (
          <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-400 font-medium flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 font-medium flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Avatar updated successfully
          </div>
        )}
      </div>
    </div>
  );
}

