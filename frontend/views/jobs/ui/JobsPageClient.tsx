"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Candidate } from "@/entities/candidate";
import { type Job } from "@/entities/job";
import { JobsView } from "@/views/jobs";
import VacancyModal, {
  type VacancyFormData,
} from "@/widgets/vacancy-create/ui/VacancyCreateCard";

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
  const [jobs, setJobs] = useState<Job[]>(
    Array.isArray(initialJobs) ? initialJobs : [],
  );
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

  const handleCreateJob = (data: VacancyFormData) => {
    const payload = {
      title: data.title,
      status: "draft" as const,
      department: data.department,
      description: data.description,
      requirements: data.requirements,
    };

    const newJob: Job = {
      id: `job-${Date.now()}`,
      ...payload,
    };

    setJobs((prev) => [newJob, ...prev]);
    setSelectedJobId(newJob.id);

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
      <VacancyModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateJob}
      />
    </>
  );
}
