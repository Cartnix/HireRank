"use client";

import { X } from "lucide-react";
import type { Job } from "@/entities/job";
import { Card } from "@/shared/ui/Card";
import { GhostButton } from "@/shared/ui/buttons/GhostButton";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import { useNewJobForm } from "../model/useNewJobForm";
import { NewJobFormFields } from "./NewJobFormFields";

export function NewJobModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (job: Job) => void;
}) {
  const {
    register,
    formState: { errors },
    onSubmit,
  } = useNewJobForm(onCreate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Card className="w-full max-w-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[16px] font-semibold">Новая вакансия</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <NewJobFormFields register={register} errors={errors} />

          <div className="mt-5 flex justify-end gap-2">
            <GhostButton onClick={onClose}>
              Отмена
            </GhostButton>
            <MainButton title="Создать" type="submit" />
          </div>
        </form>
      </Card>
    </div>
  );
}