"use client";
import { useState, type FormEvent } from "react";
import { DashboardPageView } from "@/views/dashboard/ui/DashboardView";
import { dashboardMock } from "@/app/dashboard/dashboard.mock";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { canReadDemoCandidate } from "./access";
import { useDemo, DEMO_TENANT } from "./DemoProvider";
import { addVacancy, removeVacancy, freshState } from "@/features/hr-copilot/model/engine";
import { VacancySchema, type Action } from "@/features/hr-copilot/model/types";
import { actionLabel, card, primary, secondary, inputClass } from "@/features/hr-copilot/ui/constants";
import { AuditTab } from "@/features/hr-copilot/ui/tabs/AuditTab";

export function DemoJobs({ initialId }: { initialId?: string | null }) {
  const { state, role, update, message } = useDemo();
  const [editing, setEditing] = useState<string | null>(initialId ?? null);
  const write = role === "hr" || role === "administrator";
  const jobs = state.vacancies.filter(v => v.tenantId === DEMO_TENANT);
  const job = jobs.find(v => v.id === editing);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    const input = { title: String(values.get("title")).trim(), department: String(values.get("department")).trim(), location: String(values.get("location")).trim(), description: String(values.get("description")).trim(), requirements: String(values.get("requirements")).split(",").map(s => s.trim()).filter(Boolean), open: values.get("open") === "on" };
    if (update(next => {
      if (!write) throw Error("Нет права изменения вакансий");
      if (job) { const index = next.vacancies.findIndex(v => v.id === job.id); next.vacancies[index] = VacancySchema.parse({ ...job, ...input }); next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: null, actor: role, action: "vacancy.updated", detail: input.title, createdAt: new Date().toISOString() }); }
      else addVacancy(next, DEMO_TENANT, role, input);
    })) setEditing(null);
  }
  return <div className="space-y-5"><header className="flex justify-between gap-3"><h1 className="text-2xl font-semibold">Dev mode · Вакансии</h1>{write && <button className={primary} onClick={() => setEditing("new")}>Создать вакансию</button>}</header>{message && <p role="alert">{message}</p>}{editing && <section className={card}><h2 className="mt-0 mb-4 text-base font-semibold leading-normal">{job ? job.title : "Новая вакансия"}</h2>{write ? <form key={editing} onSubmit={save} className="grid gap-4 md:grid-cols-2">{(["title", "department", "location"] as const).map((name, i) => <label key={name} className="text-xs">{["Название", "Отдел", "Расположение"][i]}<input required minLength={name === "title" ? 2 : 1} name={name} defaultValue={job?.[name]} className={`${inputClass} mt-2`} /></label>)}<label className="text-xs">Навыки через запятую<input name="requirements" defaultValue={job?.requirements?.join(", ")} className={`${inputClass} mt-2`} /></label><label className="text-xs md:col-span-2">Описание<textarea required minLength={4} rows={4} name="description" defaultValue={job?.description} className={`${inputClass} mt-2`} /></label><label className="text-sm"><input type="checkbox" name="open" defaultChecked={job?.open ?? true} /> Открыта</label><div className="flex gap-2"><button className={primary}>Сохранить</button><button type="button" className={secondary} onClick={() => setEditing(null)}>Закрыть</button></div></form> : <><p className="whitespace-pre-wrap text-sm">{job?.description}</p><p className="mt-3 text-sm">{job?.requirements?.join(", ")}</p><button className={`${secondary} mt-4`} onClick={() => setEditing(null)}>Закрыть</button></>}</section>}<div className="grid gap-4 lg:grid-cols-2">{jobs.map(v => <article key={v.id} className={card}><button className="w-full text-left" onClick={() => setEditing(v.id)}><h2 className="m-0 text-base font-semibold leading-normal">{v.title}</h2><p className="mt-2 text-xs text-muted-foreground">{v.department} · {v.location} · {v.open ? "Открыта" : "Закрыта"}</p><p className="mt-3 text-sm">{v.description}</p></button>{write && <div className="mt-4 flex flex-wrap gap-2"><button className={secondary} onClick={() => setEditing(v.id)}>Редактировать</button><button className={secondary} onClick={() => update(next => { if (!write) throw Error("Нет права изменения"); next.vacancies.find(job => job.id === v.id)!.open = !v.open; next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: null, actor: role, action: "vacancy.updated", detail: `${v.title}: ${!v.open ? "открыта" : "закрыта"}`, createdAt: new Date().toISOString() }); })}>{v.open ? "Закрыть вакансию" : "Открыть вакансию"}</button><button className={`${secondary} text-destructive`} onClick={() => { if (confirm(`Удалить «${v.title}»?`)) update(next => removeVacancy(next, DEMO_TENANT, role, v.id)); }}>Удалить</button></div>}</article>)}</div>{!jobs.length && <p>Вакансий пока нет.</p>}</div>;
}
export function CopilotSettings() {
  const demo = useDemo(); const { user } = useAuthSession();
  const role = demo.enabled ? demo.role : user?.role;
  const prompt = demo.state.prompts.find(p => p.tenantId === DEMO_TENANT)!;
  if (role !== "hr" && role !== "administrator") return <p role="alert">Настройки Copilot доступны HR и администратору.</p>;
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    demo.update(next => { const p = next.prompts.find(p => p.tenantId === DEMO_TENANT)!; const text = String(data.get("prompt")).trim(); const actions = data.getAll("action") as Action[]; if (text.length < 12 || !actions.length) throw Error("Укажите инструкцию и хотя бы одно действие"); p.text = text; p.allowedActions = actions; p.useMemory = data.get("memory") === "on"; p.version++; next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: null, actor: role as "hr" | "administrator", action: "prompt.updated", detail: `v${p.version}`, createdAt: new Date().toISOString() }); });
  }
  return <div className="mx-auto max-w-3xl space-y-5"><h1 className="text-2xl font-semibold">Dev mode · Настройки HR Copilot</h1><p className="text-sm text-muted-foreground">Инструкция применяется к следующим анализам. Откройте HR Copilot в карточке кандидата для работы с рекомендациями.</p>{demo.message && <p role="alert">{demo.message}</p>}<form key={prompt.version} onSubmit={save} className={`${card} space-y-5`}><label className="block text-sm font-semibold">Инструкция Copilot<textarea required minLength={12} name="prompt" rows={8} defaultValue={prompt.text} className={`${inputClass} mt-3`} /></label><fieldset><legend className="mb-3 text-sm font-semibold">Разрешённые рекомендации</legend><div className="flex flex-wrap gap-2">{Object.entries(actionLabel).map(([action, name]) => <label key={action} className={secondary}><input type="checkbox" name="action" value={action} defaultChecked={prompt.allowedActions.includes(action as Action)} /> {name}</label>)}</div></fieldset><label className="flex gap-2 text-sm"><input type="checkbox" name="memory" defaultChecked={prompt.useMemory} /> Использовать подтверждённую память HR</label><button className={primary}>Сохранить настройки · v{prompt.version}</button></form></div>;
}
export function DemoAudit() {
  const demo = useDemo(); const { user } = useAuthSession();
  if ((demo.enabled ? demo.role : user?.role) !== "administrator") return <p role="alert">Журнал действий доступен только администратору.</p>;
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Dev mode · Журнал действий</h1><AuditTab state={demo.state} tenantId={DEMO_TENANT} onResetDemo={() => { if (confirm("Сбросить демо?")) demo.update(next => Object.assign(next, freshState())); }} /></div>;
}
export function DemoDashboard() {
  const { state, role } = useDemo();
  const candidates = state.candidates.filter(c => canReadDemoCandidate(role, c));
  return <DashboardPageView {...dashboardMock} activeJobsCount={state.vacancies.filter(v => v.tenantId === DEMO_TENANT && v.open).length} inProgressCandidates={candidates.length} candidateLabel={role === "manager" ? "Назначенные кандидаты" : role === "candidate" ? "Моя анкета" : "Кандидаты"} />;
}
