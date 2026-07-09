import { Candidate } from "./types";

export const initialCandidates: Candidate[] = [
  { id: "c1", name: "Александр Ким", jobId: "j1", stage: "Интервью", source: "LinkedIn", appliedDate: "2026-06-02", email: "a.kim@mail.com", phone: "+7 701 111 2233", location: "Алматы", skills: ["React", "TypeScript", "GraphQL"], rating: 4, resumeFileName: "Kim_A_CV.pdf", history: [
    { date: "2026-06-02", action: "Отклик на вакансию" },
    { date: "2026-06-05", action: "Пройден скрининг-звонок" },
    { date: "2026-06-20", action: "Назначено техническое интервью" },
  ] },
  { id: "c2", name: "Дана Ахметова", jobId: "j1", stage: "Скрининг", source: "Реферал", appliedDate: "2026-06-10", email: "dana.a@mail.com", phone: "+7 701 222 3344", location: "Алматы", skills: ["React", "Next.js", "CSS"], rating: 5, resumeFileName: "Akhmetova_CV.pdf", history: [
    { date: "2026-06-10", action: "Рекомендована сотрудником" },
    { date: "2026-06-11", action: "Резюме на рассмотрении" },
  ] },
  { id: "c3", name: "Тимур Сериков", jobId: "j1", stage: "Отклик", source: "HH.ru", appliedDate: "2026-06-25", email: "t.serikov@mail.com", phone: "+7 701 333 4455", location: "Шымкент", skills: ["Vue", "JavaScript"], rating: 3, resumeFileName: "Serikov_CV.pdf", history: [{ date: "2026-06-25", action: "Отклик на вакансию" }] },
  { id: "c4", name: "Мадина Оспанова", jobId: "j2", stage: "Оффер", source: "Карьерный сайт", appliedDate: "2026-05-25", email: "m.ospanova@mail.com", phone: "+7 701 444 5566", location: "Астана", skills: ["Product Discovery", "SQL", "Figma"], rating: 5, resumeFileName: "Ospanova_CV.pdf", history: [
    { date: "2026-05-25", action: "Отклик на вакансию" },
    { date: "2026-06-01", action: "Скрининг пройден" },
    { date: "2026-06-15", action: "Финальное интервью" },
    { date: "2026-06-28", action: "Отправлен оффер" },
  ] },
  { id: "c5", name: "Ержан Абаев", jobId: "j2", stage: "Интервью", source: "LinkedIn", appliedDate: "2026-06-01", email: "e.abaev@mail.com", phone: "+7 701 555 6677", location: "Астана", skills: ["Аналитика", "A/B тесты"], rating: 4, resumeFileName: "Abaev_CV.pdf", history: [{ date: "2026-06-01", action: "Отклик на вакансию" }] },
  { id: "c6", name: "Сауле Жумабекова", jobId: "j3", stage: "Скрининг", source: "Агентство", appliedDate: "2026-04-10", email: "s.zhuma@mail.com", phone: "+7 701 666 7788", location: "Удалённо", skills: ["Figma", "UX Research"], rating: 4, resumeFileName: "Zhumabekova_CV.pdf", history: [{ date: "2026-04-10", action: "Отклик на вакансию" }] },
  { id: "c7", name: "Артём Волков", jobId: "j4", stage: "Интервью", source: "HH.ru", appliedDate: "2026-06-05", email: "a.volkov@mail.com", phone: "+7 701 777 8899", location: "Алматы", skills: ["Go", "PostgreSQL", "Kafka"], rating: 5, resumeFileName: "Volkov_CV.pdf", history: [
    { date: "2026-06-05", action: "Отклик на вакансию" },
    { date: "2026-06-18", action: "Тестовое задание выполнено" },
  ] },
  { id: "c8", name: "Нурлан Байтасов", jobId: "j4", stage: "Скрининг", source: "Реферал", appliedDate: "2026-06-20", email: "n.baitasov@mail.com", phone: "+7 701 888 9900", location: "Алматы", skills: ["Go", "Docker"], rating: 3, resumeFileName: "Baitasov_CV.pdf", history: [{ date: "2026-06-20", action: "Отклик на вакансию" }] },
  { id: "c9", name: "Айгерим Смагулова", jobId: "j4", stage: "Отказ", source: "LinkedIn", appliedDate: "2026-05-15", email: "a.smagulova@mail.com", phone: "+7 701 999 0011", location: "Караганда", skills: ["Java"], rating: 2, resumeFileName: "Smagulova_CV.pdf", history: [
    { date: "2026-05-15", action: "Отклик на вакансию" },
    { date: "2026-05-22", action: "Отказ после скрининга" },
  ] },
  { id: "c10", name: "Бекзат Нуртаев", jobId: "j6", stage: "Отклик", source: "Карьерный сайт", appliedDate: "2026-06-28", email: "b.nurtaev@mail.com", phone: "+7 701 000 1122", location: "Алматы", skills: ["B2B продажи", "CRM"], rating: 3, resumeFileName: "Nurtaev_CV.pdf", history: [{ date: "2026-06-28", action: "Отклик на вакансию" }] },
  { id: "c11", name: "Айнур Тлеубаева", jobId: "j5", stage: "Нанят", source: "Реферал", appliedDate: "2026-03-12", email: "a.tleubaeva@mail.com", phone: "+7 701 123 4567", location: "Астана", skills: ["HR BP", "Employee Relations"], rating: 5, resumeFileName: "Tleubaeva_CV.pdf", history: [
    { date: "2026-03-12", action: "Отклик на вакансию" },
    { date: "2026-03-25", action: "Финальное интервью" },
    { date: "2026-04-02", action: "Оффер принят" },
  ] },
  { id: "c12", name: "Данияр Ислямов", jobId: "j1", stage: "Отказ", source: "HH.ru", appliedDate: "2026-05-28", email: "d.islyamov@mail.com", phone: "+7 701 234 5678", location: "Алматы", skills: ["Angular"], rating: 2, resumeFileName: "Islyamov_CV.pdf", history: [{ date: "2026-05-28", action: "Отклик на вакансию" }] },
  { id: "c13", name: "Жанна Рахимова", jobId: "j2", stage: "Скрининг", source: "LinkedIn", appliedDate: "2026-06-18", email: "zh.rakhimova@mail.com", phone: "+7 701 345 6789", location: "Астана", skills: ["Roadmapping", "Jira"], rating: 4, resumeFileName: "Rakhimova_CV.pdf", history: [{ date: "2026-06-18", action: "Отклик на вакансию" }] },
  { id: "c14", name: "Олжас Кенжебаев", jobId: "j3", stage: "Отклик", source: "Карьерный сайт", appliedDate: "2026-06-27", email: "o.kenzhebaev@mail.com", phone: "+7 701 456 7890", location: "Алматы", skills: ["Figma", "Illustrator"], rating: 3, resumeFileName: "Kenzhebaev_CV.pdf", history: [{ date: "2026-06-27", action: "Отклик на вакансию" }] },
  { id: "c15", name: "Гульнара Есенова", jobId: "j6", stage: "Интервью", source: "Агентство", appliedDate: "2026-06-08", email: "g.esenova@mail.com", phone: "+7 701 567 8901", location: "Алматы", skills: ["B2B продажи", "Переговоры"], rating: 4, resumeFileName: "Esenova_CV.pdf", history: [{ date: "2026-06-08", action: "Отклик на вакансию" }] },
];

export async function getCandidates(): Promise<Candidate[]> {
  return initialCandidates;
}
