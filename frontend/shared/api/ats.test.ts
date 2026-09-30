import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { allPages, candidateView, assignCandidate, type CandidateDTO } from "./ats";
import { jobFormSchema } from "@/features/create-vacancy/model/JobSchema";
import { createVacancy, updateVacancy, deleteVacancy } from "@/entities/job/model/api";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";
function json(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } }); }

test("ATS pagination loads records beyond the first page and preserves filters", async () => {
  const requests: string[] = [];
  globalThis.fetch = async input => {
    const url = String(input); requests.push(url);
    const page = new URL(url).searchParams.get("page");
    return json({ items: [{ id: page }], pagination: { page: Number(page), page_size: 100, total: 101, total_pages: 2 } });
  };
  assert.deepEqual(await allPages("/candidates/?status=assigned"), [{ id: "1" }, { id: "2" }]);
  assert.equal(requests.length, 2);
  assert.ok(requests.every(url => url.includes("status=assigned") && url.includes("page_size=100")));
});

test("minimal candidate response is safe and retains resume data without assigning preferred vacancy", () => {
  const result = candidateView({ id: "candidate", tenant_id: "tenant", status: "unassigned", email: null, questionnaire: { name: "Candidate Name", resume_text: "Real CV", resume_reference: "https://example.test/cv", requested_vacancy_id: "preferred" }, created_at: null, updated_at: null } as CandidateDTO);
  assert.equal(result.name, "Candidate Name");
  assert.deepEqual(result.questionnaire.education, []);
  assert.equal(result.email, "");
  assert.equal(result.assigned_vacancy_id, undefined);
  assert.equal((result.questionnaire as unknown as Record<string, unknown>).resume_text, "Real CV");
});

test("vacancy mutations use canonical paths and only supported create fields", async () => {
  const requests: { url: string; body: unknown; method: string }[] = [];
  globalThis.fetch = async (input, options) => {
    requests.push({ url: String(input), body: options?.body ? JSON.parse(String(options.body)) : undefined, method: String(options?.method) });
    if (options?.method === "DELETE") return new Response(null, { status: 204 });
    return json({ id: "vacancy", tenant_id: "tenant", title: "Engineer", status: "open", created_by: "hr", department: null, description: null, requirements: [], stages: [] });
  };
  await assert.rejects(createVacancy({ title: "Engineer", department: "IT", description: "Text", requirements: [], location: "Офис" }), /ещё не сохраняются/);
  assert.equal(requests.length, 0);
  const job = await createVacancy({ title: "Engineer", department: "IT", description: "Text", requirements: ["SQL"], status: "open" });
  assert.equal(job.department, "");
  assert.equal(new URL(requests[0].url).pathname, "/api/v1/vacancies/");
  assert.deepEqual(requests[0].body, { title: "Engineer", department: "IT", description: "Text", requirements: ["SQL"], status: "open" });
  await updateVacancy("vacancy", { status: "closed" });
  await deleteVacancy("vacancy");
  assert.equal(new URL(requests[1].url).pathname, "/api/v1/vacancies/vacancy");
  assert.equal(new URL(requests[2].url).pathname, "/api/v1/vacancies/vacancy");
});

test("failed assignment remains an error rather than a demo candidate", async () => {
  globalThis.fetch = async () => json({ detail: "Candidates can be assigned only to open vacancies" }, 409);
  await assert.rejects(assignCandidate("candidate", "vacancy"), /only to open vacancies/);
});


test("vacancy form submits when optional selectors retain their empty HTML values", () => {
  const parsed = jobFormSchema.safeParse({ title: " Engineer ", department: "IT", description: "Text", requirements: ["SQL"], status: "open", location: "", employmentType: "" });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.title, "Engineer");
});
