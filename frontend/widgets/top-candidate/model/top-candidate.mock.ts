export interface TopCandidate {
  id: string;
  name: string;
  position: string;
  stage: string;
  aiScore: number;
  initials: string;
  stageColorClass: string;
}

export const topCandidatesMock: TopCandidate[] = [
  {
    id: "1",
    name: "Д-р Елена Варга",
    position: "Computer Science",
    stage: "Оценка коммитета",
    aiScore: 96,
    initials: "ЕВ",
    stageColorClass: "bg-warning/10 text-warning border-warning/20",
  },
  {
    id: "2",
    name: "Маркус Чен",
    position: "Public Policy",
    stage: "Пробная лекция",
    aiScore: 91,
    initials: "МЧ",
    stageColorClass: "bg-success/10 text-success border-success/20",
  },
  {
    id: "3",
    name: "Аиша Рахман",
    position: "Molecular Biology",
    stage: "Проверка рекомендаций",
    aiScore: 88,
    initials: "АР",
    stageColorClass: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  },
  {
    id: "4",
    name: "Йонас Линдберг",
    position: "Economics",
    stage: "Скрининг",
    aiScore: 84,
    initials: "ЙЛ",
    stageColorClass: "bg-cyan-main/10 text-cyan-main border-cyan-main/20",
  },
];