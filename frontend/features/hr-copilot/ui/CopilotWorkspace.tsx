"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Bell, BrainCircuit, BriefcaseBusiness, CheckCircle2, ClipboardList, FileUp, History, RotateCcw, ShieldCheck, Users } from "lucide-react";
import { confirmDecision, evaluate, freshState, intake, parseSavedState, saveMemory } from "../model/engine";
import type { Action, Candidate, CopilotState, Evaluation, Role, Vacancy } from "../model/types";

const STORAGE = "hirerank-copilot-demo-v1";
const label: Record<Role, string> = { hr: "HR", operator: "Оператор бухгалтерии", manager: "Менеджер", candidate: "Кандидат", administrator: "Администратор" };
const actionLabel: Record<Action, string> = { interview: "На интервью", review: "Доп. рассмотрение", rejected: "Отклонить" };
const statusLabel: Record<Candidate["status"], string> = { new: "Новый · не обработан", assigned: "Назначен", review: "Доп. рассмотрение", interview: "Интервью", rejected: "Отклонён" };
const date = (value: string) => new Date(value).toLocaleString("ru-RU");
const uid = () => crypto.randomUUID();
const time = () => new Date().toISOString();
const card = "rounded-2xl border border-border bg-card p-5 shadow-sm";
const inputClass = "w-full rounded-xl border border-input bg-background-elevated px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-primary";
const primary = "rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-primary-foreground hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent";

type Tab = "copilot" | "intake" | "candidates" | "vacancies" | "notifications" | "memory" | "audit";
const tabs: { id: Tab; title: string; icon: typeof BrainCircuit }[] = [
  { id: "copilot", title: "HR Copilot", icon: BrainCircuit }, { id: "intake", title: "Приём резюме", icon: FileUp }, { id: "candidates", title: "Кандидаты", icon: Users }, { id: "vacancies", title: "Вакансии", icon: BriefcaseBusiness }, { id: "notifications", title: "Уведомления", icon: Bell }, { id: "memory", title: "Память", icon: ClipboardList }, { id: "audit", title: "Аудит", icon: History },
];
const allowedTabs: Record<Role, Tab[]> = { hr: ["copilot", "intake", "candidates", "vacancies", "notifications", "memory", "audit"], operator: ["intake", "notifications"], manager: ["candidates", "vacancies", "notifications"], candidate: ["intake", "candidates", "vacancies"], administrator: ["vacancies", "audit"] };

export function CopilotWorkspace() {
  const [state, setState] = useState<CopilotState>(() => freshState());
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("hr");
  const [tenantId, setTenantId] = useState(state.tenants[0].id);
  const [tab, setTab] = useState<Tab>("copilot");
  const [selectedCandidate, setSelectedCandidate] = useState("c-timur");
  const [candidateIdentity, setCandidateIdentity] = useState("c-aliya");
  const [message, setMessage] = useState("");
  const [memoryPrompt, setMemoryPrompt] = useState<string | null>(null);
  const [memoryReason, setMemoryReason] = useState("");
  const [memoryMode, setMemoryMode] = useState<"manual" | "draft">("manual");
  const [decision, setDecision] = useState<Record<string, Action>>({});
  const [promptText, setPromptText] = useState("");
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [allowed, setAllowed] = useState<Action[]>(["interview", "review", "rejected"]);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackIntent, setFeedbackIntent] = useState<"contact" | "interview" | "review">("contact");

  useEffect(() => {
    let saved: CopilotState;
    try { saved = parseSavedState(localStorage.getItem(STORAGE)); } catch { saved = freshState(); }
    if (!saved.evaluations.length) {
      const candidate = saved.candidates.find(x => x.id === "c-timur"), vacancy = saved.vacancies.find(x => x.id === "v-frontend");
      if (candidate && vacancy) evaluate(saved, candidate, vacancy, "intake-hook");
    }
    setState(saved); setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE, JSON.stringify(state)); }, [state, ready]);
  useEffect(() => { const prompt = state.prompts.find(x => x.tenantId === tenantId); setPromptText(prompt?.text ?? ""); setMemoryEnabled(prompt?.useMemory ?? false); setAllowed(prompt?.allowedActions ?? ["review"]); }, [state.prompts, tenantId]);
  const update = (fn: (next: CopilotState) => void) => { const next = structuredClone(state); try { fn(next); setState(next); setMessage(""); return true; } catch (error) { setMessage(error instanceof Error ? error.message : "Ошибка операции"); return false; } };
  const candidates = state.candidates.filter(x => x.tenantId === tenantId);
  const vacancies = state.vacancies.filter(x => x.tenantId === tenantId);
  const evaluations = state.evaluations.filter(x => x.tenantId === tenantId);
  const ownCandidate = (id: string) => candidates.find(x => x.id === id);
  const visibleCandidates = role === "candidate" ? candidates.filter(x => x.id === candidateIdentity) : role === "operator" ? [] : candidates;
  const current = ownCandidate(selectedCandidate) ?? visibleCandidates[0];
  const prompt = state.prompts.find(x => x.tenantId === tenantId);
  const notifications = state.notifications.filter(x => x.tenantId === tenantId && x.role === role);
  const chooseRole = (next: Role) => { setRole(next); setTab(allowedTabs[next][0]); setMessage(""); };
  const chooseTenant = (next: string) => { setTenantId(next); setSelectedCandidate(state.candidates.find(x => x.tenantId === next)?.id ?? ""); setCandidateIdentity(state.candidates.find(x => x.tenantId === next)?.id ?? ""); setMessage(""); };
  const toast = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(""), 5000); };

  function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, values = new FormData(form), file = form.querySelector<HTMLInputElement>('input[name="resumeFile"]')?.files?.[0];
    const resumeText = String(values.get("resumeText") ?? "").trim(), resumeRef = file?.name || String(values.get("resumeUrl") ?? "").trim() || (resumeText ? "Текст в HTML форме" : "");
    if (!resumeRef) return toast("Добавьте файл, ссылку или текст резюме");
    if (file && !/\.(pdf|docx?|html?|txt)$/i.test(file.name)) return toast("Доступны PDF, DOC, DOCX, HTML и TXT");
    const email = String(values.get("email") ?? "").trim().toLowerCase();
    const ok = update(next => {
      const created = intake(next, tenantId, role === "candidate" ? "candidate" : role === "operator" ? "operator" : "hr", {
        name: String(values.get("name") ?? "").trim(), email, phone: String(values.get("phone") ?? "").trim(),
        experience: String(values.get("experience") ?? "").trim(), skills: String(values.get("skills") ?? "").trim(), resumeRef, resumeText,
        requestedVacancyId: String(values.get("vacancyId") ?? "") || null,
      });
      setSelectedCandidate(created.id); if (role === "candidate") setCandidateIdentity(created.id);
    });
    if (ok) { form.reset(); toast("Анкета в пуле. AI создал черновик для HR; статус пока «Новый»."); }
  }
  function confirm(evaluation: Evaluation) {
    const action = decision[evaluation.id] ?? evaluation.output.recommendations[0]?.action;
    if (!action) return toast("Выберите действие");
    if (!window.confirm(`HR подтверждает «${actionLabel[action]}» для ${ownCandidate(evaluation.candidateId)?.name}? Только после этого mock MCP изменит ATS.`)) return;
    if (update(next => { confirmDecision(next, tenantId, role, evaluation.id, action); })) {
      setMemoryPrompt(evaluation.id); setMemoryReason(""); setMemoryMode("manual"); toast("Mock MCP исполнил решение после подтверждения HR");
    }
  }
  function savePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role !== "hr" || !allowed.length || promptText.trim().length < 12) return toast("Нужна инструкция и хотя бы одно действие");
    update(next => {
      const index = next.prompts.findIndex(x => x.tenantId === tenantId);
      const nextPrompt = { tenantId, text: promptText.trim(), useMemory: memoryEnabled, allowedActions: allowed, version: (next.prompts[index]?.version ?? 0) + 1 };
      if (index < 0) next.prompts.push(nextPrompt); else next.prompts[index] = nextPrompt;
      next.audit.unshift({ id: uid(), tenantId, candidateId: null, actor: "hr", action: "prompt.updated", detail: `v${nextPrompt.version}; memory=${memoryEnabled}`, createdAt: time() });
    }); toast("Правила HR сохранены для следующих резюме");
  }
  function manualAction(candidateId: string, action: Action, vacancyId: string) {
    if (role !== "hr") return toast("Только HR выполняет действия");
    const candidate = ownCandidate(candidateId), vacancy = vacancies.find(x => x.id === vacancyId && x.open);
    if (!candidate || !vacancy) return toast("Выберите открытую вакансию того же tenant");
    if (!window.confirm(`HR подтверждает ручное действие «${actionLabel[action]}» для ${candidate.name}?`)) return;
    update(next => {
      const c = next.candidates.find(x => x.id === candidateId && x.tenantId === tenantId);
      if (!c) throw Error("Кандидат недоступен");
      c.status = action; if (action === "interview") c.vacancyId = vacancyId;
      const runId = uid();
      next.mcpRuns.unshift({ id: runId, tenantId, candidateId, evaluationId: "manual", tool: "ats.manual_candidate_action", action, approvedBy: "hr", status: "success", createdAt: time() });
      next.audit.unshift({ id: uid(), tenantId, candidateId, actor: "hr", action: "mcp.manual_executed", detail: `${action}; vacancy=${vacancyId}; run=${runId}`, createdAt: time() });
    });
  }
  function reanalyze(candidateId: string, vacancyId: string) {
    if (role !== "hr") return;
    update(next => {
      const c = next.candidates.find(x => x.id === candidateId && x.tenantId === tenantId);
      const v = next.vacancies.find(x => x.id === vacancyId && x.tenantId === tenantId && x.open);
      if (!c || !v) throw Error("Нужны кандидат и открытая вакансия");
      evaluate(next, c, v, "hr");
    }); setTab("copilot");
  }
  function saveFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (role !== "manager" || !current || feedbackNote.trim().length < 3) return;
    update(next => {
      next.feedback.unshift({ id: uid(), tenantId, candidateId: current.id, intent: feedbackIntent, note: feedbackNote.trim(), state: "pending", createdAt: time() });
      next.notifications.unshift({ id: uid(), tenantId, candidateId: current.id, role: "hr", text: `Менеджер просит согласовать действие по ${current.name}`, read: false, createdAt: time() });
      next.audit.unshift({ id: uid(), tenantId, candidateId: current.id, actor: "manager", action: "feedback.requested", detail: feedbackNote.trim(), createdAt: time() });
    }); setFeedbackNote(""); toast("Запрос передан HR; письмо кандидату не отправлено");
  }
  function reviewFeedback(id: string, approved: boolean) {
    if (role !== "hr") return;
    update(next => { const feedback = next.feedback.find(x => x.id === id && x.tenantId === tenantId && x.state === "pending"); if (!feedback) throw Error("Запрос недоступен"); feedback.state = approved ? "approved" : "declined";
      next.audit.unshift({ id: uid(), tenantId, candidateId: feedback.candidateId, actor: "hr", action: "feedback.reviewed", detail: feedback.state, createdAt: time() });
      next.notifications.unshift({ id: uid(), tenantId, candidateId: feedback.candidateId, role: "manager", text: approved ? "HR согласовал предложение. Письмо пока черновик." : "HR отклонил предложение", read: false, createdAt: time() });
    });
  }
  function saveVacancy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (role !== "hr" && role !== "administrator") return;
    const form = event.currentTarget, fd = new FormData(form), title = String(fd.get("title") ?? "").trim(), description = String(fd.get("description") ?? "").trim();
    if (title.length < 2 || description.length < 4) return toast("Заполните название и описание");
    update(next => { const idValue = String(fd.get("id") ?? ""), old = next.vacancies.find(x => x.id === idValue && x.tenantId === tenantId);
      if (idValue && !old) throw Error("Чужая вакансия недоступна");
      const vacancy: Vacancy = { id: old?.id ?? uid(), tenantId, title, department: String(fd.get("department") ?? ""), location: String(fd.get("location") ?? ""), description, open: fd.get("open") === "on" };
      if (old) Object.assign(old, vacancy); else next.vacancies.unshift(vacancy);
      next.audit.unshift({ id: uid(), tenantId, candidateId: null, actor: role, action: old ? "vacancy.updated" : "vacancy.created", detail: title, createdAt: time() });
    }); form.reset(); toast("Вакансия сохранена");
  }
  function section(title: string, description: string, children: ReactNode) { return <section className={card}><h2 className="text-lg font-bold text-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p>{children}</section>; }

  if (!ready) return <div className={card}>Загрузка демо...</div>;
  return <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary"><BrainCircuit size={14}/> AI Agent · HITL + MCP</div><h1 className="mt-3 text-3xl font-bold tracking-tight">HireRank HR Copilot</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Оператор вводит резюме один раз → AI готовит Top‑3 → HR выбирает и подтверждает → только затем mock MCP выполняет действие.</p></div><div className="flex flex-wrap gap-2"><label className="text-xs font-semibold">Компания<select aria-label="Компания" value={tenantId} onChange={e => chooseTenant(e.target.value)} className={`${inputClass} mt-1`}>{state.tenants.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-xs font-semibold">Демо роль<select aria-label="Демо роль" value={role} onChange={e => chooseRole(e.target.value as Role)} className={`${inputClass} mt-1`}>{(Object.keys(label) as Role[]).map(x => <option key={x} value={x}>{label[x]}</option>)}</select></label></div></header>
    <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-xs text-foreground-secondary">Интерактивное frontend демо. Сессия, JSON и mock MCP сохраняются только в браузере; роли и tenant здесь демонстрационные. Реальные резюме не загружайте.</div>
    <nav aria-label="Разделы Copilot" className="flex flex-wrap gap-2 border-b border-border pb-4">{tabs.filter(x => allowedTabs[role].includes(x.id)).map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${tab === item.id ? "bg-brand-primary text-brand-primary-foreground" : "bg-card text-foreground-secondary hover:bg-accent"}`}><item.icon size={16}/>{item.title}{item.id === "notifications" && notifications.some(x => !x.read) ? <span className="h-2 w-2 rounded-full bg-warning"/> : null}</button>)}</nav>
    {message && <div role="status" className="rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-3 text-sm">{message}</div>}
    {tab === "copilot" && role === "hr" && <div className="space-y-5"><div className="grid gap-4 md:grid-cols-3">{[["Новые анкеты", candidates.filter(x => x.status === "new").length], ["Черновики AI", evaluations.filter(x => x.state === "draft").length], ["Подтверждённые действия", state.mcpRuns.filter(x => x.tenantId === tenantId).length]].map(([title, value]) => <div key={title} className={card}><div className="text-3xl font-bold text-brand-primary">{value}</div><div className="mt-1 text-sm text-muted-foreground">{title}</div></div>)}</div><div className="grid items-start gap-5 xl:grid-cols-[.8fr_1.35fr_1fr]">
      {section("01 · Пул на обработку", "Поступление анкеты не меняет её статус.", <div className="mt-4 space-y-2">{candidates.filter(x => ["new", "review"].includes(x.status)).map(x => <button key={x.id} onClick={() => setSelectedCandidate(x.id)} className={`block w-full rounded-xl border p-3 text-left text-sm ${selectedCandidate === x.id ? "border-brand-primary bg-brand-primary/5" : "border-border"}`}><strong>{x.name}</strong><span className="mt-1 block text-xs text-muted-foreground">{statusLabel[x.status]} · {x.resumeRef}</span></button>)}<button onClick={() => setTab("intake")} className={`${secondary} w-full`}>+ Добавить резюме</button></div>)}
      {section("02 · Top‑3 от AI", "Каждый вариант содержит причину и факт из резюме.", <div className="mt-4 max-h-[820px] space-y-4 overflow-y-auto pr-1">{evaluations.map(e => { const candidate = ownCandidate(e.candidateId); return <article key={e.id} className="rounded-xl border border-border p-4"><div className="flex justify-between gap-2"><strong>{candidate?.name}</strong><span className="text-xs text-muted-foreground">{e.state === "draft" ? "Черновик" : "HR подтвердил"}</span></div><p className="mt-2 text-xs text-muted-foreground">{e.output.summary}</p><div className="mt-3 flex flex-wrap gap-1">{e.output.greenFlags.map(x => <span key={x} className="rounded bg-success/15 px-2 py-1 text-xs text-success">+ {x}</span>)}{e.output.redFlags.map(x => <span key={x} className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">− {x}</span>)}</div><fieldset className="mt-4 space-y-2" disabled={e.state !== "draft"}>{e.output.recommendations.map(r => <label key={r.action} className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 text-xs"><input type="radio" name={`decision-${e.id}`} checked={(decision[e.id] ?? e.output.recommendations[0].action) === r.action} onChange={() => setDecision(prev => ({ ...prev, [e.id]: r.action }))}/><span><strong>{r.title}</strong><span className="mt-1 block text-muted-foreground">{r.reason}. {r.evidence}</span></span></label>)}</fieldset><details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold">JSON input / output</summary><pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-lg bg-background p-3">{JSON.stringify({ input: e.input, output: e.output }, null, 2)}</pre></details>{e.state === "draft" && <button onClick={() => confirm(e)} className={`${primary} mt-4 w-full`}>Выбрать и подтвердить → mock MCP</button>}</article>; })}{!evaluations.length && <p className="text-sm text-muted-foreground">Подайте резюме, чтобы запустить AI автоматически.</p>}</div>)}
      {section("03 · Правила HR и MCP", "Промпт влияет на последующие анкеты. Память подключается явно.", <><form onSubmit={savePrompt} className="mt-4 space-y-3"><label className="block text-xs font-semibold">Инструкция AI<textarea value={promptText} onChange={e => setPromptText(e.target.value)} rows={7} className={`${inputClass} mt-2`} /></label><div className="text-xs font-semibold">Разрешённые действия</div><div className="flex flex-wrap gap-2">{(["interview", "review", "rejected"] as Action[]).map(a => <label key={a} className="rounded-lg border border-border p-2 text-xs"><input type="checkbox" checked={allowed.includes(a)} onChange={() => setAllowed(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])} className="mr-1"/>{actionLabel[a]}</label>)}</div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={memoryEnabled} onChange={e => setMemoryEnabled(e.target.checked)}/> Использовать подтверждённую память Markdown</label><button className={primary}>Сохранить правила · v{prompt?.version ?? 0}</button></form><div className="mt-6 border-t border-border pt-4"><h3 className="text-sm font-bold">Выполнено через mock MCP</h3>{state.mcpRuns.filter(x => x.tenantId === tenantId).slice(0, 5).map(run => <div key={run.id} className="mt-2 rounded-lg bg-success/10 p-2 text-xs">{run.tool} · {ownCandidate(run.candidateId)?.name} · {date(run.createdAt)}</div>)}{!state.mcpRuns.some(x => x.tenantId === tenantId) && <p className="mt-2 text-xs text-muted-foreground">До подтверждения HR вызовов нет.</p>}</div></>)}
    </div>{state.feedback.filter(x => x.tenantId === tenantId && x.state === "pending").length > 0 && section("Согласование с менеджером", "До согласования письмо кандидату не отправляется.", <div className="mt-4 space-y-3">{state.feedback.filter(x => x.tenantId === tenantId && x.state === "pending").map(x => <div key={x.id} className="rounded-xl border border-border p-3 text-sm"><strong>{ownCandidate(x.candidateId)?.name} · {x.intent}</strong><p className="mt-1">{x.note}</p><div className="mt-3 flex gap-2"><button className={primary} onClick={() => reviewFeedback(x.id, true)}>Согласовать</button><button className={secondary} onClick={() => reviewFeedback(x.id, false)}>Отклонить</button></div></div>)}</div>)} </div>}
    {tab === "intake" && <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">{section("Одна анкета вместо обхода кабинетов", "Кандидат или оператор вводит резюме в портал выбранной компании. Новый кандидат попадает в пул, AI запускается автоматически.", <form onSubmit={submitIntake} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">ФИО<input name="name" required minLength={2} className={`${inputClass} mt-2`}/></label><label className="text-xs font-semibold">Email<input type="email" name="email" required className={`${inputClass} mt-2`}/></label><label className="text-xs font-semibold">Телефон<input name="phone" required className={`${inputClass} mt-2`}/></label><label className="text-xs font-semibold">Файл резюме (имя сохраняется, байты нет)<input name="resumeFile" type="file" accept=".pdf,.doc,.docx,.html,.htm,.txt" className={`${inputClass} mt-2`}/></label><label className="text-xs font-semibold sm:col-span-2">Ссылка на резюме<input type="url" name="resumeUrl" className={`${inputClass} mt-2`}/></label><label className="text-xs font-semibold sm:col-span-2">Текст резюме<textarea name="resumeText" rows={2} className={`${inputClass} mt-2`}/></label><label className="text-xs font-semibold sm:col-span-2">Опыт<textarea name="experience" required minLength={10} rows={3} className={`${inputClass} mt-2`}/></label><label className="text-xs font-semibold sm:col-span-2">Навыки<input name="skills" required className={`${inputClass} mt-2`}/></label><label className="text-xs font-semibold sm:col-span-2">Предпочитаемая вакансия (HR решает о назначении)<select name="vacancyId" className={`${inputClass} mt-2`}><option value="">Без предпочтения</option>{vacancies.filter(x => x.open).map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label><label className="flex gap-2 text-xs sm:col-span-2"><input type="checkbox" required/> Согласен на обработку данных для рассмотрения анкеты в выбранной организации</label><button className={`${primary} sm:col-span-2`}>Зарегистрировать и запустить AI</button></form>)}{section("Что произойдёт", "Всё в пределах выбранного tenant.", <ol className="mt-5 space-y-3 text-sm">{["Карточка и ссылка / имя файла сохраняются в демо JSON", "HR и менеджер получают уведомления", "AI получает резюме, вакансию, промпт и включённую память", "HR проверяет Top‑3 и явно подтверждает действие", "Mock MCP меняет статус и пишет аудит"].map((x, i) => <li key={x} className="flex gap-3"><span className="font-bold text-brand-primary">0{i+1}</span>{x}</li>)}</ol>)}</div>}
    {tab === "candidates" && <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">{section(role === "candidate" ? "Моя анкета" : "Кандидаты компании", "Статус и резюме доступны согласно демо роли.", <div className="mt-4 space-y-2">{visibleCandidates.map(x => <button key={x.id} onClick={() => { setSelectedCandidate(x.id); if (role !== "candidate") update(next => { next.audit.unshift({ id: uid(), tenantId, candidateId: x.id, actor: role, action: "candidate.viewed", detail: "Открыта карточка", createdAt: time() }); }); }} className={`block w-full rounded-xl border p-3 text-left text-sm ${current?.id === x.id ? "border-brand-primary" : "border-border"}`}><strong>{x.name}</strong><span className="mt-1 block text-xs text-muted-foreground">{statusLabel[x.status]} · {vacancies.find(v => v.id === x.vacancyId)?.title ?? "В пуле"}</span></button>)}</div>)}{current && section(current.name, `${current.email} · ${current.phone}`, <div className="mt-5 space-y-4 text-sm"><div><span className="text-xs text-muted-foreground">Резюме</span><p>{current.resumeRef}</p></div><div><span className="text-xs text-muted-foreground">Опыт</span><p>{current.experience}</p></div><div><span className="text-xs text-muted-foreground">Навыки</span><p>{current.skills}</p></div><div><span className="text-xs text-muted-foreground">Статус</span><p>{statusLabel[current.status]}</p></div>{role !== "candidate" && <details><summary className="cursor-pointer font-semibold">История карточки</summary><div className="mt-2 space-y-1 text-xs">{state.audit.filter(x => x.tenantId === tenantId && x.candidateId === current.id).map(x => <div key={x.id}>{date(x.createdAt)} · {x.actor} · {x.action} · {x.detail}</div>)}</div></details>}{role === "hr" && <div className="border-t border-border pt-4"><h3 className="font-semibold">Действие HR</h3><p className="text-xs text-muted-foreground">Ручное действие также требует подтверждения и записывается как mock MCP.</p><select id="hr-vacancy" defaultValue={current.vacancyId ?? current.requestedVacancyId ?? vacancies.find(x => x.open)?.id} className={`${inputClass} mt-3`}>{vacancies.filter(x => x.open).map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select><div className="mt-2 flex flex-wrap gap-2">{(["interview", "review", "rejected"] as Action[]).map(action => <button key={action} onClick={() => manualAction(current.id, action, (document.getElementById("hr-vacancy") as HTMLSelectElement).value)} className={secondary}>{actionLabel[action]}</button>)}<button onClick={() => reanalyze(current.id, (document.getElementById("hr-vacancy") as HTMLSelectElement).value)} className={primary}>Повторить AI анализ</button></div></div>}{role === "manager" && <form onSubmit={saveFeedback} className="border-t border-border pt-4"><h3 className="font-semibold">Обратная связь для HR</h3><p className="text-xs text-muted-foreground">Менеджер не отправляет письмо и не меняет статус самостоятельно.</p><select value={feedbackIntent} onChange={e => setFeedbackIntent(e.target.value as typeof feedbackIntent)} className={`${inputClass} mt-3`}><option value="contact">Предложить письмо кандидату</option><option value="interview">Предложить интервью</option><option value="review">Запросить оценку</option></select><textarea required minLength={3} value={feedbackNote} onChange={e => setFeedbackNote(e.target.value)} rows={3} placeholder="Что предлагаете и почему?" className={`${inputClass} mt-2`}/><button className={`${primary} mt-2`}>Передать HR на согласование</button></form>}</div>)}</div>}
    {tab === "vacancies" && <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">{section("Вакансии компании", "Кандидат видит открытые позиции своего tenant.", <div className="mt-4 space-y-3">{vacancies.filter(x => role !== "candidate" || x.open).map(x => <article key={x.id} className="rounded-xl border border-border p-4"><div className="flex justify-between"><strong>{x.title}</strong><span className="text-xs text-muted-foreground">{x.open ? "Открыта" : "Закрыта"}</span></div><p className="mt-1 text-xs text-muted-foreground">{x.department} · {x.location}</p><p className="mt-2 text-sm">{x.description}</p>{role === "candidate" && <button onClick={() => setTab("intake")} className={`${secondary} mt-3`}>Подать анкету</button>}{(role === "hr" || role === "administrator") && <div className="mt-3 flex gap-2"><button onClick={() => { const form = document.getElementById("vacancy-form") as HTMLFormElement | null; if (!form) return; (form.elements.namedItem("id") as HTMLInputElement).value = x.id; for (const key of ["title", "department", "location", "description"] as const) (form.elements.namedItem(key) as HTMLInputElement).value = x[key]; (form.elements.namedItem("open") as HTMLInputElement).checked = x.open; form.scrollIntoView({ behavior: "smooth" }); }} className={secondary}>Изменить</button><button onClick={() => { if (candidates.some(c => c.vacancyId === x.id)) return toast("Сначала HR должен обработать назначения. Вакансию с кандидатами удалить нельзя."); if (!window.confirm(`Удалить «${x.title}»?`)) return; update(next => { next.vacancies = next.vacancies.filter(v => !(v.id === x.id && v.tenantId === tenantId)); next.audit.unshift({ id: uid(), tenantId, candidateId: null, actor: role, action: "vacancy.deleted", detail: x.title, createdAt: time() }); }); }} className={secondary}>Удалить</button></div>}</article>)}</div>)}{(role === "hr" || role === "administrator") && section("Управление вакансией", "Создание и изменение доступны HR и администратору.", <form id="vacancy-form" onSubmit={saveVacancy} className="mt-4 space-y-3"><input type="hidden" name="id"/><input name="title" placeholder="Название" required className={inputClass}/><input name="department" placeholder="Отдел" className={inputClass}/><input name="location" placeholder="Локация" className={inputClass}/><textarea name="description" placeholder="Описание" required rows={3} className={inputClass}/><label className="flex gap-2 text-xs"><input type="checkbox" name="open" defaultChecked/> Открыта</label><div className="flex gap-2"><button className={primary}>Сохранить</button><button type="reset" className={secondary}>Очистить</button></div></form>)}</div>}
    {tab === "notifications" && section("События в портале", "Уведомление информирует; подтвердить AI действие можно только в HR Copilot.", <div className="mt-4 space-y-2">{notifications.map(x => <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"><div><strong>{x.text}</strong><div className="text-xs text-muted-foreground">{date(x.createdAt)}</div></div><button onClick={() => update(next => { const notification = next.notifications.find(n => n.id === x.id && n.tenantId === tenantId && n.role === role); if (notification) notification.read = true; })} className={secondary}>{x.read ? "Прочитано" : "Прочитать"}</button></div>)}{!notifications.length && <p className="text-sm text-muted-foreground">Уведомлений пока нет.</p>}<div className="rounded-xl bg-brand-primary/5 p-4 text-xs">Email и отправка писем кандидатам здесь показаны только как будущие каналы; реальная отправка не выполняется.</div></div>)}
    {tab === "memory" && role === "hr" && section("Опциональная память решений", "Только подтверждённые HR записи могут попасть в следующий AI input.", <><div className="mt-4 text-xs">Использование в анализе: <strong>{prompt?.useMemory ? "включено" : "выключено"}</strong></div><pre className="mt-4 max-h-[460px] overflow-auto whitespace-pre-wrap rounded-xl bg-background p-4 text-xs">{state.memory.filter(x => x.tenantId === tenantId).map(x => x.markdown).join("\n\n---\n\n") || "# Память пуста"}</pre><button onClick={() => { const text = state.memory.filter(x => x.tenantId === tenantId).map(x => x.markdown).join("\n\n---\n\n") || "# Память пуста\n"; const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" })); const link = document.createElement("a"); link.href = url; link.download = "memory.md"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }} className={`${secondary} mt-3`}>Скачать memory.md</button></>)}
    {tab === "audit" && (role === "hr" || role === "administrator") && section("Журнал действий", "Видны только события текущего tenant; роли и вызовы MCP различаются.", <div className="mt-4 space-y-2">{state.audit.filter(x => x.tenantId === tenantId).map(x => <div key={x.id} className="rounded-xl border border-border p-3 text-xs"><strong>{x.action}</strong> · {x.actor} · {date(x.createdAt)}<div className="mt-1 text-muted-foreground">{x.detail}</div></div>)}<button onClick={() => { if (window.confirm("Сбросить локальное демо?")) { setState(freshState()); setMessage("Демо сброшено"); } }} className={`${secondary} inline-flex items-center gap-2`}><RotateCcw size={14}/> Сбросить демо</button></div>)}
    {memoryPrompt && <div role="dialog" aria-modal="true" aria-label="Подтверждение памяти" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className={`${card} w-full max-w-xl`}><div className="flex items-center gap-2 text-lg font-bold"><ShieldCheck size={20} className="text-brand-primary"/> Сохранить решение в память?</div><p className="mt-2 text-sm text-muted-foreground">Можно отказаться. Сгенерированный mock текст нельзя записать без вашей проверки.</p><div className="mt-4 flex gap-2"><button onClick={() => { setMemoryMode("manual"); setMemoryReason(""); }} className={secondary}>Написать самому</button><button onClick={() => { const e = evaluations.find(x => x.id === memoryPrompt); setMemoryMode("draft"); setMemoryReason(e ? `HR выбрал ${actionLabel[e.chosenAction ?? "review"]}. Проверенные факты: ${e.output.greenFlags.join("; ")}. Причину выбора нужно сверить с резюме.` : ""); }} className={secondary}>Сгенерировать mock черновик</button></div><label className="mt-4 block text-xs font-semibold">Подтверждённая вами причина{memoryMode === "draft" ? " · проверьте AI черновик" : ""}<textarea value={memoryReason} onChange={e => setMemoryReason(e.target.value)} rows={4} className={`${inputClass} mt-2`}/></label><div className="mt-4 flex justify-end gap-2"><button onClick={() => setMemoryPrompt(null)} className={secondary}>Не сохранять</button><button onClick={() => { if (update(next => saveMemory(next, tenantId, role, memoryPrompt, memoryReason))) { setMemoryPrompt(null); toast("Причина подтверждена HR и записана в Markdown"); } }} disabled={!memoryReason.trim()} className={primary}>Подтверждаю причину и запись</button></div></div></div>}
    <footer className="flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground"><CheckCircle2 size={14}/> Используются цвета и навигация существующего HireRank. Mock данные сохраняются в localStorage.</footer>
  </div>;
}
