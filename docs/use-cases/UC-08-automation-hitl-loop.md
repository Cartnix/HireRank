# UC-08 Post-MVP LLM candidate recommendations

Status: **Post-MVP proposal.** This use case must not block the working ATS MVP.

Purpose:
Use an HR-defined prompt to analyze a resume against a vacancy and provide
explainable recommendations. The LLM may recommend next steps, but HR remains
responsible for the final action.

Actor: HR/operator, LLM service, candidate, and notification channel.

Preconditions:
- Candidate resume is attached to a vacancy.
- HR has defined an analysis prompt and allowed criteria.
- Tenant and candidate access are validated.

Flow:
1. HR requests analysis for a candidate attached to a vacancy.
2. The service builds context from the resume, vacancy, and HR prompt.
3. The LLM returns an explanation and up to three recommendations, such as
	`advance`, `interview`, or `reject`.
4. The recommendation and rationale are stored as an evaluation draft.
5. HR confirms or changes the recommendation.
6. The confirmed action updates the candidate status and is audit-logged.
7. The result may be delivered through the web app, Telegram, or WhatsApp.

Notes:
- This use case is post-MVP and may be implemented only after the ATS flow is stable.
- The result is a recommendation, not an unreviewed automatic disposition.
- **Compliance (strict):** must not violate [ATS_COMPLIANCE_RK.md](../laws/ATS_COMPLIANCE_RK.md) or [GDPR.md](../laws/GDPR.md).

Rules:
- LLM output must include rationale and relevant evidence.
- HR must confirm or change the recommendation before status mutation.
- Prompt, model, recommendation, final action, and actor are audit data.

DoD (post-MVP):
1. HR can configure a prompt per vacancy or organization.
2. A resume can be analyzed against that vacancy.
3. The LLM returns up to three explainable recommendations.
4. HR confirms or changes the recommendation before the candidate status changes.
5. Evaluation history is tenant-scoped and auditable.
6. Web delivery works before Telegram or WhatsApp delivery is added.
