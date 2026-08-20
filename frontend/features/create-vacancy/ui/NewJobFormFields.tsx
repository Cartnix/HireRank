import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { JobFormValues } from "../model/JobSchema";

type Props = {
  register: UseFormRegister<JobFormValues>;
  errors: FieldErrors<JobFormValues>;
};

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

      <div className="md:col-span-2">
        <input
          placeholder="Кафедра / отдел"
          className={fieldClass}
          {...register("department")}
        />
        {errors.department && <p className={errorClass}>{errors.department.message}</p>}
      </div>

      <div className="md:col-span-2">
        <textarea
          placeholder="Краткое описание"
          rows={3}
          className={fieldClass}
          {...register("description")}
        />
        {errors.description && <p className={errorClass}>{errors.description.message}</p>}
      </div>

      <div className="md:col-span-2">
        <textarea
          placeholder="Требования (каждое с новой строки)"
          rows={4}
          className={fieldClass}
          {...register("requirements")}
        />
        {errors.requirements && (
          <p className={errorClass}>{errors.requirements.message as string}</p>
        )}
      </div>
    </div>
  );
}