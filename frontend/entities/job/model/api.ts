import { apiFetch } from "@/shared/api/client";
import { Job } from "./types";
import { me } from "@/shared/api/auth";
import { serverApiFetch } from "@/shared/api/server-client";

export interface CreateVacancyPayload {
  title: string;
  department: string;
  description: string;
  requirements: string[];
}

export async function createVacancy(
  payload: CreateVacancyPayload,
): Promise<Job> {
  return apiFetch<Job>("/vacancies/", {
    method: "POST",
    json: payload,
  });
}

export async function getVacancies(): Promise<Job[]> {
  return apiFetch<Job[]>("/vacancies/", {
    method: "GET",
  });
}

export async function getServerVacancies(): Promise<Job[]> {
  return serverApiFetch<Job[]>("/vacancies", {
    method: "GET",
  });
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
