"use client";

import { useEffect, useState } from "react";
import { useDemo } from "@/features/demo/DemoProvider";
import { useAtsData } from "@/shared/api/useAtsData";
import { apiFetch } from "@/shared/api/client";
import type { components } from "@/shared/api/schema";
import { SectionTitle } from "@/shared/ui/SectionTitle";
import { CalendarGrid } from "@/widgets/calendar-grid";

type Meeting = components["schemas"]["ScheduledInterview"];

export default function CalendarPage() {
  const demo = useDemo();
  const { candidates, jobs, user } = useAtsData(undefined, undefined, !demo.enabled);
  const endpoint = demo.enabled
    ? `/developer/schedule?role=${demo.role}`
    : "/dashboard/schedule";
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    endpoint: string;
    meetings?: Meeting[];
    error?: string;
  }>();
  useEffect(() => {
    if (!user || !demo.ready) return;
    let cancelled = false;
    void apiFetch<Meeting[]>(endpoint, { cache: "no-store" })
      .then((meetings) => {
        if (!cancelled) setResult({ endpoint, meetings });
      })
      .catch((error) => {
        if (!cancelled)
          setResult({
            endpoint,
            error:
              error instanceof Error
                ? error.message
                : "Не удалось загрузить встречи",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, user, demo.ready, demo.role, revision]);

  const canCreate =
    !demo.enabled &&
    user?.permissions?.includes("candidate.read") === true &&
    user.permissions.includes("vacancy.update");

  async function createMeeting(draft: {
    applicationId: string;
    scheduledAt: string;
    durationMinutes: number;
  }) {
    if (!user?.id) throw new Error("Не удалось определить интервьюера");
    await apiFetch("/interviews/", {
      method: "POST",
      json: {
        application_id: draft.applicationId,
        interviewer_id: user.id,
        scheduled_at: draft.scheduledAt,
        duration_minutes: draft.durationMinutes,
      },
    });
    setRevision((value) => value + 1);
  }
  return (
    <main className="px-6 md:px-10 lg:px-15 pb-12 space-y-6">
      <SectionTitle title="Календарь" subtitle="Расписание собеседований" />
      {result?.endpoint !== endpoint ? (
        <p>Загрузка встреч...</p>
      ) : result.error ? (
        <p role="alert">{result.error}</p>
      ) : (
        <CalendarGrid
          meetings={result.meetings ?? []}
          candidates={candidates}
          vacancies={
            demo.enabled
              ? demo.state.vacancies.map((vacancy) => ({
                  id: vacancy.id,
                  title: vacancy.title,
                  department: vacancy.department,
                  description: vacancy.description,
                  requirements: vacancy.requirements ?? [],
                  status: vacancy.status ?? (vacancy.open ? "open" : "closed"),
                }))
              : jobs
          }
          canCreate={canCreate}
          onCreateMeeting={createMeeting}
        />
      )}
    </main>
  );
}
