import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { JobFormValues } from "../model/JobSchema";

type Props = {
  register: UseFormRegister<JobFormValues>;
  errors: FieldErrors<JobFormValues>;
};

const STAFF_CATEGORY_OPTIONS = [
  "ППС (Профессорско-преподавательский состав)",
  "Учебно-вспомогательный персонал (УВП)",
  "Научные сотрудники",
  "Административно-управленческий персонал (АУП)",
  "АХП (Хозяйственный и обслуживающий персонал)",
] as const;

const ACADEMIC_DEGREE_OPTIONS = [
  "Не требуется",
  "Магистр",
  "Кандидат наук / PhD",
  "Доктор наук",
] as const;

const EMPLOYMENT_TYPE_OPTIONS = [
  "Полная ставка (1.0)",
  "0.75 ставки",
  "0.5 ставки",
  "0.25 ставки",
  "Почасовая оплата",
  "Совместительство",
] as const;

const WORK_MODE_OPTIONS = ["Офис (в университете)", "Удалённо", "Гибрид"] as const;

const EXPERIENCE_OPTIONS = ["Без опыта", "1–3 года", "3–6 лет", "Более 6 лет", "Неважно"] as const;

const PRIORITY_OPTIONS = ["Низкий", "Средний", "Высокий"] as const;

export function NewJobFormFields({ register, errors }: Props) {
  const fieldClass =
    "w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary";

  const errorClass = "mt-1 text-xs text-danger";

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <input
          placeholder="Название вакансии"
          className={fieldClass}
          {...register("title")}
        />
        {errors.title && <p className={errorClass}>{errors.title.message}</p>}
      </div>

      <div>
        <select className={fieldClass} {...register("staffCategory")}>
          {STAFF_CATEGORY_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {errors.staffCategory && <p className={errorClass}>{errors.staffCategory.message}</p>}
      </div>

      <div>
        <select className={fieldClass} {...register("academicDegree")}>
          {ACADEMIC_DEGREE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {errors.academicDegree && <p className={errorClass}>{errors.academicDegree.message}</p>}
      </div>

      <div>
        <input placeholder="Кафедра / отдел" className={fieldClass} {...register("department")} />
        {errors.department && <p className={errorClass}>{errors.department.message}</p>}
      </div>

      <input placeholder="Локация" className={fieldClass} {...register("location")} />

      <div>
        <select className={fieldClass} {...register("employmentType")}>
          {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {errors.employmentType && <p className={errorClass}>{errors.employmentType.message}</p>}
      </div>

      <div>
        <select className={fieldClass} {...register("workMode")}>
          {WORK_MODE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {errors.workMode && <p className={errorClass}>{errors.workMode.message}</p>}
      </div>

      <div>
        <select className={fieldClass} {...register("experienceLevel")}>
          {EXPERIENCE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {errors.experienceLevel && <p className={errorClass}>{errors.experienceLevel.message}</p>}
      </div>

      <div>
        <select className={fieldClass} {...register("priority")}>
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {errors.priority && <p className={errorClass}>{errors.priority.message}</p>}
      </div>

      <input
        placeholder="Зарплата от"
        type="number"
        className={fieldClass}
        {...register("salaryMin")}
      />

      <div>
        <input
          placeholder="Зарплата до"
          type="number"
          className={fieldClass}
          {...register("salaryMax")}
        />
        {errors.salaryMax && <p className={errorClass}>{errors.salaryMax.message}</p>}
      </div>

      <input placeholder="Валюта" className={fieldClass} {...register("currency")} />

      <input
        placeholder="Кол-во ставок"
        type="number"
        className={fieldClass}
        {...register("openingsCount")}
      />

      <input
        placeholder="Требуемые навыки (через запятую)"
        className={`${fieldClass} md:col-span-2`}
        {...register("requiredSkills")}
      />

      <input placeholder="Рекрутер" className={fieldClass} {...register("recruiter")} />

      <input type="date" className={fieldClass} {...register("closingDate")} />

      <textarea
        placeholder="Краткое описание"
        rows={3}
        className={`${fieldClass} md:col-span-2`}
        {...register("description")}
      />
    </div>
  );
}