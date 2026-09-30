import assert from "node:assert/strict";
import { test } from "node:test";
import { demoCan, canReadDemoCandidate } from "./access";
import { freshState } from "../hr-copilot/model/engine";
import { loadCopilotState, COPILOT_STORAGE_KEY } from "../hr-copilot/model/storage";

test("journal belongs only to admin and Copilot settings to HR/admin", () => {
  for (const role of ["candidate", "recruiter", "hr", "manager", "administrator", "superuser"] as const) {
    assert.equal(demoCan(role, "audit"), (role === "administrator" || role === "superuser"));
    assert.equal(demoCan(role, "copilot"), role === "hr" || (role === "administrator" || role === "superuser"));
    assert.equal(demoCan(role, "agent"), ["hr", "administrator", "superuser"].includes(role));
  }
});
test("candidate identity, manager assignments and recruiter pool access are scoped", () => {
  const state = freshState();
  const aliya = state.candidates.find(c => c.id === "c-aliya")!;
  const timur = state.candidates.find(c => c.id === "c-timur")!;
  const foreign = { ...aliya, tenantId: "another-tenant" };
  assert.equal(canReadDemoCandidate("candidate", aliya), true);
  assert.equal(canReadDemoCandidate("candidate", timur), false);
  assert.equal(canReadDemoCandidate("manager", aliya), true);
  assert.equal(canReadDemoCandidate("manager", timur), false);
  assert.equal(canReadDemoCandidate("recruiter", aliya), false);
  assert.equal(canReadDemoCandidate("administrator", foreign), false);
  assert.equal(canReadDemoCandidate("superuser", timur), true);
  assert.equal(canReadDemoCandidate("superuser", foreign), false);
  aliya.vacancyId = null;
  assert.equal(canReadDemoCandidate("manager", aliya), false);
});
test("legacy local demo migrates to a single organization while retaining first-tenant edits", () => {
  const state = freshState(); state.prompts[0].text = "Сохранённая инструкция для анализа React";
  state.tenants.push({ id: "legacy-tenant", name: "Legacy" });
  state.candidates.push({ ...state.candidates[0], id: "legacy-candidate", tenantId: "legacy-tenant" });
  state.vacancies.push({ ...state.vacancies[0], id: "legacy-vacancy", tenantId: "legacy-tenant" });
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => key === COPILOT_STORAGE_KEY ? JSON.stringify(state) : null } });
  try {
    const loaded = loadCopilotState();
    assert.equal(loaded.tenants.length, 1);
    assert.equal(loaded.prompts[0].text, state.prompts[0].text);
    for (const items of [loaded.vacancies, loaded.candidates, loaded.prompts, loaded.audit]) assert.ok(items.every(item => item.tenantId === loaded.tenants[0].id));
  } finally { if (original) Object.defineProperty(globalThis, "localStorage", original); else Reflect.deleteProperty(globalThis, "localStorage"); }
});
