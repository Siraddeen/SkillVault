"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Fires once on mount to record a course view for analytics
// (see supabase/functions/record-telemetry and analytics_top_courses()
// in supabase/migrations/xxxx_create_analytics_rpcs.sql). Renders nothing.
export function RecordView({ courseId }: { courseId: string }) {
  useEffect(() => {
    const supabase = createClient();

    // Fire-and-forget: a failed telemetry call should never block or
    // error out the actual course page for the user.
    supabase.functions
      .invoke("record-telemetry", {
        body: {
          event_type: "lesson_view",
          payload: { course_id: courseId },
        },
      })
      .catch(() => {
        // Telemetry is best-effort — nothing to surface to the user here.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  return null;
}
