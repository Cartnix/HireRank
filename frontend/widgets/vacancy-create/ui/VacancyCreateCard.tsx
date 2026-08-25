"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type VacancyFormData = {
  title: string;
  status: "draft";
  department: string;
  description: string;
  requirements: string[];
};

const EMPTY_FORM: VacancyFormData = {
  title: "",
  status: "draft",
  department: "",
  description: "",
  requirements: [],
};

function IconX({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconPlus({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-span font-medium uppercase tracking-wide text-foreground-tertiary">
      {children}
    </span>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-p text-foreground placeholder:text-foreground-tertiary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

export default function VacancyModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VacancyFormData) => void;
}) {
  const [form, setForm] = useState<VacancyFormData>(EMPTY_FORM);
  const [requirementDraft, setRequirementDraft] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const update = <K extends keyof VacancyFormData>(key: K, value: VacancyFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addRequirement = () => {
    const value = requirementDraft.trim();
    if (!value) return;
    update("requirements", [...form.requirements, value]);
    setRequirementDraft("");
  };

  const handleRequirementKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addRequirement();
    }
  };

  const removeRequirement = (index: number) =>
    update(
      "requirements",
      form.requirements.filter((_, i) => i !== index)
    );

  const isValid = form.title.trim().length > 0 && form.requirements.length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(form);
    setForm(EMPTY_FORM);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vacancy-modal-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background-elevated shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 id="vacancy-modal-title" className="mt-0! mb-0.5! text-h3 font-semibold text-foreground">
              Новая вакансия
            </h3>
            <span className="text-span text-foreground-tertiary">Для публикации в карьерном центре вуза</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-8 items-center justify-center rounded-full text-foreground-secondary transition hover:bg-muted hover:text-foreground"
          >
            <IconX />
          </button>
        </div>

        {/* Body */}
        <form id="vacancy-form" onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-1.5">
            <Label>Название вакансии *</Label>
            <input
              className={inputClass}
              placeholder="Frontend-разработчик (стажёр)"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Отдел</Label>
            <input
              className={inputClass}
              placeholder="Название отдела"
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Описание</Label>
            <textarea
              className={inputClass + " min-h-24 resize-none"}
              placeholder="Чем предстоит заниматься студенту на этой позиции..."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Требования</Label>
            <div className="space-y-2 rounded-xl border border-border bg-background p-2.5">
              {form.requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-brand-primary" />
                  <span className="flex-1 text-p text-foreground">{req}</span>
                  <button
                    type="button"
                    onClick={() => removeRequirement(i)}
                    aria-label="Удалить требование"
                    className="text-foreground-tertiary transition hover:text-danger"
                  >
                    <IconX className="size-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 px-1">
                <input
                  className="flex-1 bg-transparent text-p text-foreground placeholder:text-foreground-tertiary outline-none"
                  placeholder="Знание основ алгоритмов..."
                  value={requirementDraft}
                  onChange={(e) => setRequirementDraft(e.target.value)}
                  onKeyDown={handleRequirementKeyDown}
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground-secondary transition hover:bg-border"
                  aria-label="Добавить требование"
                >
                  <IconPlus className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-p font-medium text-foreground-secondary transition hover:bg-muted"
          >
            Отмена
          </button>
          <button
            type="submit"
            form="vacancy-form"
            disabled={!isValid}
            className="rounded-xl bg-brand-primary px-5 py-2.5 text-p font-medium text-brand-primary-foreground transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Опубликовать вакансию
          </button>
        </div>
      </div>
    </div>
  );
}