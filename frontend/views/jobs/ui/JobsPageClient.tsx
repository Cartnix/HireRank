"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { CreateVacancyPayload, Job, Stage } from "@/entities/job";
import { JobsView } from "@/views/jobs";
import { NewJobModal } from "@/features/create-vacancy";
import { addVacancy, removeVacancy } from "@/features/hr-copilot/model/engine";
import {
  toDashboardCandidate,
  toDashboardJob,
} from "@/features/hr-copilot/model/dashboardAdapters";
import {
  loadCopilotState,
  saveCopilotState,
} from "@/features/hr-copilot/model/storage";
import type { CopilotState } from "@/features/hr-copilot/model/types";

type Props = {
  initialSelectedJobId?: string | null;
};

export function JobsPageClient({
  initialSelectedJobId = null,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [copilotState, setCopilotState] = useState<CopilotState | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    initialSelectedJobId,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCopilotState(loadCopilotState());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const tenantId = copilotState?.tenants[0]?.id ?? "";
  const jobs = useMemo(
    () =>
      copilotState?.vacancies
        .filter((vacancy) => vacancy.tenantId === tenantId)
        .map(toDashboardJob) ?? [],
    [copilotState, tenantId],
  );
  const candidates = useMemo(() => {
    const vacanciesById = new Map(
      copilotState?.vacancies.map((vacancy) => [vacancy.id, vacancy]) ?? [],
    );
    return (
      copilotState?.candidates
        .filter((candidate) => candidate.tenantId === tenantId)
        .map((candidate) =>
          toDashboardCandidate(
            candidate,
            vacanciesById.get(candidate.vacancyId ?? candidate.requestedVacancyId ?? ""),
          ),
        ) ?? []
    );
  }, [copilotState, tenantId]);

  const jobById = useMemo(() => {
    const map: Record<string, Job> = {};
    jobs.forEach((job) => {
      map[job.id] = job;
    });
    return map;
  }, [jobs]);

  const selectedJob = selectedJobId ? (jobById[selectedJobId] ?? null) : null;

  const handleOpenJob = (id: string) => {
    setSelectedJobId(id);
    router.push(`${pathname === "/dashboard/jobs" ? pathname : "/dashboard/jobs"}/${id}`);
  };

  const handleBack = () => {
    setSelectedJobId(null);
    router.push("/dashboard/jobs");
  };

  const handleOpenCandidate = (id: string) => {
    router.push(`/dashboard/candidates/${id}`);
  };

  const handleUpdateStages = (stages: Stage[]) => {
    void stages;
  };

  const handleDeleteJob = async (id: string) => {
    if (!copilotState) throw Error("Данные Copilot ещё загружаются");
    const next = structuredClone(copilotState);
    removeVacancy(next, tenantId, "hr", id);
    saveCopilotState(next);
    setCopilotState(next);
  };

  const handleJobCreated = (job: Job) => {
    setSelectedJobId(job.id);
    setIsCreateModalOpen(false);
  };

  const createCopilotVacancy = async (payload: CreateVacancyPayload) => {
    if (!copilotState || !tenantId) throw Error("Данные Copilot ещё загружаются");
    const next = structuredClone(copilotState);
    const vacancy = addVacancy(next, tenantId, "hr", {
      title: payload.title,
      department: payload.department,
      location: payload.location ?? "",
      description: [payload.description, ...payload.requirements]
        .filter(Boolean)
        .join("\n\n"),
      open: payload.status === "open",
    });
    saveCopilotState(next);
    setCopilotState(next);
    return toDashboardJob(vacancy);
  };

  if (!copilotState) return <div>Loading...</div>;

  return (
    <>
      <JobsView
        jobs={jobs}
        candidates={candidates}
        selectedJob={selectedJob}
        onOpenJob={handleOpenJob}
        onBack={handleBack}
        onCreateJob={() => setIsCreateModalOpen(true)}
        onUpdateStages={handleUpdateStages}
        onOpenCandidate={handleOpenCandidate}
        onDeleteJob={handleDeleteJob}
      />
      {isCreateModalOpen && (
        <NewJobModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleJobCreated}
          createJob={createCopilotVacancy}
        />
      )}
    </>
  );
}