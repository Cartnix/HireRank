import type { Candidate, Role } from "@/features/hr-copilot/model/types";
export const DEMO_TENANT = "550e8400-e29b-41d4-a716-446655440000";
export const DEMO_CANDIDATE_ID = "c-aliya";
export const DEMO_MANAGER_VACANCY_ID = "v-design";
export function demoCan(role: Role, section: string) {
  if (section === "audit") return role === "administrator";
  if (section === "copilot") return role === "hr" || role === "administrator";
  return ["dashboard", "jobs", "candidates"].includes(section);
}
export function canReadDemoCandidate(role: Role, candidate: Candidate) {
  if (candidate.tenantId !== DEMO_TENANT) return false;
  if (role === "hr" || role === "administrator") return true;
  if (role === "candidate") return candidate.id === DEMO_CANDIDATE_ID;
  return role === "manager" && candidate.vacancyId === DEMO_MANAGER_VACANCY_ID;
}
