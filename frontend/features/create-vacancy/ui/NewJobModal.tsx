"use client";

import { LoaderCircle, X } from "lucide-react";
import type { CreateVacancyPayload, Job } from "@/entities/job";
import { Card } from "@/shared/ui/card";
import { GhostButton } from "@/shared/ui/buttons/GhostButton";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import { useNewJobForm } from "../model/useNewJobForm";
import { NewJobFormFields } from "./NewJobFormFields";

export function NewJobModal({
  onClose,
  onCreate,
  createJob,
}: {
  onClose: () => void;
  onCreate: (job: Job) => void;
  createJob?: (payload: CreateVacancyPayload) => Promise<Job>;
}) {
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
    onSubmit,
  } = useNewJobForm(onCreate, createJob);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-vacancy-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Card className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-border/80 bg-background-elevated p-0 shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-primary">
              Новая позиция
            </p>
            <h2 id="new-vacancy-title" className="m-0! text-xl font-semibold">
              Создать вакансию
            </h2>
            <p className="mb-0 mt-1 text-sm text-muted-foreground">
              Заполните информацию, которая будет показана в каталоге Careers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть форму"
            title="Закрыть"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            {errors.root?.message && (
              <p
                role="alert"
                className="mb-5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
              >
                {errors.root.message}
              </p>
            )}
            <NewJobFormFields
              register={register}
              errors={errors}
              control={control}
              setValue={setValue}
            />
          </div>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-border bg-background-elevated px-5 py-4 sm:px-7">
            <GhostButton type="button" onClick={onClose}>
              Отмена
            </GhostButton>
            <MainButton
              title={isSubmitting ? "Сохраняем..." : "Создать вакансию"}
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-w-40 items-center justify-center gap-2 rounded-lg"
            >
              {isSubmitting && <LoaderCircle size={16} className="animate-spin" />}
            </MainButton>
          </footer>
        </form>
      </Card>
    </div>
  );
}