import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmDecision, evaluate, freshState, intake, saveMemory } from "./engine";

test("intake creates tenant-scoped AI draft without disposition, then HR approves one MCP action", () => {
  const state = freshState();
  const tenantId = state.tenants[0].id;
  const candidate = intake(state, tenantId, "recruiter", {
    name: "Новый кандидат", email: "new@example.com", phone: "+77000000000",
    experience: "Разработал интерфейсы на React и TypeScript в трёх проектах.", skills: "React, TypeScript", resumeRef: "cv.pdf", resumeText: "", requestedVacancyId: "v-frontend",
  });
  const evaluation = state.evaluations[0];
  assert.equal(candidate.status, "new");
  assert.equal(state.mcpRuns.length, 0);
  assert.equal(evaluation.state, "draft");
  assert.ok(evaluation.output.recommendations.length <= 3);
  assert.ok(evaluation.output.recommendations.every(x => x.reason && x.evidence));
  assert.throws(() => confirmDecision(state, tenantId, "manager", evaluation.id, evaluation.output.recommendations[0].action));
  assert.equal(candidate.status, "new");
  const action = evaluation.output.recommendations[0].action;
  confirmDecision(state, tenantId, "hr", evaluation.id, action);
  assert.equal(candidate.status, action);
  assert.equal(state.mcpRuns[0].approvedBy, "hr");
  assert.throws(() => confirmDecision(state, tenantId, "hr", evaluation.id, action));
  assert.equal(state.mcpRuns.length, 1);
  assert.equal(state.memory.length, 0);
  saveMemory(state, tenantId, "hr", evaluation.id, "Проверил указанный проект и опыт.");
  assert.match(state.memory[0].markdown, /Подтверждённая HR причина/);
});

test("tenant and memory are isolated; memory is included only when HR enables it", () => {
  const state = freshState(), tenantId = state.tenants[0].id;
  const candidate = state.candidates.find(x => x.id === "c-timur")!;
  const vacancy = state.vacancies.find(x => x.id === "v-frontend")!;
  state.memory.push({ id: "m1", tenantId, candidateId: candidate.id, evaluationId: "e1", markdown: "Подтверждённый случай", createdAt: new Date().toISOString() });
  assert.equal(evaluate(state, candidate, vacancy, "hr").input.memory.length, 0);
  state.prompts[0].useMemory = true;
  assert.equal(evaluate(state, candidate, vacancy, "hr").input.memory.length, 1);
  assert.throws(() => evaluate(state, candidate, { ...vacancy, tenantId: "another-tenant" }, "hr"));
});


test("superuser can confirm a draft and is recorded as the actual actor", () => {
  const state = freshState();
  const candidate = state.candidates[0];
  const vacancy = state.vacancies.find(v => v.id === candidate.vacancyId)!;
  const evaluation = evaluate(state, candidate, vacancy, "superuser");
  const action = evaluation.output.recommendations[0].action;
  confirmDecision(state, candidate.tenantId, "superuser", evaluation.id, action);
  assert.equal(state.mcpRuns[0].approvedBy, "superuser");
  assert.equal(state.audit.find(entry => entry.action === "mcp.executed")?.actor, "superuser");
});
