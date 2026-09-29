"use client";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/shared/api/client";
import type { DashboardDTO } from "@/shared/api/ats";
import { DashboardPageView } from "./DashboardView";
import { dashboardMock } from "@/app/dashboard/dashboard.mock";

export function DashboardClient() {
  const { user } = useAuthSession();
  const [dashboard, setDashboard] = useState<DashboardDTO | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    void apiFetch<DashboardDTO>("/dashboard").then(value => { if (!cancelled) setDashboard(value); }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Не удалось загрузить сводку"); });
    return () => { cancelled = true; };
  }, [user]);
  if (error) return <p role="alert">{error}</p>;
  if (!dashboard) return <p>Загрузка сводки...</p>;
  const candidateCount = "total_candidates" in dashboard ? dashboard.total_candidates : "assigned_candidates" in dashboard ? dashboard.assigned_candidates : undefined;
  return <DashboardPageView {...dashboardMock} live
    activeJobsCount={"open_vacancies" in dashboard ? dashboard.open_vacancies : dashboardMock.activeJobsCount}
    inProgressCandidates={candidateCount ?? dashboardMock.inProgressCandidates}
    candidateLabel={dashboard.role === "manager" ? "Назначенные кандидаты" : "Всего кандидатов"}
    demoActiveJobs={!("open_vacancies" in dashboard)} demoCandidates={candidateCount === undefined} />;
}
