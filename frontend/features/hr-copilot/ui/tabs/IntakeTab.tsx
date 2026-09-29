import type { FormEvent } from "react";

import type { Vacancy } from "../../model/types";
import { inputClass, primary } from "../constants";
import { Section } from "../Section";

export function IntakeTab({
  vacancies,
  submitIntake,
}: {
  vacancies: Vacancy[];
  submitIntake: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Section title="Одна анкета вместо обхода кабинетов" description="Кандидат или рекрутер вводит резюме в портал выбранной компании. Новый кандидат попадает в пул, AI запускается автоматически.">
        <form onSubmit={submitIntake} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">
            ФИО
            <input name="name" required minLength={2} className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold">
            Email
            <input type="email" name="email" required className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold">
            Телефон
            <input name="phone" required className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold">
            Файл резюме (имя сохраняется, байты нет)
            <input name="resumeFile" type="file" accept=".pdf,.doc,.docx,.html,.htm,.txt" className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Ссылка на резюме
            <input type="url" name="resumeUrl" className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Текст резюме
            <textarea name="resumeText" rows={2} className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Опыт
            <textarea name="experience" required minLength={10} rows={3} className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Навыки
            <input name="skills" required className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Предпочитаемая вакансия (HR решает о назначении)
            <select name="vacancyId" className={`${inputClass} mt-2`}>
              <option value="">Без предпочтения</option>
              {vacancies.filter((x) => x.open).map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex gap-2 text-xs sm:col-span-2">
            <input type="checkbox" required /> Согласен на обработку данных для рассмотрения анкеты в выбранной организации
          </label>
          <button className={`${primary} sm:col-span-2`}>
            Зарегистрировать и запустить AI
          </button>
        </form>
      </Section>

      <Section title="Что произойдёт" description="Всё в пределах выбранного tenant.">
        <ol className="mt-5 space-y-3 text-sm">
          {[
            "Карточка и ссылка / имя файла сохраняются в демо JSON",
            "HR и менеджер получают уведомления",
            "AI получает резюме, вакансию, промпт и включённую память",
            "HR проверяет Top‑3 и явно подтверждает действие",
            "Mock MCP меняет статус и пишет аудит",
          ].map((x, i) => (
            <li key={x} className="flex gap-3">
              <span className="font-bold text-brand-primary">0{i + 1}</span>
              {x}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
