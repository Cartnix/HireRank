"use client";
import { useRouter } from "next/navigation";
import { JobsView } from "@/views/jobs";
import { NewJobModal } from "@/features/create-vacancy";
import { toDashboardJob, toDashboardCandidate } from "@/features/hr-copilot/model/dashboardAdapters";
import { useState, type FormEvent } from "react";
import { DashboardPageView } from "@/views/dashboard/ui/DashboardView";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { canReadDemoCandidate } from "./access";
import { useDemo, DEMO_TENANT } from "./DemoProvider";
import { addVacancy, removeVacancy } from "@/features/hr-copilot/model/engine";
import { VacancySchema, type Action } from "@/features/hr-copilot/model/types";
import { actionLabel, card, primary, secondary, inputClass } from "@/features/hr-copilot/ui/constants";
import { AuditTab } from "@/features/hr-copilot/ui/tabs/AuditTab";

export function DemoJobs({ initialId }: { initialId?: string | null }) {
  const { state, role, update, message, canMutate } = useDemo();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const write = canMutate && ["hr", "administrator", "superuser"].includes(role);
  const jobs = state.vacancies.filter(v => v.tenantId === DEMO_TENANT).map(toDashboardJob);
  const candidates = state.candidates.filter(c => canReadDemoCandidate(role, c)).map(c => toDashboardCandidate(c));
  const selectedJob = jobs.find(v => v.id === initialId) ?? null;
  return <>
    {message && <p role="alert">{message}</p>}
    <JobsView jobs={jobs} candidates={candidates} selectedJob={selectedJob}
      canCreate={write} canUpdate={write} canDelete={write}
      onOpenJob={id => router.push(`/dashboard/jobs/${id}`)} onBack={() => router.push("/dashboard/jobs")}
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
      onDeleteJob={async id => { if (!write) return; if (update(next => removeVacancy(next, DEMO_TENANT, role, id))) router.push("/dashboard/jobs"); }} />
    {creating && write && <NewJobModal onClose={() => setCreating(false)}
      createJob={async input => {
        let created: ReturnType<typeof addVacancy> | undefined;
        if (!update(next => { created = addVacancy(next, DEMO_TENANT, role, { ...input, department: input.department ?? "", description: input.description ?? "", location: "", open: input.status === "open" }); })) throw Error("Не удалось создать вакансию");
        return toDashboardJob(created!);
      }}
      onCreate={job => { setCreating(false); router.push(`/dashboard/jobs/${job.id}`); }} />}
  </>;
}
export function CopilotSettings() {
  const demo = useDemo(); const { user } = useAuthSession();
  const role = demo.enabled ? demo.role : user?.role;
  const prompt = demo.state.prompts.find(p => p.tenantId === DEMO_TENANT)!;
  if (!demo.enabled || !["hr", "administrator", "superuser"].includes(role ?? "")) return <p role="alert">Настройки Copilot доступны HR и администратору.</p>;
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    demo.update(next => { const p = next.prompts.find(p => p.tenantId === DEMO_TENANT)!; const text = String(data.get("prompt")).trim(); const actions = data.getAll("action") as Action[]; if (text.length < 12 || !actions.length) throw Error("Укажите инструкцию и хотя бы одно действие"); p.text = text; p.allowedActions = actions; p.useMemory = data.get("memory") === "on"; p.version++; next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: null, actor: role as "hr" | "administrator", action: "prompt.updated", detail: `v${p.version}`, createdAt: new Date().toISOString() }); });
  }
  return <div className="mx-auto max-w-3xl space-y-5"><h1 className="text-2xl font-semibold">Dev mode · Настройки HR Copilot</h1><p className="text-sm text-muted-foreground">Инструкция применяется к следующим анализам. Откройте HR Copilot в карточке кандидата для работы с рекомендациями.</p>{demo.message && <p role="alert">{demo.message}</p>}<fieldset disabled={!demo.canMutate}><form key={prompt.version} onSubmit={save} className={`${card} space-y-5`}><label className="block text-sm font-semibold">Инструкция Copilot<textarea required minLength={12} name="prompt" rows={8} defaultValue={prompt.text} className={`${inputClass} mt-3`} /></label><fieldset><legend className="mb-3 text-sm font-semibold">Разрешённые рекомендации</legend><div className="flex flex-wrap gap-2">{Object.entries(actionLabel).map(([action, name]) => <label key={action} className={secondary}><input type="checkbox" name="action" value={action} defaultChecked={prompt.allowedActions.includes(action as Action)} /> {name}</label>)}</div></fieldset><label className="flex gap-2 text-sm"><input type="checkbox" name="memory" defaultChecked={prompt.useMemory} /> Использовать подтверждённую память HR</label><button className={primary}>Сохранить настройки · v{prompt.version}</button></form></fieldset></div>;
}
export function DemoAudit() {
  const demo = useDemo();
  if (!demo.enabled || !["administrator", "superuser"].includes(demo.role)) return <p role="alert">Журнал действий доступен только администратору.</p>;
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Dev mode · Журнал действий</h1><AuditTab state={demo.state} tenantId={DEMO_TENANT}  /></div>;
}
export function DemoDashboard() {
  const { state, role } = useDemo();
  const candidates = state.candidates.filter(c => canReadDemoCandidate(role, c));
  return <DashboardPageView live todaysInterviewsCount={0} avgTimeToHire={0} demoActiveJobs demoCandidates activeJobsCount={state.vacancies.filter(v => v.tenantId === DEMO_TENANT && v.open).length} inProgressCandidates={candidates.length} candidateLabel={role === "manager" ? "Назначенные кандидаты" : role === "candidate" ? "Моя анкета" : "Кандидаты"} />;
}
