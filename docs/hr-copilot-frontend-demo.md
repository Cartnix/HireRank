# HR Copilot frontend demo

Branch: `feat/hr-copilot-frontend-demo`. Route: `/dashboard/copilot`.

This is a browser-only Next.js adaptation of the interactive single-file prototype. It follows the narrow product flow: one resume intake → automatic draft analysis → up to three explained actions → explicit HR approval → mock MCP update and audit. Existing dashboard layout, brand colors, landing animation, and backend API remain in place.

## Try it

1. `cd frontend && npm ci && npm run dev`.
2. Open `/dashboard/copilot` (also linked from the existing sidebar and landing).
3. Switch to **Operator**, submit a resume using a file name, URL, or text. The file bytes stay in the browser and are not uploaded.
4. Switch to **HR**. Review the new card, AI flags and three recommendations. Confirm one action in the dialog. Before confirmation there is no MCP run and no status mutation.
5. Optionally confirm a manual or mock-generated explanation in the memory dialog. Toggle memory under HR rules; only then do previous confirmed Markdown records appear in subsequent evaluation inputs.
6. Switch to **Manager** to leave feedback. HR must review the request; no email is sent. Switch tenants to inspect isolation.

The demo persists in `localStorage` and uses a role switch for demonstration only. It is not authentication or a security boundary. The deterministic analyzer reads structured form data, prompt criteria, vacancy, optional Markdown memory, and manager feedback. Resume text is treated as data. AI failures are represented as HR notifications. The mock MCP runs only after explicit confirmation. The frontend does not call LLM, MCP, email or new backend endpoints.

## Contracts

`frontend/features/hr-copilot/model/types.ts` defines Zod schemas for Tenant-scoped Candidate, Vacancy, Prompt, Evaluation, Feedback, Notification, Memory, Audit, and MCP run. `npm run contracts:export:frontend` extends `contracts/generated/frontend/schemas.json` and writes `contracts/generated/frontend/copilot.mock.openapi.json`. The latter is a **proposed mock integration surface**, separate from `contracts/generated/backend/openapi.json`. Existing backend contracts are not claimed to implement it and are unchanged. Candidate creation, analysis, approval, and execution logic live in `model/engine.ts`; UI is `ui/CopilotWorkspace.tsx`.

Current limitations: file bytes, real sessions, server tenant enforcement, async retries, actual model processing, MCP transport, email delivery, and database persistence require backend integration. Do not submit real personal data in this local demo.
