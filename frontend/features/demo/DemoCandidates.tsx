"use client";
import { useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { canReadDemoCandidate } from "./access";
import { useDemo, DEMO_TENANT } from "./DemoProvider";
import { intake, evaluate, confirmDecision, saveMemory } from "@/features/hr-copilot/model/engine";
import { IntakeTab } from "@/features/hr-copilot/ui/tabs/IntakeTab";
import { actionLabel, statusLabel, inputClass, primary, secondary, card } from "@/features/hr-copilot/ui/constants";
import type { Action, Candidate } from "@/features/hr-copilot/model/types";

// A deterministic demo matching score: percentage of vacancy skills present in the resume.
export function demoScore(candidate: Candidate, description: string) {
  const terms = description.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(word => word.length > 3);
  const unique = [...new Set(terms)];
  const resume = `${candidate.skills} ${candidate.experience} ${candidate.resumeText}`.toLowerCase();
  return unique.length ? Math.round(unique.filter(term => resume.includes(term)).length / unique.length * 100) : 0;
}
export function DemoCandidates({ initialId }: { initialId?: string | null }) {
  const { state, role, update, message } = useDemo();
  const reduced = useReducedMotion();
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("");
  const [stage, setStage] = useState("");
  const [vacancyFilter, setVacancyFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<string | null>(initialId ?? null);
  const [copilotId, setCopilotId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState<Record<string, Action>>({});
  const full = role === "hr" || role === "administrator";
  const vacancies = state.vacancies.filter(v => v.tenantId === DEMO_TENANT);
  const visible = state.candidates.filter(c => canReadDemoCandidate(role, c));
  const skills = [...new Set(visible.flatMap(c => c.skills.split(/[,;]/).map(s => s.trim()).filter(Boolean)))].sort();
  const score = (c: Candidate) => { const vacancy = vacancies.find(v => v.id === (vacancyFilter || c.vacancyId || c.requestedVacancyId)); return demoScore(c, [vacancy?.description, ...(vacancy?.requirements ?? [])].join(" ")); };
  const filtered = visible.filter(c => `${c.name} ${c.email} ${c.skills}`.toLowerCase().includes(search.toLowerCase()) && (!skill || c.skills.split(/[,;]/).some(s => s.trim().toLowerCase() === skill.toLowerCase())) && (!stage || c.status === stage) && (!vacancyFilter || c.vacancyId === vacancyFilter || c.requestedVacancyId === vacancyFilter)).sort((a, b) => sort === "score" ? score(b) - score(a) : sort === "name" ? a.name.localeCompare(b.name, "ru") : b.createdAt.localeCompare(a.createdAt));
  const candidate = visible.find(c => c.id === selected);
  const copilotCandidate = visible.find(c => c.id === copilotId);
  const evaluation = state.evaluations.find(e => e.candidateId === copilotCandidate?.id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    const file = event.currentTarget.querySelector<HTMLInputElement>('[name="resumeFile"]')?.files?.[0];
    const text = String(values.get("resumeText") ?? ""); const ref = file?.name || String(values.get("resumeUrl") ?? "") || (text.trim() ? "Текст резюме" : visible.find(c => c.id === (editId ?? (role === "candidate" ? "c-aliya" : "")))?.resumeRef ?? "");
    if (update(next => {
      if (!full && role !== "candidate" && role !== "recruiter") throw Error("Нет права на приём резюме");
      if (!ref || values.get("processingConsent") !== "on") throw Error("Добавьте резюме и согласие на обработку данных");
      const input = { name: String(values.get("name")), email: String(values.get("email")), phone: String(values.get("phone")), experience: String(values.get("experience")), skills: String(values.get("skills")), resumeRef: ref, resumeText: text, requestedVacancyId: String(values.get("vacancyId")) || null };
      if (role === "candidate" || (full && editId)) {
        const own = next.candidates.find(c => c.id === (role === "candidate" ? "c-aliya" : editId)); if (!own) throw Error("Анкета недоступна");
        Object.assign(own, input);
        const vacancy = next.vacancies.find(v => v.id === input.requestedVacancyId && v.open);
        if (vacancy) evaluate(next, own, vacancy, "intake-hook");
      } else intake(next, DEMO_TENANT, role === "recruiter" ? "recruiter" : "hr", input);
    })) setIntakeOpen(false);
  }
  function openCopilot(c: Candidate) {
    if (!full) return;
    if (!state.evaluations.some(e => e.candidateId === c.id)) {
      if (!update(next => { const vacancy = next.vacancies.find(v => v.id === (c.vacancyId || c.requestedVacancyId) && v.open) ?? next.vacancies.find(v => v.tenantId === DEMO_TENANT && v.open); if (!vacancy) throw Error("Создайте открытую вакансию для анализа"); evaluate(next, c, vacancy, role); })) return;
    }
    setCopilotId(c.id); setReason("");
  }
  const panelMotion = { initial: { opacity: 0, x: reduced ? 0 : 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: reduced ? 0 : 24 }, transition: { duration: reduced ? 0 : .2 } };
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Dev mode · {role === "candidate" ? "Моя анкета" : role === "recruiter" ? "Приём резюме" : "Кандидаты"}</h1><p className="mt-1 text-sm text-muted-foreground">{role === "manager" ? "Кандидаты вашей вакансии Product Designer" : "HireRank · единая организация"}</p></div>{(full || role === "candidate" || role === "recruiter") && <button className={primary} onClick={() => { setEditId(null); setIntakeOpen(!intakeOpen); }}>{role === "candidate" ? "Редактировать мою анкету" : "Добавить резюме"}</button>}</header>
    {message && <p role="alert" className="rounded-lg bg-destructive/10 p-3">{message}</p>}
    {intakeOpen && <section className={card}><button className={`${secondary} mb-4`} onClick={() => setIntakeOpen(false)}>Закрыть форму</button><IntakeTab vacancies={vacancies} submitIntake={submit} key={editId ?? role} initialValues={role === "candidate" || editId ? (() => { const c = visible.find(c => c.id === (editId ?? "c-aliya")); return { ...c, resume_text: c?.resumeText, resume_reference: c?.resumeRef?.startsWith("http") ? c.resumeRef : "", requested_vacancy_id: c?.requestedVacancyId }; })() : undefined} /></section>}
    {role !== "recruiter" && <>
      <section aria-label="Фильтры кандидатов" className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs">Поиск<input aria-label="Поиск кандидатов" placeholder="Имя, email, навык" value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} mt-2`} /></label>
        <label className="text-xs">Навык<select value={skill} onChange={e => setSkill(e.target.value)} className={`${inputClass} mt-2`}><option value="">Все навыки</option>{skills.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="text-xs">Этап<select value={stage} onChange={e => setStage(e.target.value)} className={`${inputClass} mt-2`}><option value="">Все этапы</option>{Object.entries(statusLabel).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="text-xs">Вакансия<select value={vacancyFilter} onChange={e => setVacancyFilter(e.target.value)} className={`${inputClass} mt-2`}><option value="">Все вакансии</option>{vacancies.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></label>
        <label className="text-xs">Сортировка<select value={sort} onChange={e => setSort(e.target.value)} className={`${inputClass} mt-2`}><option value="newest">Сначала новые</option><option value="score">По баллам ↓</option><option value="name">По имени</option></select></label>
        <div className="flex items-center gap-3 text-xs text-muted-foreground md:col-span-2 xl:col-span-5">Найдено {filtered.length} из {visible.length}<button className="text-brand-primary" onClick={() => { setSearch(""); setSkill(""); setStage(""); setVacancyFilter(""); setSort("newest"); }}>Сбросить фильтры</button><span>Демо-балл: совпадение слов резюме с описанием вакансии</span></div>
      </section>
      <div className="flex flex-col items-start gap-4 xl:flex-row">
        <section aria-label="Пул кандидатов" className="w-full min-w-0 flex-1 space-y-3">{filtered.map(c => <article key={c.id} className={`${card} ${selected === c.id ? "border-brand-primary" : ""}`}><button aria-expanded={selected === c.id} className="block w-full text-left" onClick={() => setSelected(selected === c.id ? null : c.id)}><div className="flex justify-between gap-3"><strong>{c.name}</strong><span className="text-brand-primary">{score(c)} / 100</span></div><p className="mt-2 text-xs text-muted-foreground">{statusLabel[c.status]} · {vacancies.find(v => v.id === c.vacancyId)?.title ?? "Без назначения"}</p><div className="mt-3 flex flex-wrap gap-2">{c.skills.split(",").map(s => <span key={s} className="rounded-md bg-secondary px-2 py-1 text-xs">{s.trim()}</span>)}</div></button>{full && <button onClick={() => openCopilot(c)} className={`${secondary} mt-4 inline-flex items-center gap-2`}><Sparkles size={14} /> HR Copilot</button>}</article>)}{!filtered.length && <p className={card}>Кандидаты не найдены. Измените фильтры.</p>}</section>
        <AnimatePresence>{candidate && <motion.aside key="profile" {...panelMotion} aria-label="Анкета кандидата" className={`${card} w-full xl:w-80 xl:shrink-0`}><div className="flex justify-between gap-3"><h2 className="m-0 text-base font-semibold leading-normal">{candidate.name}</h2><button aria-label="Закрыть анкету" onClick={() => setSelected(null)}><X size={18} /></button></div><p className="mt-3 text-sm">{candidate.email}<br />{candidate.phone}</p><h3 className="mt-5 mb-0 text-sm font-semibold">Опыт</h3><p className="mt-2 whitespace-pre-wrap text-sm">{candidate.experience}</p><h3 className="mt-5 mb-0 text-sm font-semibold">Навыки</h3><p className="mt-2 text-sm">{candidate.skills}</p><h3 className="mt-5 mb-0 text-sm font-semibold">Резюме</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{candidate.resumeText || candidate.resumeRef}</p>{full && <button className={`${secondary} mt-4`} onClick={() => { setEditId(candidate.id); setIntakeOpen(true); }}>Редактировать анкету</button>}{full && <label className="mt-5 block text-xs">Назначить на вакансию<select className={`${inputClass} mt-2`} value={candidate.vacancyId ?? ""} onChange={e => update(next => { if (!full) throw Error("Нет права назначения"); const c = next.candidates.find(c => c.id === candidate.id)!; c.vacancyId = e.target.value || null; c.status = c.vacancyId ? "assigned" : "new"; next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: c.id, actor: role, action: "application.assigned", detail: c.vacancyId ?? "Без назначения", createdAt: new Date().toISOString() }); })}><option value="">Без назначения</option>{vacancies.filter(v => v.open).map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></label>}{role === "manager" && <form className="mt-5 space-y-3" onSubmit={event => { event.preventDefault(); if (update(next => { if (candidate.vacancyId !== "v-design" || feedback.trim().length < 3) throw Error("Проверьте предложение"); next.feedback.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: candidate.id, intent: "interview", note: feedback.trim(), state: "pending", createdAt: new Date().toISOString() }); })) setFeedback(""); }}><label className="block text-xs">Предложение HR<textarea required minLength={3} className={`${inputClass} mt-2`} value={feedback} onChange={e => setFeedback(e.target.value)} /></label><button className={secondary}>Передать HR</button></form>}{full && state.feedback.filter(f => f.candidateId === candidate.id).map(f => <div key={f.id} className="mt-4 rounded-lg border border-border p-3 text-xs"><strong>Предложение менеджера</strong><p className="mt-2">{f.note}</p><p className="mt-2">{f.state}</p>{role === "hr" && f.state === "pending" && <div className="mt-2 flex gap-2">{[true, false].map(approved => <button key={String(approved)} className={secondary} onClick={() => update(next => { next.feedback.find(item => item.id === f.id)!.state = approved ? "approved" : "declined"; next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: candidate.id, actor: role, action: "feedback.reviewed", detail: approved ? "approved" : "declined", createdAt: new Date().toISOString() }); })}>{approved ? "Согласовать" : "Отклонить"}</button>)}</div>}</div>)}{role === "administrator" && <button className={`${secondary} mt-4 text-destructive`} onClick={() => { if (confirm("Удалить демо-кандидата?")) update(next => { next.candidates = next.candidates.filter(c => c.id !== candidate.id); next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: candidate.id, actor: role, action: "candidate.deleted", detail: candidate.name, createdAt: new Date().toISOString() }); }); }}>Удалить кандидата</button>}</motion.aside>}</AnimatePresence>
        <AnimatePresence>{full && copilotCandidate && evaluation && <motion.aside key="copilot" {...panelMotion} aria-label="HR Copilot кандидата" className={`${card} w-full xl:w-80 xl:shrink-0`}><div className="flex items-center justify-between"><h2 className="m-0 text-base font-semibold leading-normal">Dev mode · HR Copilot</h2><button aria-label="Закрыть Copilot" onClick={() => setCopilotId(null)}><X size={18} /></button></div><p className="mt-2 text-sm font-semibold">{copilotCandidate.name}</p><p className="mt-3 text-sm text-muted-foreground">{evaluation.output.summary}</p><div className="mt-4 space-y-2">{evaluation.output.greenFlags.map(flag => <p key={flag} className="rounded-lg bg-success/10 p-2 text-xs">+ {flag}</p>)}{evaluation.output.redFlags.map(flag => <p key={flag} className="rounded-lg bg-destructive/10 p-2 text-xs">− {flag}</p>)}</div><fieldset disabled={evaluation.state !== "draft" || role !== "hr"} className="mt-4 space-y-3"><legend className="mb-2 text-sm font-semibold">Рекомендации</legend>{evaluation.output.recommendations.map(r => <label key={r.action} className="flex gap-2 rounded-lg border border-border p-3 text-xs"><input type="radio" name={evaluation.id} checked={(decision[evaluation.id] ?? evaluation.output.recommendations[0]?.action) === r.action} onChange={() => setDecision({ ...decision, [evaluation.id]: r.action })} /><span><strong>{r.title}</strong><span className="mt-1 block">{r.reason}. {r.evidence}</span></span></label>)}</fieldset>{role === "hr" && evaluation.state === "draft" && <button className={`${primary} mt-4 w-full`} onClick={() => { const action = decision[evaluation.id] ?? evaluation.output.recommendations[0].action; if (confirm(`Подтвердить: ${actionLabel[action]}?`)) update(next => confirmDecision(next, DEMO_TENANT, role, evaluation.id, action)); }}>Подтвердить решение</button>}{evaluation.state === "confirmed" && <div className="mt-4 space-y-3"><p className="text-sm">HR подтвердил: {evaluation.chosenAction && actionLabel[evaluation.chosenAction]}</p>{role === "hr" && !state.memory.some(m => m.evaluationId === evaluation.id) && <><label className="block text-xs">Проверенная причина для памяти<textarea className={`${inputClass} mt-2`} value={reason} onChange={e => setReason(e.target.value)} /></label><button disabled={!reason.trim()} className={secondary} onClick={() => update(next => saveMemory(next, DEMO_TENANT, role, evaluation.id, reason))}>Сохранить в память</button></>}</div>}{role === "administrator" && <p className="mt-3 text-xs text-muted-foreground">Решение подтверждает HR.</p>}</motion.aside>}</AnimatePresence>
      </div>
    </>}
  </div>;
}
