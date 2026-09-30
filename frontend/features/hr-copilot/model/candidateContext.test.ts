import assert from "node:assert/strict";
import { test } from "node:test";
import { candidateContext } from "./candidateContext";
import { evaluate } from "./engine";
import { testState } from "./test-fixture";

test("switching candidates replaces all three inspectors and reassignment excludes old analysis", () => {
  const state = testState();
  const first = state.candidates.find(c => c.id === "c-aliya")!;
  const second = state.candidates.find(c => c.id === "c-timur")!;
  const job = state.vacancies.find(v => v.id === "v-frontend")!;
  second.vacancyId = job.id;
  const result = evaluate(state, second, job, "hr");
  const context = candidateContext(state, second.id);
  assert.equal(context.candidate?.id, second.id);
  assert.equal(context.vacancy?.id, job.id);
  assert.equal(context.evaluation?.id, result.id);
  const changed = candidateContext(state, first.id);
  assert.equal(changed.candidate?.id, first.id);
  assert.notEqual(changed.evaluation?.id, result.id);
  second.vacancyId = first.vacancyId;
  assert.equal(candidateContext(state, second.id).evaluation, undefined);
  assert.deepEqual(candidateContext(state, null), { candidate: undefined, vacancy: undefined, evaluation: undefined });
});
