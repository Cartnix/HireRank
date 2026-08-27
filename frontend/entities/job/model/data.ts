import type { Job } from "./types";

export const initialJobs: Job[] = [
  {
    id: "j1",
    title: "Доцент кафедры программной инженерии",
    status: "draft",
    department: "Факультет информационных технологий",
    description: "Ведение лекционных и практических занятий по дисциплинам алгоритмов и архитектуры ПО.",
    requirements: ["Преподавание", "Алгоритмы", "Научные публикации", "React/Node"],
  },
  {
    id: "j2",
    title: "Инженер-электроник учебной лаборатории",
    status: "draft",
    department: "Департамент инфраструктуры",
    description: "Обслуживание и техническая поддержка оборудования в компьютерных классах и лабораториях.",
    requirements: ["Пайка", "Диагностика ПК", "Сетевое оборудование"],
  },
  {
    id: "j3",
    title: "HR Business Partner",
    department: "HR",
    status: "draft",
    description: "HRBP для поддержки инженерных команд.",
    requirements: ["HR Strategy", "People Operations"],
  },
  {
    id: "j4",
    title: "Sales Manager",
    department: "Sales",
    status: "draft",
    description: "Менеджер по продажам корпоративным клиентам.",
    requirements: ["B2B Sales", "CRM", "Negotiation"],
  },
];

export async function getInitJobs(): Promise<Job[]> {
  return initialJobs;
}