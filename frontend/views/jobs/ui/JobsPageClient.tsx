"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_STAGES, type Job } from "@/entities/job";
import { JobsView } from "@/views/jobs";
import VacancyModal, {
  type VacancyFormData,
} from "@/widgets/vacancy-create/ui/VacancyCreateCard";

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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    initialSelectedJobId,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const handleCreateJob = (data: VacancyFormData) => {
    const newJob: Job = {
      id: `job-${Date.now()}`,
      title: data.title,
      department: data.faculty || data.company || "Новый отдел",
      status: "Открыта",
      createdAt: new Date().toISOString(),
      location: data.workFormat === "remote" ? "Удалённо" : data.workFormat === "office" ? "Офис" : "Гибрид",
      employmentType: data.employmentType,
      description: data.description || `Вакансия ${data.title}`,
      stages: DEFAULT_STAGES,
      salaryMin: data.salaryFrom ? Number(data.salaryFrom) : null,
      salaryMax: data.salaryTo ? Number(data.salaryTo) : null,
      currency: "₸",
      workMode: data.workFormat === "office" ? "Офис" : data.workFormat === "remote" ? "Удалённо" : "Гибрид",
      experienceLevel: data.level === "student" ? "Неважно" : data.level === "junior" ? "Junior" : "Junior",
      requiredSkills: data.stack,
      closingDate: data.deadline || undefined,
      recruiter: "Вы",
    };

    setJobs((prev) => [newJob, ...prev]);
    setSelectedJobId(newJob.id);
    router.push(`${pathname}/${newJob.id}`);
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
