"use client";
import { useRouter } from "next/navigation";
import { JobsView } from "@/views/jobs";
import { NewJobModal } from "@/features/create-vacancy";
import { toDashboardJob, toDashboardCandidate } from "@/features/hr-copilot/model/dashboardAdapters";
import { useState } from "react";
import { canReadDemoCandidate } from "./access";
import { useDemo, DEMO_TENANT } from "./DemoProvider";
import { addVacancy, removeVacancy } from "@/features/hr-copilot/model/engine";
import { VacancySchema } from "@/features/hr-copilot/model/types";
import { AuditTab } from "@/features/hr-copilot/ui/tabs/AuditTab";

export function DemoJobs({ initialId }: { initialId?: string | null }) {
  const { state, role, update, message, canMutate } = useDemo();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialId ?? null);
  const [creating, setCreating] = useState(false);
  const write = canMutate && ["hr", "administrator", "superuser"].includes(role);
  const jobs = state.vacancies.filter(v => v.tenantId === DEMO_TENANT).map(toDashboardJob);
  const candidates = state.candidates.filter(c => canReadDemoCandidate(role, c)).map(c => toDashboardCandidate(c));
  const selectedJob = jobs.find(v => v.id === selectedId) ?? null;
  return <>
    {message && <p role="alert">{message}</p>}
    <JobsView jobs={jobs} candidates={candidates} selectedJob={selectedJob}
      canCreate={write} canUpdate={write} canDelete={write}
      onOpenJob={setSelectedId} onBack={() => setSelectedId(null)}
      onOpenCandidate={id => router.push(`/dashboard/candidates/${id}`)} onCreateJob={() => setCreating(true)}
      onUpdateJob={async (id, input) => {
        update(next => {
          if (!write) throw Error("Нет права изменения вакансий");
          const index = next.vacancies.findIndex(v => v.id === id);
          const job = next.vacancies[index];
          next.vacancies[index] = VacancySchema.parse({ ...job, ...input, open: input.status ? input.status === "open" : job.open });
          next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: null, actor: role, action: "vacancy.updated", detail: job.title, createdAt: new Date().toISOString() });
        });
      }}
      onUpdateStages={stages => { if (!write || !selectedJob) return; update(next => { next.vacancies.find(v => v.id === selectedJob.id)!.stages = stages; next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: null, actor: role, action: "vacancy.stages.updated", detail: selectedJob.title, createdAt: new Date().toISOString() }); }); }}
      onDeleteJob={async id => { if (!write) return; if (update(next => removeVacancy(next, DEMO_TENANT, role, id))) setSelectedId(null); }} />
    {creating && write && <NewJobModal onClose={() => setCreating(false)}
      createJob={async input => {
        let created: ReturnType<typeof addVacancy> | undefined;
        if (!update(next => { created = addVacancy(next, DEMO_TENANT, role, { ...input, department: input.department ?? "", description: input.description ?? "", location: "", open: input.status === "open" }); })) throw Error("Не удалось создать вакансию");
        return toDashboardJob(created!);
      }}
      onCreate={job => { setCreating(false); router.push(`/dashboard/jobs/${job.id}`); }} />}
  </>;
}
export { CopilotSettings } from "@/features/hr-copilot/ui/CopilotSettings";
export function DemoAudit() {
  const demo = useDemo();
  if (!demo.enabled || !["administrator", "superuser"].includes(demo.role)) return <p role="alert">Журнал действий доступен только администратору.</p>;
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Dev mode · Журнал действий</h1><AuditTab state={demo.state} tenantId={DEMO_TENANT}  /></div>;
}
