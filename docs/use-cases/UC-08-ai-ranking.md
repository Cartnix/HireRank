# UC-08 AI ranking

Actor:
System

Preconditions:
- Candidate questionnaire is saved
- Enterprise is resolved
- Local Qwen 2.5 ranking service is available

Flow:
1. System receives the saved JSON questionnaire.
2. System analyzes candidate data against enterprise vacancies.
3. System calculates match score for each vacancy.
4. Best vacancy is selected.
5. Score and ranking list are stored or turned.

DoD:
- Score is within `0-10`.
- Ranking is executed locally.
- Data stays inside the enterprise infrastructure.
- Best vacancy match is determined for the candidate.
