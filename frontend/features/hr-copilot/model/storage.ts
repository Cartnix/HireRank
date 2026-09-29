import { evaluate, freshState, parseSavedState } from "./engine";
import type { CopilotState } from "./types";

export const COPILOT_STORAGE_KEY = "hirerank-copilot-demo-v1";

export function loadCopilotState(): CopilotState {
  let state: CopilotState;
  try {
    state = parseSavedState(localStorage.getItem(COPILOT_STORAGE_KEY));
  } catch {
    state = freshState();
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
}