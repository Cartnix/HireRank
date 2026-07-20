"use client";

import { useMemo, useState } from "react";
import { type Job } from "@/entities/job";
import { JobsView } from "@/views/jobs";

type Props = {
  initialCandidates: any[];
  initialJobs: Job[];
};

export function JobsPageClient({
  initialCandidates,
  initialJobs,
}: Props) {
  const [candidates] = useState(initialCandidates);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [, setShowNewJobmodal] = useState(false);

  const jobById = useMemo(() => {
    const map: Record<string, Job> = {};

    jobs.forEach((job) => {
      map[job.id] = job;
    });

    return map;
  }, [jobs]);

  const selectedJob = selectedJobId ? jobById[selectedJobId] : null;

  return (
    <JobsView
      jobs={jobs}
      candidates={candidates}
      selectedJob={selectedJob}
      onOpenJob={setSelectedJobId}
      onBack={() => setSelectedJobId(null)}
      onCreateJob={() => setShowNewJobmodal(true)}
      onUpdateStages={(stages) =>
        setJobs((prev) =>
          prev.map((j) => (j.id === selectedJob?.id ? { ...j, stages } : j)),
        )
      }
      onOpenCandidate={(id) => {
        console.log("open candidate", id);
      }}
    />
  );
}