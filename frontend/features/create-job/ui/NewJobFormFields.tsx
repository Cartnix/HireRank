import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { JobFormValues } from "../model/JobSchema";

type Props = {
  register: UseFormRegister<JobFormValues>;
  errors: FieldErrors<JobFormValues>;
};

export function NewJobFormFields({ register, errors }: Props) {
  const fieldClass =
    "w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary";

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <input
          placeholder="Название вакансии"
          className={fieldClass}
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-danger">{errors.title.message}</p>
        )}
      </div>

      <input placeholder="Отдел" className={fieldClass} {...register("department")} />
      <input placeholder="Локация" className={fieldClass} {...register("location")} />
      {/* ... остальные поля через register("fieldName") ... */}

      <select className={fieldClass} {...register("workMode")}>
        <option value="Удалённо">Удалённо</option>
        <option value="Офис">Офис</option>
        <option value="Гибрид">Гибрид</option>
      </select>

      <div>
        <input
          placeholder="Зарплата до"
          type="number"
          className={fieldClass}
          {...register("salaryMax")}
        />
        {errors.salaryMax && (
          <p className="mt-1 text-xs text-danger">{errors.salaryMax.message}</p>
        )}
      </div>

      <textarea
        placeholder="Краткое описание"
        rows={3}
        className={`${fieldClass} md:col-span-2`}
        {...register("description")}
      />
    </div>
  );
}