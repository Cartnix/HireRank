"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVacancy, deleteVacancy, updateVacancy, type Job } from "@/entities/job";
import { JobsView } from "@/views/jobs";
import { NewJobModal } from "@/features/create-vacancy";
import { useAtsData } from "@/shared/api/useAtsData";

export function JobsPageClient({ initialSelectedJobId = null }: { initialSelectedJobId?: string | null }) {
  const router = useRouter();
  const { jobs, candidates, can, loading, error, reload } = useAtsData(null, initialSelectedJobId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const selectedJob = jobs.find(j => j.id === initialSelectedJobId) ?? null;
  const runUpdate = async (id: string, payload: Parameters<typeof updateVacancy>[1]) => {
    setActionError("");
    try { await updateVacancy(id, payload); reload(); }
    catch (e) { setActionError(e instanceof Error ? e.message : "Не удалось изменить вакансию"); }
  };
  if (loading) return <div>Загрузка вакансий...</div>;
  if (error) return <div role="alert">{error}<button onClick={reload} className="ml-3 text-brand-primary">Повторить</button></div>;
  return <>
    {actionError && <p role="alert" className="text-danger">{actionError}</p>}
    <JobsView jobs={jobs} candidates={candidates} selectedJob={selectedJob}
      onOpenJob={id => router.push(`/dashboard/jobs/${id}`)} onBack={() => router.push("/dashboard/jobs")}
      onCreateJob={() => setIsCreateModalOpen(true)} canCreate={can("vacancy.create")} canUpdate={can("vacancy.update")} canDelete={can("vacancy.delete")}
      onUpdateJob={runUpdate} onUpdateStages={() => setActionError("Демо · редактирование этапов ожидает backend")}
      onOpenCandidate={id => router.push(`/dashboard/candidates/${id}`)}
      onDeleteJob={async id => { await deleteVacancy(id); reload(); }} />
    {isCreateModalOpen && <NewJobModal onClose={() => setIsCreateModalOpen(false)} createJob={createVacancy}
      onCreate={(job: Job) => { setIsCreateModalOpen(false); reload(); router.push(`/dashboard/jobs/${job.id}`); }} />}
  </>;
}
