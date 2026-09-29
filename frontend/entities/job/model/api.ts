import { apiFetch } from "@/shared/api/client";
import { listVacancyViews, vacancyDetail, vacancyView, type VacancyDTO, type VacancyInput, type VacancyUpdate } from "@/shared/api/ats";
import type { Job } from "./types";
export type VacancyStatus = "draft" | "open";
export interface CreateVacancyPayload {
  title: string; department: string; description: string; requirements: string[]; status?: VacancyStatus;
  location?: "Удалённо" | "Офис" | "Гибрид"; employmentType?: "full-time" | "part-time" | "internship";
  salaryMin?: number | null; salaryMax?: number | null; recruiter?: string; experience?: string;
}
export async function createVacancy(payload: CreateVacancyPayload): Promise<Job> {
  for (const key of ["location", "employmentType", "salaryMin", "salaryMax", "recruiter", "experience"] as const) {
    if (payload[key] != null && payload[key] !== "") throw new Error("Демо-поля условий вакансии ещё не сохраняются на сервере");
  }
  const json: VacancyInput = { title: payload.title, department: payload.department, description: payload.description, requirements: payload.requirements, status: payload.status ?? "draft" };
  return vacancyView(await apiFetch<VacancyDTO>("/vacancies/", { method: "POST", json }));
}
export const getVacancies = listVacancyViews;
export const getVacancy = vacancyDetail;
export async function updateVacancy(id: string, payload: VacancyUpdate): Promise<Job> {
  return vacancyView(await apiFetch<VacancyDTO>(`/vacancies/${id}`, { method: "PATCH", json: payload }));
}
export async function deleteVacancy(id: string): Promise<void> { await apiFetch<void>(`/vacancies/${id}`, { method: "DELETE" }); }
