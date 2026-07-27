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

      // cache-bust: path is stable (avatar.ext + upsert), browser will cache the old image otherwise
      setPreview(`${publicUrl}?t=${Date.now()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-200">
        {preview && (
          <img
            src={preview}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div>
        <label className="cursor-pointer text-sm font-medium text-blue-600">
          {uploading ? "Uploading..." : "Change avatar"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
