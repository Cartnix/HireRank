import { apiFetch } from "@/shared/api/client";
import { Job } from "./types";
import { serverApiFetch } from "@/shared/api/server-client";

export interface CreateVacancyPayload {
  title: string;
  department: string;
  description: string;
  requirements: string[];
}

type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

export async function createVacancy(
  payload: CreateVacancyPayload,
): Promise<Job> {
  return apiFetch<Job>("/vacancies/", {
    method: "POST",
    json: payload,
  });
}

export async function getVacancies(): Promise<Job[]> {
  const res = await serverApiFetch<{ items: Job[] }>("/vacancies/", {
    method: "GET",
  });
  return res.items;
}

export async function getServerVacancies(): Promise<Job[]> {
  const res = await serverApiFetch<PaginatedResponse<Job>>("/vacancies/", {
    method: "GET",
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
