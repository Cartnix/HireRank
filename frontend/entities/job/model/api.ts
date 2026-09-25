import { apiFetch } from "@/shared/api/client";
import { Job } from "./types";

export type VacancyStatus = "draft" | "open";

export interface CreateVacancyPayload {
  title: string;
  department: string;
  description: string;
  requirements: string[];
  status?: VacancyStatus;

  location?: "Удалённо" | "Офис" | "Гибрид";
  employmentType?: "full-time" | "part-time" | "internship";
  salaryMin?: number | null;
  salaryMax?: number | null;
  recruiter?: string;
  experience?: string;
}

export async function createVacancy(
  payload: CreateVacancyPayload,
): Promise<Job> {
  const res = await apiFetch<Job>("/vacancies", {
    method: "POST",
    json: payload,
  });

  return res;
}

export async function getVacancies(headers?: HeadersInit): Promise<Job[]> {
  const res = await apiFetch<{ items: Job[] }>("/vacancies/", {
    method: "GET",
    headers,
  });
  return res.items;
}

export async function getVacancy(id: string): Promise<Job> {
  return apiFetch<Job>(`/vacancies/${id}/`, {
    method: "GET",
  });
}

export async function updateVacancy(
  id: string,
  payload: Partial<CreateVacancyPayload> & { stages?: Job["stages"] },
): Promise<Job> {
  return apiFetch<Job>(`/vacancies/${id}/`, {
    method: "PATCH",
    json: payload,
  });
}

export async function deleteVacancy(id: string): Promise<void> {
  await apiFetch<void>(`/vacancies/${id}/`, {
    method: "DELETE",
  });
}
