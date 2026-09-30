"use client";

import { useEffect, useState } from "react";
import { useDemo } from "@/features/demo/DemoProvider";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/shared/api/client";
import type { components } from "@/shared/api/schema";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import { CalendarGrid } from "@/widgets/calendar-grid";

type Meeting = components["schemas"]["ScheduledInterview"];

export default function CalendarPage() {
  const demo = useDemo();
  const { user } = useAuthSession();
  const endpoint = demo.enabled ? `/developer/schedule?role=${demo.role}` : "/dashboard/schedule";
  const [result, setResult] = useState<{ endpoint: string; meetings?: Meeting[]; error?: string }>();
  useEffect(() => {
    if (!user || !demo.ready) return;
    let cancelled = false;
    void apiFetch<Meeting[]>(endpoint, { cache: "no-store" }).then(meetings => {
      if (!cancelled) setResult({ endpoint, meetings });
    }).catch(error => {
      if (!cancelled) setResult({ endpoint, error: error instanceof Error ? error.message : "Не удалось загрузить встречи" });
    });
    return () => { cancelled = true; };
  }, [endpoint, user, demo.ready, demo.role]);
  return <main className="px-6 md:px-10 lg:px-15 pb-12 space-y-6">
    <SectionTitle title="Календарь" subtitle="Расписание собеседований" />
    {result?.endpoint !== endpoint ? <p>Загрузка встреч...</p> : result.error ? <p role="alert">{result.error}</p> : <CalendarGrid meetings={result.meetings ?? []} />}
  </main>;
}
