export interface Interview {
  id: string;
  candidateId: string;
  day: number;
  startHour: number;
  duration: number;
  interviewer: string;
  type: "Видео" | "Звонок" | "Очно";
}
