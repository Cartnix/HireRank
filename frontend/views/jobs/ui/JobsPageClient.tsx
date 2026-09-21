"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCandidates, type Candidate } from "@/entities/candidate";
import { getVacancies, type Job, type Stage } from "@/entities/job";
import { JobsView } from "@/views/jobs";
import { NewJobModal } from "@/features/create-vacancy";

type Props = {
  initialSelectedJobId?: string | null;
};

export function JobsPageClient({
  initialSelectedJobId = null,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    initialSelectedJobId,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([getVacancies(), getCandidates()])
      .then(([jobsData, candidatesData]) => {
        if (cancelled) return;
        setJobs(Array.isArray(jobsData) ? (jobsData as Job[]) : []);
        setCandidates(
          Array.isArray(candidatesData) ? (candidatesData as Candidate[]) : [],
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Ошибка загрузки данных");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
    if (!selectedJob) return;
    setJobs((prev) =>
      prev.map((j) => (j.id === selectedJob.id ? { ...j, stages } : j)),
    );
  };

  const handleJobCreated = (job: Job) => {
    setJobs((prev) => [job, ...prev]);
    setSelectedJobId(job.id);
    setIsCreateModalOpen(false);
  };

  if (loading) return <div>Loading...</div>;

  if (error) {
    return <div>Не удалось загрузить данные: {error}</div>;
  }

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
      />
      {isCreateModalOpen && (
        <NewJobModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleJobCreated}
        />
      )}
    </>
  );
}