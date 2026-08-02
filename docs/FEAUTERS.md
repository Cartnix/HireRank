# HireRank Features

## Overview

This document describes the functional capabilities of the **HireRank** (HIRERANK) platform with **AIDE** (AI Decision Engine).

Product canon: [PASSPORT.md](PASSPORT.md). Engine: [AIDE.md](AIDE.md). Delivery: [ROADMAP.md](ROADMAP.md).

It does not include technical implementation details and is used as a requirements source for development.

Data isolation: `tenant_id` (JWT).

---

# F-001 Landing Page

## Description

A single-page site is the entry point into the system.

### Capabilities

* product information;
* registration button;
* sign-in button;
* navigation to authentication.

---

# F-002 Authentication

## Description

The system supports user registration and authentication.

### Capabilities

* register a new user;
* sign in;
* sign out;
* session restore;
* authorization check.

---

# F-003 Role Based Access

## Description

After sign-in, the user can access only permitted functions.

### Supported roles

* Administrator
* HR
* Manager
* Recruiter
* Candidate

Permission matrix: [RBAC.md](RBAC.md).

---

# F-004 Tenant Isolation

## Description

All data belongs to a specific tenant (`tenant_id`).

**Core / self-hosted:** one enterprise per deploy. The app seeds a single default tenant
and always binds requests to `TENANT_ID` from env (hidden multi-tenancy). Clients do not
pass `tenant_id` on register. PostgreSQL RLS enforces row isolation.

**Enterprise / SaaS (future):** resolve `tenant_id` from JWT / subdomain without schema change.

Each user operates only inside their own tenant.

### Constraints

A user cannot:

* see another tenant’s data;
* modify another tenant’s data;
* receive another tenant’s notifications;
* run MCP actions outside their `tenant_id`.

---

# F-005 Candidate Registration

## Description

A candidate can self-register.

After registration, an account is created.

---

# F-006 Candidate Questionnaire

## Description

After registration, the candidate fills a personnel questionnaire and submits it as JSON.

The questionnaire follows the personnel record form structure (personal sheet / HR intake form).

### Capabilities

* save questionnaire;
* edit questionnaire before submit;
* view entered data;
* publish an intake event for AIDE after save.

### DoD

* questionnaire accepted as a JSON payload;
* candidate profile created or updated after save;
* candidate status set to `Unassigned`;
* candidate placed in the tenant pool and AIDE cycle initiated (see F-020).

---

# F-007 HR Candidate Registration

## Description

An HR Operator can upload a JSON questionnaire and create a candidate card manually.

Used when the candidate is present in person and HR transfers data from a paper form.

### DoD

* system accepts questionnaire JSON;
* candidate record enters the tenant pool;
* intake event published for AIDE;
* notification created.

---

# F-008 Candidate Pool

## Description

After the questionnaire is saved, the candidate appears in the tenant-wide list.

### Initial status

Unassigned

### Capabilities

* list view;
* search;
* filtering;
* open candidate card;
* view pending AIDE scenarios / selected Outcome (no silent rank-score as hero UX).

---

# F-009 Vacancy Management

## Description

Administrator manages tenant vacancies.

### Capabilities

* create vacancy;
* edit vacancy;
* delete vacancy;
* view vacancies;
* change vacancy status.

### DoD

* CRUD available only to administrator;
* changes limited to the current `tenant_id`;
* notification may be created after vacancy creation.

---

# F-010 Vacancy Directory

## Description

All tenant users can view open vacancies according to their access rights.

Manager and HR Operator see only their own tenant’s data.

---

# F-011 Candidate Assignment

## Description

Administrator assigns a candidate to a vacancy (manual path). The same effect may occur via MCP after the manager selects an AIDE scenario.

After assignment, the candidate status is updated.

### Result

* candidate linked to vacancy;
* vacancy shows the assigned candidate;
* manager gets up-to-date information;
* candidate status becomes `Assigned`.

### DoD

* assignment available to administrator **or** via MCP after HITL;
* cannot assign a candidate from another tenant;
* managers are notified;
* Outcome written to Precedent Memory when via the AIDE path.

---

# F-012 Candidate Status

## Description

Each candidate shows the current processing stage.

### Base statuses

* Unassigned
* Assigned
* Pending HITL (waiting for Telegram scenario selection)
* Action applied (after MCP)

The status list may grow.

---

# F-013 Notifications

## Description

The system notifies tenant staff about events.

### Events

* new candidate created;
* vacancy created;
* candidate assigned to vacancy;
* AIDE sent scenarios to Telegram;
* manager selected a scenario / MCP applied the action.

### Recipients

* Administrator
* HR Operator
* Manager

### Channels

* in-app;
* Telegram (HITL primary surface);
* SMTP / email (delivery via n8n).

---

# F-014 Dashboard

## Description

After sign-in, the user lands on the system home page.

Content depends on the user role.

Only users with the Administrator role can access the admin panel.

---

# F-015 Administrator Dashboard

## Capabilities

* view candidates;
* manage vacancies;
* assign candidates;
* view users;
* view notifications;
* access admin panel;
* overview of pending AIDE packages / tenant Outcomes.

---

# F-016 HR Dashboard

## Capabilities

* create candidates;
* view vacancies;
* view candidates;
* view notifications;
* upload candidate JSON questionnaire.

---

# F-017 Manager Dashboard

## Capabilities

* view vacancies;
* view assigned candidates;
* view notifications;
* view pending / resolved AIDE scenarios (read);
* web is read-only; decision is a Telegram button.

---

# F-018 Candidate Dashboard

## Capabilities

* view own questionnaire;
* view status;
* edit questionnaire (until processing is complete).

---

# F-019 User Profile

## Description

Each user has a personal profile.

### Capabilities

* view data;
* change contact information;
* change password.

---

# F-020 AIDE Decision Cycle

## Description

**AIDE** (AI Decision Engine) is a co-pilot cycle — not a black box and not a score dashboard.

After intake, AIDE reads open vacancies and the tenant’s Precedent Memory, generates **2–3 action scenarios**, delivers them to the manager in Telegram as a HITL captcha, and only after a human selection executes the chosen action via MCP under `tenant_id`, writing the Outcome to memory.

### Capabilities

* trigger on questionnaire save (candidate or HR);
* read tenant vacancies and precedents;
* generate 2–3 scenarios with rationale (local LLM / Ollama);
* deliver to Telegram via n8n (delivery plane);
* execute **only** the selected scenario via FastMCP;
* write Outcome → Precedent / Case Memory.

### Ban

* AI does not make final hire/reject decisions;
* no silent auto-disposition;
* score 0–10 / rank-list is **not** a product hero artifact.

### DoD (strict gate)

1. Precedent context exists, or an explicit path to build it.
2. Telegram HITL with ≥2 scenarios.
3. Execution only after a human.
4. Outcome recorded in tenant memory.

---

# F-021 Precedent Memory

## Description

Tenant decision history: who approved/rejected which profile, which scenario was chosen, short comment.

A digital org asset; it does not leave with HR turnover.

### Capabilities

* write Outcome after MCP;
* AIDE reads precedents when generating scenarios;
* isolation strictly by `tenant_id`;
* export / erase on controller request (see GDPR).

---

# F-022 Vacancy Details

## Description

Vacancy card contains vacancy information.

### Fields

* title;
* department;
* description;
* status;
* assigned candidates.

---

# F-023 Candidate Details

## Description

Candidate card contains personnel information.

### Contents

* personal data;
* completed questionnaire;
* current status;
* assigned vacancy;
* related AIDE scenarios / Outcomes (if any).

---

# F-024 Search

## Capabilities

Search across:

* candidates;
* vacancies.

---

# F-025 Filtering

## Capabilities

Candidate filters:

* by status;
* by vacancy;
* by HITL state (pending / resolved).

Vacancy filters:

* open;
* closed.

---

# F-026 Session Management

## Capabilities

* persist authentication;
* end session;
* automatic sign-out after token expiry.

---

# F-027 Authorization Protection

## Description

All protected pages require authentication.

Without access, the user is redirected to the sign-in page.

---

# Feature Roadmap (Post–AIDE core)

The following capabilities are **not** in AIDE core (Phase 2); they belong to Phase 3 / later:

* deeper Precedent Memory and decision-graph analytics;
* multi-channel HITL beyond Telegram primary (rich email panels);
* entity change history (full audit UI);
* analytics panel for CHRO;
* export packages for enterprise HRIS;
* mobile web UI.

Explicitly **not** product heroes: automatic black-box hire/reject, silent rank-graves, chatbot as pipeline owner.
