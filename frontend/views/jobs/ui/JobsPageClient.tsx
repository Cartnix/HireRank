"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Candidate } from "@/entities/candidate";
import type { Job } from "@/entities/job";
import { JobsView } from "@/views/jobs";
import { NewJobModal } from "@/features/create-vacancy";

type Props = {
  initialCandidates: Candidate[];
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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    initialSelectedJobId,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const handleCreateJob = (job: Job) => {
    setJobs((prev) => [job, ...prev]);
    setSelectedJobId(job.id);
    router.push(`${pathname}/${job.id}`);
    setIsCreateModalOpen(false);
  };

  return (
    <>
      <JobsView
        jobs={jobs}
        candidates={candidates}
        selectedJob={selectedJob}
        onOpenJob={handleOpenJob}
        onBack={handleBack}
        onCreateJob={() => setIsCreateModalOpen(true)}
        onUpdateStages={(stages) =>
          setJobs((prev) =>
            prev.map((j) => (j.id === selectedJob?.id ? { ...j, stages } : j)),
          )
        }
        onOpenCandidate={handleOpenCandidate}
      />

      {isCreateModalOpen && (
        <NewJobModal
        onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateJob}
        />
      )}
    </>
  );
}