import { apiFetch } from "@/shared/api/client";
import type { components } from "@/shared/api/schema";

export type ApplicationPublic = components["schemas"]["ApplicationPublic"];

export async function applyToVacancy(vacancyId: string): Promise<ApplicationPublic> {
  return apiFetch<ApplicationPublic>(`/vacancies/${vacancyId}/applications`, {
    method: "POST",
    json: {},
  });
}
