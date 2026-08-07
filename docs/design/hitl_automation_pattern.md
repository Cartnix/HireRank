# HireRank HITL Automation Pattern

> **Design reference (non-canon).** Deep dive into event-driven Automation + HITL. **Behavioral Source of Truth:** [use-cases/](../use-cases/) ([UC-08](../use-cases/UC-08-automation-hitl-loop.md)). **Compliance (strict):** [ATS_COMPLIANCE_RK.md](../ATS_COMPLIANCE_RK.md) (RK — primary), [GDPR.md](../GDPR.md). Detail: [AUTOMATION.md](../AUTOMATION.md), [MEMORY.md](../MEMORY.md).

**Moat:** AI Automation events with HITL via MCP tools, with Memory storing option-choice history — for hiring bureaucracy; extensible beyond MVP `resume.uploaded`.

This note describes HireRank Automation as a **distributed event-driven AI system**: declarative automation config, short-lived agent runs, local LLM option generation, human approval, then MCP execution under `tenant_id`.

---

## Architecture overview

```
                    ┌────────────────────────────┐
                    │        EVENT SOURCES       │
                    └─────────────┬──────────────┘
                                  │
     ┌──────────┬─────────────────┴─────────────────┐
     │          │                                   │
 resume.uploaded   (later: vacancy.*, HITL.*)     …
     │          │                                   │
     └──────────┴─────────────────┬─────────────────┘
                                  │
                                  ▼
                     Trigger Detection Layer
                                  │
                                  ▼
                    Automation Configuration
            (Prompt + Tools + Model + Tenant scope)
                                  │
                                  ▼
                     Agent Run Provisioning
                         (Celery / worker)
                                  │
                                  ▼
                  Context Construction Pipeline
         ┌───────────────────────────────────────────┐
         │                                           │
 Resume JSON    Memory      Event Payload     MCP
 Vacancies      (MEMORY)    Metadata          Tool schemas
         │                                           │
         └──────────────────────┬────────────────────┘
                                ▼
                      Local LLM (Ollama)
                                │
               ┌────────────────┼────────────────┐
               │                │                │
          Reasoning        Planning      Option proposals
               │                │         (MCP tool + args)
               └────────────────┼────────────────┘
                                ▼
                     HITL Delivery Layer (n8n)
      ┌──────────────┬──────────────────────────────┐
      │              │                              │
   SMTP email     Telegram buttons           Pending package
   (managers)     (HITL captcha)             (store)
      │
      ▼
  Human picks one option
      │
      ▼
  FastMCP executes selected tool under tenant_id
      │
      ▼
  Outcome → Memory (MEMORY.md) / Result logs
```

---

## Core concept

An **Automation** is a **durable description of an agent**, not the running agent itself.

```
Automation
    ≠
Agent run
```

The Automation holds configuration only.

Each matching event **provisions a new short-lived agent run**.

```
Automation
        │
        │ Trigger (e.g. resume.uploaded)
        ▼
Agent run #1

Automation
        │
        ▼
Agent run #2

Automation
        │
        ▼
Agent run #3
```

The run lives only for the task. After HITL resolution (or failure handling), it is destroyed.

HireRank **does not** auto-execute domain mutations from the LLM. The run proposes **2–3 MCP-backed options**; a human must pick one (Telegram HITL). FastMCP runs **only** the selected tool.

---

## Logical model

Automation as a declarative structure:

```yaml
Automation:
  name: resume_uploaded_hitl
  triggers:
    - resume.uploaded
  instructions: |   # prompt / management policy text
    …
  model: ollama/…   # local self-hosted
  permissions:
    tenant_scoped: true
  tools:            # allowed MCP tool schemas
    - assign_candidate
    - invite_interview
    - bureaucracy_step
  memory:           # read/write via MEMORY.md asset
    read: true
    write_outcome: true
  delivery:
    smtp: managers
    telegram: hitl_buttons
  environment:
    tenant_id: from_event
```

Think of it as a Deployment object for AI: desired config; each event creates a run.

---

## Full pipeline

```
Event (resume.uploaded)

↓

Trigger match

↓

Automation loaded

↓

Provision agent run (worker)

↓

Load Memory (MEMORY.md)

↓

Load event payload + resume JSON + vacancies

↓

Load allowed MCP tool schemas

↓

Build context / prompt

↓

Run local LLM → 2–3 options

↓

Persist pending HITL package

↓

n8n: SMTP notify managers + Telegram buttons

↓

Human picks one option

↓

FastMCP: execute selected tool under tenant_id

↓

Write Outcome to Memory

↓

Destroy agent run
```

---

## Layers

### 1. Event layer

Domain events enter a single envelope. MVP source: HireRank intake (candidate / HR).

```json
{
  "type": "resume.uploaded",
  "tenant_id": "…",
  "candidate_id": "…",
  "resume_ref": "…",
  "payload": {}
}
```

Later events can share the same envelope shape; the agent run does not care which producer emitted them.

### 2. Trigger engine

Checks whether the event matches an Automation.

```
Trigger: resume.uploaded
Event:   resume.uploaded
→ MATCH → start Automation run
```

Schedulers (cron) are optional later; MVP is event-driven only.

### 3. Automation definition

The heart of the system: prompt, model, permissions, tools, Memory access, triggers, delivery channels. This is the “passport” of the agent.

### 4. Agent run provisioning

After a trigger match, spin up an isolated worker context (Celery task / container — not a permanent daemon):

```
New worker context
↓
Attach tenant_id + RLS GUCs
↓
Attach Memory read path
↓
Attach MCP tool schemas (propose only — no execute yet)
↓
Start local LLM
```

### 5. Context builder

```
                Context
                   │
    ┌──────────────┼───────────────┐
    │              │               │
 Resume/vacancies  Event payload   Memory
    │              │               │
    └──────────────┼───────────────┘
                   │
            MCP tool schemas
                   │
                   ▼
              Unified prompt → LLM
```

### 6. LLM execution

The run reasons and **plans options**. It must not hire/reject or call mutating MCP tools directly at this stage.

Outputs: **2–3 options**, each with MCP tool name, arguments, and short rationale (e.g. interview, assign to manager, bureaucracy step).

### 7. Tool layer (two phases)

| Phase | Who | What |
|-------|-----|------|
| Propose | LLM via tool schemas | Suggest MCP calls as HITL options |
| Execute | FastMCP after human pick | Run **only** the selected tool under `tenant_id` |

The LLM never talks to APIs or the DB for mutations. n8n never invents domain actions — delivery only.

### 8. Memory layer

[Memory](../MEMORY.md) outlives the agent run.

```
Run #1 → write Outcome (option choice) → Memory
Run #2 → read Memory → better options
```

Also: other run memory (proposed options, failures) may be stored; schema TBD.

### 9. Domain workspace (ATS, not git repos)

Instead of cloning repositories, the run attaches **tenant-scoped ATS context**: candidates, vacancies, resume JSON, open pool state. Cross-tenant access is forbidden.

### 10. Action & delivery layer

After reasoning:

- Persist pending HITL package
- SMTP awareness to managers (n8n)
- Telegram HITL buttons (n8n)
- After pick: FastMCP mutation + Outcome → Memory
- Notifications / audit trail

---

## System diagram

```
                         +----------------------+
                         |   Event broker       |
                         +----------+-----------+
                                    |
                          Trigger dispatcher
                                    |
                    +---------------+----------------+
                    |                                |
            Automation config                Automation config
                    |                                |
                    +---------------+----------------+
                                    |
                         Agent run provisioner
                                    |
                     Worker / task runtime
                                    |
                    +---------------+----------------+
                    |                                |
              ATS context                    Memory + MCP schemas
              (resume, vacancies)            (MEMORY.md)
                    |                                |
                    +---------------+----------------+
                                    |
                             Context builder
                                    |
                               Local LLM
                                    |
                          2–3 MCP-backed options
                                    |
                    +---------------+----------------+
                    |                                |
              n8n SMTP                       n8n Telegram HITL
                    |                                |
                    +---------------+----------------+
                                    |
                              Human picks
                                    |
                               FastMCP
                                    |
                         Outcome → Memory
```

---

## State machine

```
           Idle
             │
             ▼
      Waiting trigger
             │
             ▼
      Event received
             │
             ▼
     Provision agent run
             │
             ▼
      Load context
             │
             ▼
      Run LLM (options)
             │
             ▼
      Pending HITL
             │
             ▼
      Human pick
             │
             ▼
      FastMCP execute
             │
             ▼
      Persist Outcome → Memory
             │
             ▼
       Finish run
             │
             ▼
            Idle
```

Ban edges: no path from “Run LLM” to “FastMCP execute” without “Human pick”.

---

## Layer stack (summary)

```
┌───────────────────────────────────────────┐
│                Event layer                │
├───────────────────────────────────────────┤
│              Trigger engine               │
├───────────────────────────────────────────┤
│          Automation definition            │
├───────────────────────────────────────────┤
│         Agent run provisioning            │
├───────────────────────────────────────────┤
│        Context assembly pipeline          │
├───────────────────────────────────────────┤
│         Local LLM (option proposals)      │
├───────────────────────────────────────────┤
│     HITL delivery (n8n SMTP + Telegram)   │
├───────────────────────────────────────────┤
│     FastMCP execution (selected only)     │
├───────────────────────────────────────────┤
│         Persistent Memory (MEMORY.md)     │
└───────────────────────────────────────────┘
```

---

## Summary

**HireRank Automation** is an **event-driven platform for short-lived LLM agent runs with HITL**. Each event loads an Automation definition, provisions an isolated run, builds tenant-scoped context (resume, vacancies, Memory, MCP schemas), proposes 2–3 tool-backed options, delivers them via n8n, waits for a human, executes only the chosen MCP tool under `tenant_id`, writes the Outcome into Memory, then tears the run down.

This yields scalability (many runs, no standing brain), isolation (`tenant_id` + ephemeral workers), auditability (options → button → MCP → Outcome), and extensibility (new triggers and tools without rewriting the core loop).
