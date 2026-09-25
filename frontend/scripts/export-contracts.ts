import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";

import {
  ConsentSchema,
  LoginFormValues,
  RegisterFormValues,
} from "../features/auth/model/FormSchema";

import { AuditSchema, CandidateSchema, CopilotStateSchema, EvaluationSchema, FeedbackSchema, McpRunSchema, MemorySchema, NotificationSchema, PromptSchema, RecommendationSchema, VacancySchema } from "../features/hr-copilot/model/types";

const outputPath = resolve(
  process.cwd(),
  "../contracts/generated/frontend/schemas.json",
);

const schemas = {
  ConsentSchema: zodToJsonSchema(ConsentSchema, "ConsentSchema"),
  LoginFormValues: zodToJsonSchema(LoginFormValues, "LoginFormValues"),
  RegisterFormValues: zodToJsonSchema(RegisterFormValues, "RegisterFormValues"),
  ...Object.fromEntries(Object.entries({ AuditSchema, CandidateSchema, CopilotStateSchema, EvaluationSchema, FeedbackSchema, McpRunSchema, MemorySchema, NotificationSchema, PromptSchema, RecommendationSchema, VacancySchema }).map(([name, schema]) => [name, zodToJsonSchema(schema, name)])),
};

async function main(): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(schemas, null, 2)}\n`, "utf8");
  // Proposed frontend mock endpoints; backend-generated OpenAPI remains authoritative for implemented API.
  const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
  const json = (schema: object) => ({ content: { "application/json": { schema } } });
  const response = (name: string) => ({ description: "Mock result", ...json(ref(name)) });
  const mockOpenApi = {
    openapi: "3.1.0", info: { title: "HireRank Copilot frontend mock API", version: "0.1.0", description: "Proposed interface only. These routes are not implemented by the backend." },
    paths: {
      "/copilot/candidates": { get: { summary: "Tenant candidate pool", responses: { "200": { description: "Candidates", ...json({ type: "array", items: ref("CandidateSchema") }) } } }, post: { summary: "Intake triggers AI draft", requestBody: json(ref("CandidateSchema")), responses: { "201": response("CandidateSchema") } } },
      "/copilot/vacancies": { get: { summary: "Tenant vacancies", responses: { "200": { description: "Vacancies", ...json({ type: "array", items: ref("VacancySchema") }) } } }, post: { summary: "HR/admin vacancy", requestBody: json(ref("VacancySchema")), responses: { "201": response("VacancySchema") } } },
      "/copilot/evaluations": { get: { summary: "HR drafts", responses: { "200": { description: "Drafts", ...json({ type: "array", items: ref("EvaluationSchema") }) } } } },
      "/copilot/evaluations/{id}/confirm": { post: { summary: "HR approval, then MCP action", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: json({ type: "object", required: ["action"], properties: { action: { type: "string", enum: ["review", "interview", "rejected"] } } }), responses: { "200": response("McpRunSchema"), "403": { description: "Forbidden" }, "409": { description: "Already confirmed" } } } },
      "/copilot/prompts": { get: { summary: "HR rules", responses: { "200": response("PromptSchema") } }, put: { summary: "Configure HR rules", requestBody: json(ref("PromptSchema")), responses: { "200": response("PromptSchema") } } },
      "/copilot/feedback": { post: { summary: "Manager proposal", requestBody: json(ref("FeedbackSchema")), responses: { "201": response("FeedbackSchema") } } },
      "/copilot/notifications": { get: { summary: "Role-scoped notifications", responses: { "200": { description: "Notifications", ...json({ type: "array", items: ref("NotificationSchema") }) } } } },
      "/copilot/memory": { get: { summary: "Opt-in Markdown memory", responses: { "200": { description: "Records", ...json({ type: "array", items: ref("MemorySchema") }) } } }, post: { summary: "Confirmed HR memory", requestBody: json(ref("MemorySchema")), responses: { "201": response("MemorySchema") } } },
      "/copilot/audit": { get: { summary: "Tenant audit", responses: { "200": { description: "Events", ...json({ type: "array", items: ref("AuditSchema") }) } } } },
    }, components: { schemas: Object.fromEntries(Object.entries(schemas).filter(([name]) => name.endsWith("Schema") && name !== "ConsentSchema").map(([name, document]) => { const value = document as { definitions?: Record<string, unknown> }; return [name, JSON.parse(JSON.stringify(value.definitions?.[name] ?? document).replaceAll("#/definitions/", "#/components/schemas/"))]; })) },
  };
  await writeFile(resolve(process.cwd(), "../contracts/generated/frontend/copilot.mock.openapi.json"), `${JSON.stringify(mockOpenApi, null, 2)}\n`, "utf8");
}

void main();