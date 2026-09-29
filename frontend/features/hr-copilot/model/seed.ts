import type { CopilotState } from "./types";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";
export const initialCopilotState: CopilotState = {
  version: 1,
  tenants: [{ id: tenantId, name: "HireRank · Demo Enterprise" }],
  vacancies: [
    { id: "v-design", tenantId, title: "Product Designer", department: "Продукт", location: "Астана · гибрид", description: "Исследования пользователей, прототипы и дизайн системы.", open: true },
    { id: "v-frontend", tenantId, title: "Frontend Engineer", department: "Разработка", location: "Удалённо", description: "React, TypeScript, доступность и производительность интерфейсов.", open: true },
    { id: "v-people", tenantId, title: "People Partner", department: "HR", location: "Астана", description: "Сопровождение команд и HR процессов.", open: false },
  ],
  candidates: [
    { id: "c-aliya", tenantId, name: "Алия Садыкова", email: "aliya@example.com", phone: "+7 700 111 22 33", experience: "5 лет продуктового дизайна. Проводила интервью и создала дизайн систему для B2B платформы.", skills: "Figma, исследования пользователей, дизайн системы", resumeRef: "aliya-portfolio.pdf", resumeText: "", status: "assigned", vacancyId: "v-design", requestedVacancyId: null, source: "candidate", createdAt: "2026-09-23T10:00:00.000Z" },
    { id: "c-timur", tenantId, name: "Тимур Омаров", email: "timur@example.com", phone: "+7 700 222 33 44", experience: "3 года React и TypeScript. Разработал доступные компоненты интерфейса.", skills: "React, TypeScript, WCAG", resumeRef: "timur-cv.pdf", resumeText: "", status: "new", vacancyId: null, requestedVacancyId: "v-frontend", source: "recruiter", createdAt: "2026-09-24T10:00:00.000Z" },
  ],
  prompts: [
    { tenantId, text: "Оцени подтверждённый опыт по вакансии. Green flag: конкретный релевантный проект. Red flag: недостаточно деталей. Предложи до трёх действий, объясни каждый вариант. Не изменяй статус без HR.", useMemory: false, allowedActions: ["interview", "review", "rejected"], version: 1 },
  ],
  evaluations: [], feedback: [], notifications: [], audit: [], memory: [], mcpRuns: [],
};
