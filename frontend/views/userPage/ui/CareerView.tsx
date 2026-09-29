"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/useAuth";
import { loadCopilotState } from "@/features/hr-copilot/model/storage";
import type { CopilotState } from "@/features/hr-copilot/model/types";
import { toDashboardJob } from "@/features/hr-copilot/model/dashboardAdapters";
import { MainButton } from "@/shared/ui/buttons/MainButton";

export const CareerView = ({ vacancyId }: { vacancyId?: string }) => {
  const router = useRouter();
  const { signOut } = useAuth();

  const [copilotState, setCopilotState] = useState<CopilotState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCopilotState(loadCopilotState());
      setLoading(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const tenantId = copilotState?.tenants[0]?.id ?? "";
  const vacancies = copilotState
    ? copilotState.vacancies
        .filter((vacancy) => vacancy.tenantId === tenantId && vacancy.open)
        .map(toDashboardJob)
    : [];

  const handleSignOut = async () => {
    const error = await signOut();
    if (!error) {
      router.push("/auth");
    }
  };

  const selectedVacancy = vacancies.find((vacancy) => vacancy.id === vacancyId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-2xl border border-border bg-background-elevated p-8 text-sm text-muted-foreground">
          Загрузка вакансий...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background-elevated/70 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-primary">
              {vacancyId ? "Вакансия" : "Карьера"}
            </p>
            <h1 className="text-2xl font-semibold">
              {vacancyId ? selectedVacancy?.title ?? "Вакансия не найдена" : "Открытые вакансии"}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {vacancyId
                ? selectedVacancy?.department ?? "Проверьте ссылку или вернитесь к списку вакансий."
                : "Ознакомьтесь с открытыми позициями и подробными условиями работы."}
            </p>
          </div>

          <MainButton
            onClick={handleSignOut}
            title="Выйти"
            className="w-full sm:w-auto"
          />
        </header>

        {vacancyId ? (
          selectedVacancy ? (
            <article className="overflow-hidden rounded-2xl border border-border bg-background-elevated shadow-sm">
              <div className="border-b border-border p-5 sm:p-8">
                <button
                  type="button"
                  onClick={() => router.push("/careers")}
                  className="mb-6 text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary-hover"
                >
                  ← Все вакансии
                </button>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    Открыта
                  </span>
                  {selectedVacancy.employmentType && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground-secondary">
                      {selectedVacancy.employmentType}
                    </span>
                  )}
                  {selectedVacancy.experience && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground-secondary">
                      Опыт: {selectedVacancy.experience}
                    </span>
                  )}
                </div>
                <h2 className="mb-0 mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                  {selectedVacancy.title}
                </h2>
                <p className="mb-0 mt-2 text-sm text-muted-foreground">
                  {selectedVacancy.department}
                  {selectedVacancy.location && ` · ${selectedVacancy.location}`}
                </p>
              </div>

              <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="space-y-7">
                  <section>
                    <h3 className="mb-2 mt-0 text-base font-semibold">О вакансии</h3>
                    <p className="mb-0 whitespace-pre-line text-sm leading-7 text-foreground-secondary">
                      {selectedVacancy.description || "Описание пока не добавлено."}
                    </p>
                  </section>
                  {selectedVacancy.requirements.length > 0 && (
                    <section>
                      <h3 className="mb-3 mt-0 text-base font-semibold">Требования</h3>
                      <ul className="space-y-2">
                        {selectedVacancy.requirements.map((requirement) => (
                          <li
                            key={requirement}
                            className="flex gap-2 text-sm leading-6 text-foreground-secondary"
                          >
                            <span className="text-brand-primary">•</span>
                            {requirement}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                <aside className="h-fit rounded-xl border border-border bg-background p-4">
                  <h3 className="mb-3 mt-0 text-sm font-semibold">Условия</h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Формат работы</dt>
                      <dd className="mt-0.5 text-foreground">
                        {selectedVacancy.location ?? "Не указан"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Занятость</dt>
                      <dd className="mt-0.5 text-foreground">
                        {selectedVacancy.employmentType ?? "Не указана"}
                      </dd>
                    </div>
                    {selectedVacancy.salaryMin != null &&
                      selectedVacancy.salaryMax != null && (
                        <div>
                          <dt className="text-xs text-muted-foreground">Зарплата</dt>
                          <dd className="mt-0.5 font-medium text-foreground">
                            {selectedVacancy.salaryMin.toLocaleString("ru-RU")}–
                            {selectedVacancy.salaryMax.toLocaleString("ru-RU")} ₸
                          </dd>
                        </div>
                      )}
                  </dl>
                </aside>
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-border bg-background-elevated p-8 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                Эта вакансия не найдена или больше не открыта.
              </p>
              <MainButton
                onClick={() => router.push("/careers")}
                title="К открытым вакансиям"
              />
            </div>
          )
        ) : vacancies.length ? (
          <div className="grid gap-4">
            {vacancies.map((vacancy) => (
                <article
                  key={vacancy.id}
                  className="rounded-2xl border border-border bg-background-elevated p-5 shadow-sm transition-all hover:border-brand-primary/30 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/careers/${vacancy.id}`)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="mb-0 mt-0 text-lg font-semibold">
                          {vacancy.title}
                        </h2>
                        <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">
                          {vacancy.employmentType ?? "Полная занятость"}
                        </span>
                      </div>
                      <p className="mb-0 mt-2 text-sm text-muted-foreground">
                        {vacancy.department} · {vacancy.location ?? "Формат не указан"}
                      </p>
                      <p className="mb-0 mt-2 line-clamp-2 max-w-2xl text-sm text-muted-foreground/90">
                        {vacancy.description}
                      </p>
                      <span className="mt-3 inline-block text-sm font-medium text-brand-primary">
                        Подробнее →
                      </span>
                    </button>
                  </div>
                </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-background-elevated px-6 py-12 text-center">
            <p className="mb-1 text-base font-semibold text-foreground">
              Сейчас открытых вакансий нет
            </p>
            <p className="mb-0 text-sm text-muted-foreground">
              Загляните позже — новые позиции появятся здесь.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
