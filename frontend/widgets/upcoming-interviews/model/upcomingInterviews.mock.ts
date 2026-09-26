export interface Interview {
  id: string;
  candidateName: string;
  position: string;
  time: string;
  stage: string;
  initials: string;
}

export const upcomingInterviews: Interview[] = [
  {
    id: "1",
    candidateName: "Алексей Иванов",
    position: "Доцент кафедры ИСП",
    time: "14:00 - 14:45",
    stage: "Тех. интервью",
    initials: "АИ",
  },
  {
    id: "2",
    candidateName: "Марина Кузнецова",
    position: "Product Designer",
    time: "15:30 - 16:15",
    stage: "Пробная лекция",
    initials: "МК",
  },
  {
    id: "3",
    candidateName: "Дмитрий Соболев",
    position: "Senior Backend Developer",
    time: "17:00 - 17:45",
    stage: "Финал с ректором",
    initials: "ДС",
  },
];