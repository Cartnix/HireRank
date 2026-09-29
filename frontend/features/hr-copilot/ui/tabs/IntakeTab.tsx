import { DemoBadge } from "@/shared/ui/badges/DemoBadge";
import type { FormEvent } from "react";

import type { Vacancy } from "../../model/types";
import { inputClass, primary } from "../constants";
import { Section } from "../Section";

export function IntakeTab({
  vacancies,
  submitIntake,
  mvp = false, busy = false, initialValues,
}: {
  mvp?: boolean; busy?: boolean; initialValues?: Record<string, unknown>;
  vacancies: Pick<Vacancy, "id" | "title" | "open">[];
  submitIntake: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const value = (key: string) => {
    if (typeof initialValues?.[key] === "string") return initialValues[key] as string;
    if (key === "name") return [initialValues?.surname, initialValues?.first_name, initialValues?.patronymic].filter(value => typeof value === "string" && value).join(" ");
    return "";
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Section title="Одна анкета вместо обхода кабинетов" description={mvp ? "Анкета сохраняется в кандидатском пуле организации. Назначение на вакансию подтверждается отдельно." : "Кандидат или рекрутер вводит резюме в портал компании. Новый кандидат попадает в пул, AI запускается автоматически."}>
        <form onSubmit={submitIntake} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">
            ФИО
            <input defaultValue={value("name")} name="name" required minLength={2} className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold">
            Email
            <input type="email" defaultValue={value("email")} name="email" required className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold">
            Телефон
            <input defaultValue={value("phone")} name="phone" required className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold">
            Файл резюме {mvp ? <DemoBadge label="Демо · загрузка не подключена" /> : "(имя сохраняется, байты нет)"}
            <input disabled={mvp} name="resumeFile" type="file" accept=".pdf,.doc,.docx,.html,.htm,.txt" className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Ссылка на резюме
            <input type="url" defaultValue={value("resume_reference")} name="resumeUrl" className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Текст резюме
            <textarea defaultValue={value("resume_text")} name="resumeText" rows={2} className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Опыт
            <textarea defaultValue={value("experience")} name="experience" required minLength={10} rows={3} className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Навыки
            <input defaultValue={value("skills")} name="skills" required className={`${inputClass} mt-2`} />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Предпочитаемая вакансия (HR решает о назначении)
            <select defaultValue={value("requested_vacancy_id")} name="vacancyId" className={`${inputClass} mt-2`}>
              <option value="">Без предпочтения</option>
              {vacancies.filter((x) => x.open).map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex gap-2 text-xs sm:col-span-2">
            <input name="processingConsent" type="checkbox" required /> Согласен на обработку данных для рассмотрения анкеты в организации
          </label>
          <button disabled={busy} className={`${primary} sm:col-span-2`}>
            {mvp ? (busy ? "Сохраняем..." : "Сохранить анкету") : "Зарегистрировать и запустить AI"}
          </button>
        </form>
      </Section>

      <Section title="Что произойдёт" description="Анкета поступит в HireRank — единую организацию.">
        <ol className="mt-5 space-y-3 text-sm">
          {(mvp ? ["Анкета, текст и ссылка сохраняются на сервере", "Кандидат остаётся в пуле без автоматического назначения", "HR отдельно подтверждает назначение на открытую вакансию", "AI и загрузка файла ожидают следующих этапов"] : [
            "Карточка и ссылка / имя файла сохраняются в демо JSON",
            "HR и менеджер получают уведомления",
            "AI получает резюме, вакансию, промпт и включённую память",
            "HR проверяет Top‑3 и явно подтверждает действие",
            "Mock MCP меняет статус и пишет аудит",
          ]).map((x, i) => (
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
