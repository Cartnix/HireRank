import { evaluate, freshState, parseSavedState } from "./engine";
import type { CopilotState } from "./types";

export const COPILOT_STORAGE_KEY = "hirerank-copilot-demo-v1";
export const COPILOT_STATE_EVENT = "hirerank:copilot-state-change";

export function loadCopilotState(): CopilotState {
  let state: CopilotState;
  try {
    state = parseSavedState(localStorage.getItem(COPILOT_STORAGE_KEY));
  } catch {
    state = freshState();
  }

  const tenantId = "550e8400-e29b-41d4-a716-446655440000";
  state.tenants = [{ id: tenantId, name: "HireRank · Demo Enterprise" }];
  for (const key of ["vacancies", "candidates", "prompts", "evaluations", "feedback", "notifications", "audit", "memory", "mcpRuns"] as const) {
    // Remove legacy second-tenant demo records when loading existing browser storage.
    Object.assign(state, { [key]: state[key].filter(item => item.tenantId === tenantId) });
  }
  if (!state.evaluations.length) {
    const candidate = state.candidates.find((x) => x.id === "c-timur");
    const vacancy = state.vacancies.find((x) => x.id === "v-frontend");
    if (candidate && vacancy) evaluate(state, candidate, vacancy, "intake-hook");
  }

  return state;
}

export function saveCopilotState(state: CopilotState): void {
  localStorage.setItem(COPILOT_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(COPILOT_STATE_EVENT));
}