import {
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { JOB_STATUS_LABELS, JOB_STATUSES, type JobFormValues } from "../model/JobSchema";
import { useState } from "react";

type Props = {
  register: UseFormRegister<JobFormValues>;
  control: Control<JobFormValues>;
  setValue: UseFormSetValue<JobFormValues>;
  errors: FieldErrors<JobFormValues>;
};

export function NewJobFormFields({
  register,
  errors,
  control,
  setValue,
}: Props) {
  const fieldClass =
    "w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary";

  const labelClass = "mb-1 block text-[13px] font-medium text-foreground-secondary";

  const errorClass = "mt-1 text-xs text-danger";

  const [text, setText] = useState<string>("");

  const currentRequirements = useWatch({
    control,
    name: "requirements",
    defaultValue: [],
  });

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setValue("requirements", [...currentRequirements, trimmed], {
      shouldValidate: true,
      shouldDirty: true,
    });
    setText("");
  };

  const handleDelete = (indexToDelete: number) => {
    const newArr = currentRequirements.filter(
      (_, index) => index !== indexToDelete
    );
    setValue("requirements", newArr, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Название вакансии */}
      <div>
        <label className={labelClass}>Название вакансии</label>
        <input
          placeholder="Например, Frontend-разработчик"
          className={fieldClass}
          {...register("title")}
        />
        {errors.title && (
          <p className={errorClass}>{errors.title.message as string}</p>
        )}
      </div>

      {/* Отдел */}
      <div>
        <label className={labelClass}>Отдел</label>
        <input
          placeholder="Например, Разработка"
          className={fieldClass}
          {...register("department")}
        />
        {errors.department && (
          <p className={errorClass}>{errors.department.message as string}</p>
        )}
      </div>

      <div>
          <label className={labelClass}>Статус</label>
          <select className={fieldClass} {...register("status")}>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {JOB_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className={errorClass}>{errors.status.message as string}</p>
          )}
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Описание</label>
        <textarea
          placeholder="Расскажите о задачах и условиях работы"
          className={`${fieldClass} min-h-25 resize-y`}
          {...register("description")}
        />
        {errors.description && (
          <p className={errorClass}>{errors.description.message as string}</p>
        )}
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Требования</label>
        <div className="flex gap-2">
          <input
            placeholder="Введите требование и нажмите +"
            className={fieldClass}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-brand-primary text-white text-lg font-medium hover:opacity-90 transition-opacity"
          >
            +
          </button>
        </div>

        {currentRequirements.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {currentRequirements.map((req, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs"
              >
                {req}
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  className="text-foreground-secondary hover:text-danger transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {errors.requirements && (
          <p className={errorClass}>
            {(errors.requirements.message as string) ||
              "Проверьте список требований"}
          </p>
        )}
      </div>
    </div>
  );
}