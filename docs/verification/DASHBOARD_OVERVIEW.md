# Restored database overview — 2026-09-30

The `live` flag previously hid the overview widgets in both production and developer mode; developer counters were additionally replaced by dashes. The main page now requests a shared DashboardAnalytics contract. Both modes use app.ats.analytics.build_analytics, with tenant and candidate/manager scope applied on the server.

Development fixtures restore the four original top candidate identities and the three upcoming meeting participants from Git history, plus the existing preview records and a completed hire. Bootstrap has been applied to the running separate dev database. It contains 10 candidates, 10 vacancies (9 open), 4 rated active candidates, 3 upcoming interviews, and an 18-day example hire. Historic mock AI scores are replaced by explicitly stored human interview ratings (1–5); no real AI inference is claimed.

Checks:

- 35 backend tests passed in a fresh isolated PostgreSQL database, migrated from empty to the shared Alembic head; the temporary database was removed afterwards.
- Coverage includes overview tenant isolation, role access restrictions, preview identities, production blocking of development data, stale schema rejection, seeded aggregates, interview create/reschedule/delete, foreign-tenant link rejection, score range validation and average hire duration.
- TypeScript and frontend ESLint passed. Backend Ruff and git diff whitespace checks passed. Backend OpenAPI and frontend contracts were regenerated.
- Real browser session: the dev overview renders candidate history, source pie segments, pipeline bars, the original top candidates and meetings without an error overlay. The calendar shows all three saved meetings with actual dates and duration; the top candidate link opens the profile. Mobile overview fits a 390px screen after chart layout completes; browser reports no errors.

The calendar reads canonical meetings. Interview write endpoints are available; calendar forms for create/edit/delete and feedback remain on the MVP roadmap. Developer edits in the existing candidate/vacancy preview remain session-local as documented in DEV_DATABASE.md; overview and calendar read persisted dev database records.
