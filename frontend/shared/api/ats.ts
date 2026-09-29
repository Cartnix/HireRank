import { apiFetch } from "./client";
import type { components } from "./schema";
import type { Candidate, Questionnaire } from "@/entities/candidate/model/types";
import type { Job } from "@/entities/job/model/types";

export type CandidateDTO = components["schemas"]["CandidatePublic"];
export type VacancyDTO = components["schemas"]["VacancyPublic"];
export type DashboardDTO = components["schemas"]["HRDashboard"] | components["schemas"]["ManagerDashboard"] | components["schemas"]["AdminDashboard"] | components["schemas"]["CandidateDashboard"];
export type CandidateInput = components["schemas"]["CreateCandidateRequest"];
export type VacancyInput = components["schemas"]["CreateVacancyRequest"];
export type VacancyUpdate = components["schemas"]["UpdateVacancyRequest"];

type Page<T> = { items: T[]; pagination: components["schemas"]["Pagination"] };
// The existing views filter locally and compute totals; load every API page,
// rather than silently treating the first 20 rows as the complete tenant pool.
export async function allPages<T>(path: string, headers?: HeadersInit): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const separator = path.includes("?") ? "&" : "?";
    const response = await apiFetch<Page<T>>(`${path}${separator}page=${page}&page_size=100`, { headers });
    items.push(...response.items);
    if (page >= response.pagination.total_pages) return items;
  }
}

function text(value: unknown): string { return typeof value === "string" ? value : ""; }
export function candidateView(dto: CandidateDTO): Candidate {
  const q = dto.questionnaire ?? {};
  const strings = ["surname", "first_name", "patronymic", "gender", "birth_date", "birth_place", "nationality", "citizenship", "education_level", "languages", "academic_degree"] as const;
  const questionnaire = { ...q, ...Object.fromEntries(strings.map(key => [key, text(q[key])])) } as unknown as Questionnaire;
  questionnaire.education = Array.isArray(q.education) ? q.education.filter((e): e is Record<string, unknown> => !!e && typeof e === "object").map(e => ({ institution: text(e.institution), year_from: text(e.year_from), year_to: text(e.year_to), dropped_at_year: typeof e.dropped_at_year === "string" ? e.dropped_at_year : null, specialty: text(e.specialty), diploma: text(e.diploma) })) : [];
  questionnaire.scientific_works = Array.isArray(q.scientific_works) ? q.scientific_works.filter((v): v is string => typeof v === "string") : [];
  return { ...dto, email: dto.email ?? "", questionnaire, created_at: dto.created_at ?? "", updated_at: dto.updated_at ?? "", name: text(q.name) || [questionnaire.surname, questionnaire.first_name, questionnaire.patronymic].filter(Boolean).join(" "), phone: text(q.phone), skills: Array.isArray(q.skills) ? q.skills.filter((v): v is string => typeof v === "string") : text(q.skills).split(/[,;]+/).map(s => s.trim()).filter(Boolean), location: text(q.location), stage: ({ unassigned: "Новый", assigned: "Назначен", pending_hitl: "Ожидает рассмотрения", action_applied: "Обработан" } as Record<string, string>)[dto.status] ?? dto.status };
}
export function vacancyView(dto: VacancyDTO): Job {
  return { ...dto, department: dto.department ?? "", description: dto.description ?? "", requirements: (dto.requirements ?? []).filter((v): v is string => typeof v === "string"), createdAt: dto.created_at ?? undefined };
}
export async function listCandidateViews(headers?: HeadersInit) { return (await allPages<CandidateDTO>("/candidates/", headers)).map(candidateView); }
export async function listVacancyViews(headers?: HeadersInit) { return (await allPages<VacancyDTO>("/vacancies/", headers)).map(vacancyView); }
export async function candidateDetail(id: string) { return candidateView(await apiFetch<CandidateDTO>(`/candidates/${id}`)); }
export async function vacancyDetail(id: string) { return vacancyView(await apiFetch<VacancyDTO>(`/vacancies/${id}`)); }
export async function createCandidate(input: CandidateInput) { return candidateView(await apiFetch<CandidateDTO>("/candidates/", { method: "POST", json: input })); }
export async function updateQuestionnaire(id: string, questionnaire: Record<string, unknown>) { return candidateView(await apiFetch<CandidateDTO>(`/candidates/${id}/questionnaire`, { method: "PUT", json: { questionnaire } })); }
export async function assignCandidate(id: string, vacancy_id: string) { return candidateView(await apiFetch<CandidateDTO>(`/candidates/${id}/assign`, { method: "POST", json: { vacancy_id } })); }
export async function deleteCandidate(id: string) { await apiFetch<void>(`/candidates/${id}`, { method: "DELETE" }); }
