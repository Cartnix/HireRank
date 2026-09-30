import { testState } from "../hr-copilot/model/test-fixture";
import assert from "node:assert/strict";
import { test } from "node:test";
import { demoCan, canReadDemoCandidate } from "./access";

import { freshState } from "../hr-copilot/model/engine";

test("journal belongs only to admin and Copilot settings to HR/admin", () => {
  for (const role of ["candidate", "recruiter", "hr", "manager", "administrator", "superuser"] as const) {
    assert.equal(demoCan(role, "audit"), (role === "administrator" || role === "superuser"));
    assert.equal(demoCan(role, "copilot"), role === "hr" || (role === "administrator" || role === "superuser"));
    assert.equal(demoCan(role, "agent"), ["hr", "administrator", "superuser"].includes(role));
  }
});
test("candidate identity, manager assignments and recruiter pool access are scoped", () => {
  const state = testState();
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
test("legacy browser data is never loaded", () => {
  assert.deepEqual(freshState().candidates, []);
  assert.deepEqual(freshState().vacancies, []);
});
