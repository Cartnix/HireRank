import { Note } from "./types";

export const initialNotes: Record<string, Note[]> = {
  c1: [
    { id: "n1", author: "Анна Петрова", date: "2026-06-05", text: "Хорошо ориентируется в производительности React, но слабее с тестами." },
  ],
  c4: [
    { id: "n2", author: "Дмитрий Волков", date: "2026-06-15", text: "Отличная харизма и структурность в кейсах. Готовим оффер." },
  ],
  c7: [
    { id: "n3", author: "Игорь Соколов", date: "2026-06-18", text: "Сильный technical background, обсудить зарплатные ожидания." },
  ],
};
