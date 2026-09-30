import type { CopilotState } from "./types";

/** One selection owns all inspectors; an evaluation from another job is never reused. */
export function candidateContext(state: CopilotState, candidateId: string | null) {
  const candidate = state.candidates.find(item => item.id === candidateId);
  const vacancyId = candidate?.vacancyId || candidate?.requestedVacancyId;
  const evaluation = candidate ? state.evaluations.find(item => item.candidateId === candidate.id && item.tenantId === candidate.tenantId && (!vacancyId || item.vacancyId === vacancyId)) : undefined;
  const vacancy = candidate ? state.vacancies.find(item => item.id === (vacancyId || evaluation?.vacancyId) && item.tenantId === candidate.tenantId) : undefined;
  return { candidate, vacancy, evaluation };
}
