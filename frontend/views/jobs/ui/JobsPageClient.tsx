"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { type Job } from "@/entities/job";
import { JobsView } from "@/views/jobs";

type Props = {
  initialCandidates: any[];
  initialJobs: Job[];
  initialSelectedJobId?: string | null;
};

export function JobsPageClient({
  initialCandidates,
  initialJobs,
  initialSelectedJobId = null,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [candidates] = useState(initialCandidates);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(initialSelectedJobId);
  const [, setShowNewJobmodal] = useState(false);

  useEffect(() => {
    setSelectedJobId(initialSelectedJobId ?? null);
  }, [initialSelectedJobId]);

  const jobById = useMemo(() => {
    const map: Record<string, Job> = {};

    jobs.forEach((job) => {
      map[job.id] = job;
    });

    return map;
  }, [jobs]);

  const selectedJob = selectedJobId ? jobById[selectedJobId] : null;

  const handleOpenJob = (id: string) => {
    setSelectedJobId(id);
    router.push(`${pathname}/${id}`);
  };

  const handleBack = () => {
    setSelectedJobId(null);
    router.push("/dashboard/jobs");
  };

  const handleOpenCandidate = (id: string) => {
    router.push(`/dashboard/candidates/${id}`);
  };

  return (
    <JobsView
      jobs={jobs}
      candidates={candidates}
      selectedJob={selectedJob}
      onOpenJob={handleOpenJob}
      onBack={handleBack}
      onCreateJob={() => setShowNewJobmodal(true)}
      onUpdateStages={(stages) =>
        setJobs((prev) =>
          prev.map((j) => (j.id === selectedJob?.id ? { ...j, stages } : j)),
        )
      }
      onOpenCandidate={handleOpenCandidate}
    />
  );
}