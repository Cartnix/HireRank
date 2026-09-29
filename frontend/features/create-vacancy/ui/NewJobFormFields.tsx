import { useDemo } from "@/features/demo/DemoProvider";
import { DemoBadge } from "@/shared/ui/badges/DemoBadge";
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
  const { enabled } = useDemo();
  const fieldClass =
    "h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10";

  const labelClass =
    "mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground";

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
    <div className="space-y-6">
      <section>
        <div className="mb-3 border-b border-border pb-2">
          <h3 className="m-0! text-sm font-semibold text-foreground">Основное</h3>
          <p className="mb-0 mt-1 text-xs text-muted-foreground">
            Эти данные появятся в карточке открытой вакансии.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              <Briefcase size={14} /> Название вакансии
            </label>
            <input
              placeholder="Например, Frontend-разработчик"
              className={fieldClass}
              {...register("title")}
            />
            {errors.title && <p className={errorClass}>{errors.title.message}</p>}
          </div>

          <div>
            <label className={labelClass}>
              <Building2 size={14} /> Отдел
            </label>
            <input
              placeholder="Например, Разработка"
              className={fieldClass}
              {...register("department")}
            />
            {errors.department && (
              <p className={errorClass}>{errors.department.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Публикация</label>
            <select className={`${fieldClass} cursor-pointer`} {...register("status")}>
              {JOB_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {JOB_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          {enabled && <div>
            <label className={labelClass}>
              <MapPin size={14} /> Формат работы <DemoBadge label="Dev mode · не сохраняется" />
            </label>
            <select className={`${fieldClass} cursor-pointer`} disabled {...register("location")}>
              <option value="">Не указан</option>
              {LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>}

          {enabled && <div>
            <label className={labelClass}>
              <Briefcase size={14} /> Занятость <DemoBadge label="Dev mode · не сохраняется" />
            </label>
            <select
              className={`${fieldClass} cursor-pointer`}
              disabled {...register("employmentType")}
            >
              <option value="">Не указана</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>}

          {enabled && <div>
            <label className={labelClass}>Опыт работы <DemoBadge label="Dev mode · не сохраняется" /></label>
            <input
              placeholder="Например, от 2 лет"
              className={fieldClass}
              disabled {...register("experience")}
            />
          </div>}
        </div>
      </section>

      <section>
        <div className="mb-3 border-b border-border pb-2">
          <h3 className="m-0! text-sm font-semibold text-foreground">
            Описание и требования
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className={`${labelClass} mb-0`}>
                <FileText size={14} /> Описание
              </label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {description?.length ?? 0}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <textarea
              placeholder="Задачи, команда и особенности роли"
              className={`${fieldClass} h-auto min-h-32 resize-y py-3 leading-6`}
              maxLength={MAX_DESCRIPTION_LENGTH}
              {...register("description")}
            />
            {errors.description && (
              <p className={errorClass}>{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              <ListChecks size={14} /> Требования
            </label>
            <div className="flex gap-2">
              <input
                placeholder="Добавьте требование"
                className={fieldClass}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!text.trim()}
                aria-label="Добавить требование"
                title="Добавить требование"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-brand-primary-foreground transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={17} />
              </button>
            </div>

            {currentRequirements.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {currentRequirements.map((requirement, index) => (
                  <li
                    key={`${requirement}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 break-words">{requirement}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      aria-label={`Удалить требование: ${requirement}`}
                      title="Удалить требование"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-0 mt-2 text-xs text-muted-foreground">
                Добавьте хотя бы одно требование.
              </p>
            )}
            {errors.requirements && (
              <p className={errorClass}>
                {errors.requirements.message || "Проверьте список требований"}
              </p>
            )}
          </div>
        </div>
      </section>

      {enabled && <section>
        <div className="mb-3 border-b border-border pb-2">
          <h3 className="m-0! text-sm font-semibold text-foreground">
            Условия и команда
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {enabled && <div className="sm:col-span-2">
            <label className={labelClass}>
              <Wallet size={14} /> Зарплатная вилка, ₸ <DemoBadge label="Dev mode · не сохраняется" />
            </label>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input
                type="number"
                min="1"
                placeholder="От"
                aria-label="Зарплата от"
                className={fieldClass}
                disabled {...register("salaryMin", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
              />
              <span className="text-muted-foreground">—</span>
              <input
                type="number"
                min="1"
                placeholder="До"
                aria-label="Зарплата до"
                className={fieldClass}
                disabled {...register("salaryMax", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
              />
            </div>
            {(errors.salaryMin || errors.salaryMax) && (
              <p className={errorClass}>
                {errors.salaryMin?.message || errors.salaryMax?.message}
              </p>
            )}
          </div>}

          {enabled && <div>
            <label className={labelClass}>
              <User size={14} /> Ответственный рекрутер <DemoBadge label="Dev mode · не сохраняется" />
            </label>
            <input
              placeholder="Имя рекрутера"
              className={fieldClass}
              disabled {...register("recruiter")}
            />
          </div>}
        </div>
      </section>}
    </div>
  );
}