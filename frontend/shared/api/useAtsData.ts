"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/features/auth/AuthProvider";
import type { Candidate } from "@/entities/candidate/model/types";
import type { Job } from "@/entities/job/model/types";
import { candidateDetail, listCandidateViews, listVacancyViews, vacancyDetail } from "./ats";

export function useAtsData(candidateId?: string | null, vacancyId?: string | null) {
  const { user, isLoading: sessionLoading } = useAuthSession();
  const [data, setData] = useState<{ candidates: Candidate[]; jobs: Job[] }>({ candidates: [], jobs: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  const can = useCallback((permission: string) => user?.permissions?.includes(permission) ?? false, [user]);
  useEffect(() => {
    if (sessionLoading) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      if (!user) { setError("Войдите в аккаунт для доступа к ATS"); setLoading(false); return; }
      try {
        const [candidates, jobs, candidate, vacancy] = await Promise.all([
          user.permissions?.includes("candidate.read") ? listCandidateViews() : Promise.resolve([]),
          listVacancyViews(),
          candidateId ? candidateDetail(candidateId) : Promise.resolve(null),
          vacancyId ? vacancyDetail(vacancyId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        if (candidate && !candidates.some(c => c.id === candidate.id)) candidates.push(candidate);
        if (vacancy && !jobs.some(j => j.id === vacancy.id)) jobs.push(vacancy);
        setData({ candidates, jobs });
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Не удалось загрузить ATS"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [user, sessionLoading, candidateId, vacancyId, version]);
  return { ...data, user, can, loading: loading || sessionLoading, error, reload };
}
