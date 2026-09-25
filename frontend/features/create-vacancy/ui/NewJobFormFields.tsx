import {
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import {
  Briefcase,
  Building2,
  FileText,
  ListChecks,
  MapPin,
  Plus,
  User,
  Wallet,
  X,
} from "lucide-react";
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPES,
  JOB_STATUS_LABELS,
  JOB_STATUSES,
  LOCATIONS,
  type JobFormValues,
} from "../model/JobSchema";
import { useState } from "react";

type Props = {
  register: UseFormRegister<JobFormValues>;
  control: Control<JobFormValues>;
  setValue: UseFormSetValue<JobFormValues>;
  errors: FieldErrors<JobFormValues>;
};

const MAX_DESCRIPTION_LENGTH = 1000;

export function NewJobFormFields({
  register,
  errors,
  control,
  setValue,
}: Props) {
  const fieldClass =
    "w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10";

  const labelClass =
    "mb-1 flex items-center gap-1.5 text-[13px] font-medium text-foreground-secondary";

  const errorClass = "mt-1 text-xs text-danger";

  const [text, setText] = useState<string>("");

  const currentRequirements = useWatch({
    control,
    name: "requirements",
    defaultValue: [],
  });

  const description = useWatch({
    control,
    name: "description",
    defaultValue: "",
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
        <label className={labelClass}>
          <Briefcase size={13} /> Название вакансии
        </label>
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
        <label className={labelClass}>
          <Building2 size={13} /> Отдел
        </label>
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
        <select className={`${fieldClass} cursor-pointer`} {...register("status")}>
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

      {/* Локация */}
      <div>
        <label className={labelClass}>
          <MapPin size={13} /> Локация
        </label>
        <select className={`${fieldClass} cursor-pointer`} {...register("location")}>
          <option value="">Не указано</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Формат занятости */}
      <div>
        <label className={labelClass}>
          <Briefcase size={13} /> Формат занятости
        </label>
        <select className={`${fieldClass} cursor-pointer`} {...register("employmentType")}>
          <option value="">Не указано</option>
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EMPLOYMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Опыт работы */}
      <div>
        <label className={labelClass}>Опыт работы</label>
        <input
          placeholder="Например, 1–3 года"
          className={fieldClass}
          {...register("experience")}
        />
      </div>

      {/* Рекрутер */}
      <div>
        <label className={labelClass}>
          <User size={13} /> Рекрутер
        </label>
        <input
          placeholder="Имя ответственного рекрутера"
          className={fieldClass}
          {...register("recruiter")}
        />
      </div>

      {/* Зарплатная вилка */}
      <div className="md:col-span-2">
        <label className={labelClass}>
          <Wallet size={13} /> Зарплатная вилка
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="От"
            className={fieldClass}
            {...register("salaryMin", { valueAsNumber: true })}
          />
          <span className="shrink-0 text-foreground-secondary">—</span>
          <input
            type="number"
            placeholder="До"
            className={fieldClass}
            {...register("salaryMax", { valueAsNumber: true })}
          />
        </div>
        {(errors.salaryMin || errors.salaryMax) && (
          <p className={errorClass}>
            {(errors.salaryMin?.message as string) ||
              (errors.salaryMax?.message as string)}
          </p>
        )}
      </div>

      <div className="md:col-span-2">
        <div className="mb-1 flex items-center justify-between">
          <label className={`${labelClass} mb-0`}>
            <FileText size={13} /> Описание
          </label>
          <span className="text-[11px] text-muted-foreground">
            {description?.length ?? 0}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <textarea
          placeholder="Расскажите о задачах и условиях работы"
          className={`${fieldClass} min-h-25 resize-y`}
          maxLength={MAX_DESCRIPTION_LENGTH}
          {...register("description")}
        />
        {errors.description && (
          <p className={errorClass}>{errors.description.message as string}</p>
        )}
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>
          <ListChecks size={13} /> Требования
        </label>
        <div className="flex gap-2">
          <input
            placeholder="Введите требование и нажмите Enter или +"
            className={fieldClass}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!text.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-brand-primary text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>

        {currentRequirements.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {currentRequirements.map((req, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs"
              >
                {req}
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  className="text-foreground-secondary transition-colors hover:text-danger"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-muted-foreground">
            Добавьте хотя бы одно требование к кандидату
          </p>
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