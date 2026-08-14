"use client";

import { useEffect, useState } from "react";
import { getInsforgeBrowserClient } from "@/lib/insforge-browser";
import { hydrateLearningProgress } from "@/lib/learning-progress";

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const client = getInsforgeBrowserClient();
        const { data } = await client.auth.getCurrentUser();
        if (data?.user && !cancelled) {
          await hydrateLearningProgress(data.user.id);
        }
      } catch (error) {
        console.error("Failed to hydrate learning progress on courses layout:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#fbfff7_0%,#edf5e6_42%,#e5efde_100%)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
