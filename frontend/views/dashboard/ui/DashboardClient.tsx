"use client";

import { useDemo } from "@/features/demo/DemoProvider";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { useEffect, useState } from "react";
import { apiFetch } from "@/shared/api/client";
import type { DashboardAnalytics } from "@/widgets/dashboard-stats/model/analytics";
import { DashboardPageView } from "./DashboardView";

export function DashboardClient() {
  const demo = useDemo();
  const { user } = useAuthSession();
  const endpoint = demo.enabled ? `/developer/analytics?role=${demo.role}` : "/dashboard/analytics";
  const [result, setResult] = useState<{ endpoint: string; data?: DashboardAnalytics; error?: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!user || !demo.ready) return;
    void apiFetch<DashboardAnalytics>(endpoint, { cache: "no-store" }).then(data => {
      if (!cancelled) setResult({ endpoint, data });
    }).catch(error => {
      if (!cancelled) setResult({ endpoint, error: error instanceof Error ? error.message : "Не удалось загрузить аналитику" });
    });
    return () => { cancelled = true; };
  }, [endpoint, user, demo.ready]);
  if (result?.endpoint !== endpoint) return <p>Загрузка аналитики...</p>;
  if (result.error) return <p role="alert">{result.error}</p>;
  const data = result.data;
  if (!data) return <p>Загрузка аналитики...</p>;
  const candidateLink = (id: string) => {
    const candidate = demo.enabled ? demo.state.candidates.find(c => c.email === data.top_candidates.find(top => top.id === id)?.email) : undefined;
    return `/dashboard/candidates/${candidate?.id ?? id}`;
  };
  return <DashboardPageView live analytics={data} candidateLink={candidateLink} activeJobsCount={data.active_jobs}
    inProgressCandidates={data.total_candidates} todaysInterviewsCount={data.todays_interviews}
    avgTimeToHire={data.avg_time_to_hire ?? 0} />;
}
