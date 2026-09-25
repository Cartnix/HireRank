import { CandidateSchema, CopilotStateSchema, EvaluationSchema, type Action, type Candidate, type CopilotState, type Evaluation, type Role, type Vacancy } from "./types";
import { initialCopilotState } from "./seed";

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
export const freshState = (): CopilotState => structuredClone(initialCopilotState);
export function sameTenant(item: { tenantId: string }, tenantId: string) { return item.tenantId === tenantId; }
function audit(state: CopilotState, tenantId: string, actor: Role, action: string, detail: string, candidateId: string | null = null) {
  state.audit.unshift({ id: id(), tenantId, actor, action, detail, candidateId, createdAt: now() });
}
function notify(state: CopilotState, tenantId: string, role: Role, text: string, candidateId: string | null) {
  state.notifications.unshift({ id: id(), tenantId, role, text, candidateId, read: false, createdAt: now() });
}
export function evaluate(state: CopilotState, candidate: Candidate, vacancy: Vacancy, actor: Role | "intake-hook"): Evaluation {
  if (candidate.tenantId !== vacancy.tenantId) throw Error("Чужой tenant");
  const prompt = state.prompts.find(p => p.tenantId === candidate.tenantId);
  if (!prompt) throw Error("Нет инструкции HR");
  const source = `${candidate.experience} ${candidate.skills} ${candidate.resumeText}`.toLowerCase();
  const words = vacancy.description.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x => x.length > 4);
  const hits = [...new Set(words.filter(word => source.includes(word.slice(0, Math.max(4, word.length - 2)))))].slice(0, 3);
  const criteria = prompt.text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x => x.length > 6);
  const matched = [...new Set(criteria.filter(word => source.includes(word.slice(0, Math.max(4, word.length - 2)))))].slice(0, 3);
  const templates: Record<Action, { title: string; reason: string }> = {
    interview: { title: "Пригласить на интервью", reason: "Проверить подтверждённый опыт в разговоре" },
    review: { title: "Дополнительное рассмотрение", reason: "Запросить недостающие детали и обсудить с командой" },
    rejected: { title: "Отклонить после проверки", reason: "Только если HR подтвердил несоответствие вакансии" },
  };
  const order: Action[] = hits.length ? ["interview", "review", "rejected"] : ["review", "interview", "rejected"];
  const memory = prompt.useMemory ? state.memory.filter(x => x.tenantId === candidate.tenantId).slice(-3).map(x => x.markdown) : [];
  const result = EvaluationSchema.parse({ id: id(), tenantId: candidate.tenantId, candidateId: candidate.id, vacancyId: vacancy.id, promptVersion: prompt.version,
    input: { resume: { reference: candidate.resumeRef, text: candidate.resumeText, experience: candidate.experience, skills: candidate.skills }, vacancy, prompt: prompt.text, memory, managerFeedback: state.feedback.filter(x => x.tenantId === candidate.tenantId && x.candidateId === candidate.id).map(x => x.note) },
    output: { summary: `Mock JSON: резюме сопоставлено с вакансией «${vacancy.title}». Решение остаётся за HR.`, greenFlags: hits.length ? [`Совпадение с вакансией: ${hits.join(", ")}`, ...(matched.length ? [`Критерии HR: ${matched.join(", ")}`] : [])] : ["Заявлен опыт — нужна проверка"], redFlags: source.length < 90 ? ["Мало проверяемых деталей"] : [],
      recommendations: order.filter(x => prompt.allowedActions.includes(x)).slice(0, 3).map(action => ({ action, title: templates[action].title, reason: templates[action].reason, evidence: hits.length ? `Анкета: ${hits.join(", ")}` : `Анкета: ${candidate.experience.slice(0, 90)}` })) },
    state: "draft", chosenAction: null, createdAt: now(), confirmedAt: null });
  state.evaluations.unshift(result);
  audit(state, candidate.tenantId, actor === "intake-hook" ? candidate.source : actor, "ai.draft", `${result.output.recommendations.length} варианта; prompt v${prompt.version}`, candidate.id);
  notify(state, candidate.tenantId, "hr", `AI подготовил ${result.output.recommendations.length} варианта для ${candidate.name}. Подтвердите один в ATS.`, candidate.id);
  return result;
}
export function intake(state: CopilotState, tenantId: string, actor: "candidate" | "operator" | "hr", input: Omit<Candidate, "id" | "tenantId" | "status" | "vacancyId" | "source" | "createdAt">): Candidate {
  if (!state.tenants.some(x => x.id === tenantId)) throw Error("Нет tenant");
  if (state.candidates.some(x => x.tenantId === tenantId && x.email.toLowerCase() === input.email.toLowerCase())) throw Error("Анкета с этим email уже есть");
  const candidate = CandidateSchema.parse({ ...input, id: id(), tenantId, status: "new", vacancyId: null, source: actor, createdAt: now() });
  state.candidates.unshift(candidate);
  audit(state, tenantId, actor, "candidate.intake", `Резюме: ${candidate.resumeRef}`, candidate.id);
  notify(state, tenantId, "hr", `Новый кандидат: ${candidate.name}`, candidate.id);
  notify(state, tenantId, "manager", `Новый кандидат: ${candidate.name}`, candidate.id);
  const vacancy = state.vacancies.find(x => x.id === candidate.requestedVacancyId && x.tenantId === tenantId && x.open) || state.vacancies.find(x => x.tenantId === tenantId && x.open);
  if (vacancy) { try { evaluate(state, candidate, vacancy, "intake-hook"); } catch { notify(state, tenantId, "hr", `AI не обработал ${candidate.name}. Требуется ручная проверка.`, candidate.id); } }
  else notify(state, tenantId, "hr", `Нет открытой вакансии для анализа ${candidate.name}.`, candidate.id);
  return candidate;
}
export function confirmDecision(state: CopilotState, tenantId: string, role: Role, evaluationId: string, action: Action) {
  if (role !== "hr") throw Error("Только HR подтверждает решение");
  const evaluation = state.evaluations.find(x => x.id === evaluationId && x.tenantId === tenantId);
  if (!evaluation || evaluation.state !== "draft") throw Error("Черновик недоступен или уже исполнен");
  if (!evaluation.output.recommendations.some(x => x.action === action)) throw Error("Действие не предложено AI");
  const candidate = state.candidates.find(x => x.id === evaluation.candidateId && x.tenantId === tenantId);
  const vacancy = state.vacancies.find(x => x.id === evaluation.vacancyId && x.tenantId === tenantId);
  if (!candidate || !vacancy || !vacancy.open) throw Error("Кандидат или открытая вакансия недоступны");
  const tool = action === "interview" ? "ats.schedule_interview" : action === "rejected" ? "ats.reject_candidate" : "ats.mark_for_review";
  // Mock MCP: validate everything before the first mutation. A real adapter will call the backend.
  const runId = id(), timestamp = now();
  state.mcpRuns.unshift({ id: runId, tenantId, candidateId: candidate.id, evaluationId, tool, action, approvedBy: "hr", status: "success", createdAt: timestamp });
  candidate.status = action;
  if (action === "interview") candidate.vacancyId = vacancy.id;
  evaluation.state = "confirmed"; evaluation.chosenAction = action; evaluation.confirmedAt = timestamp;
  audit(state, tenantId, "hr", "mcp.executed", `${tool}; approval=${evaluationId}; run=${runId}`, candidate.id);
  notify(state, tenantId, "manager", `HR подтвердил «${action}» для ${candidate.name}`, candidate.id);
  return runId;
}
export function saveMemory(state: CopilotState, tenantId: string, role: Role, evaluationId: string, reason: string) {
  if (role !== "hr" || !reason.trim()) throw Error("Требуется проверенное обоснование HR");
  const evaluation = state.evaluations.find(x => x.id === evaluationId && x.tenantId === tenantId && x.state === "confirmed");
  const candidate = state.candidates.find(x => x.id === evaluation?.candidateId && x.tenantId === tenantId);
  if (!evaluation || !candidate) throw Error("Решение не подтверждено");
  const markdown = [`## ${candidate.name} · ${now().slice(0, 10)}`, `- Кандидат: ${candidate.name}`, `- Вакансия: ${evaluation.input.vacancy.title}`, `- Рекомендации AI: ${evaluation.output.recommendations.map(x => `${x.title} (${x.evidence})`).join("; ")}`, `- Green flags: ${evaluation.output.greenFlags.join("; ")}`, `- Red flags: ${evaluation.output.redFlags.join("; ")}`, `- Решение HR: ${evaluation.chosenAction}`, `- Подтверждённая HR причина: ${reason.trim()}`].join("\n");
  state.memory.push({ id: id(), tenantId, candidateId: candidate.id, evaluationId, markdown, createdAt: now() });
  audit(state, tenantId, "hr", "memory.confirmed", "Markdown записан после проверки HR", candidate.id);
}
export function parseSavedState(json: string | null) { if (!json) return freshState(); const parsed = CopilotStateSchema.safeParse(JSON.parse(json)); return parsed.success ? parsed.data : freshState(); }
