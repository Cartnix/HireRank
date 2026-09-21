"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getVacancies, type Job } from "@/entities/job";
import { useAuth } from "@/features/auth/useAuth";
import { apiFetch, ApiError } from "@/shared/api/client";
import { useCurrentUser } from "@/shared/api/auth-store";
import type { components } from "@/shared/api/schema";
import { MainButton } from "@/shared/ui/buttons/MainButton";

type Candidate = components["schemas"]["CandidatePublic"];

export const CareerView = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const currentUser = useCurrentUser();

  const [vacancies, setVacancies] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getVacancies()
      .then((items) => {
        if (!cancelled) {
          setVacancies(items);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Не удалось загрузить вакансии",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    const error = await signOut();
    if (!error) {
      router.push("/auth");
    }
  };

  const handleApply = async (vacancy: Job) => {
    if (!currentUser) {
      router.push("/auth");
      return;
    }

    setApplyingId(vacancy.id);
    setSubmitError(null);

    try {
      const candidatePayload = {
        questionnaire: {
          first_name: currentUser.first_name ?? "",
          surname: currentUser.last_name ?? "",
        },
        email: currentUser.email,
      };

      let candidate: Candidate;

      try {
        candidate = await apiFetch<Candidate>("/candidates/", {
          method: "POST",
          json: candidatePayload,
        });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409) {
          throw error;
        }

        const existingCandidates = await apiFetch<{ items: Candidate[] }>(
          "/candidates/",
          { method: "GET" },
        );

        candidate =
          existingCandidates.items.find((item) => item.email === currentUser.email) ??
          existingCandidates.items[0];

        if (!candidate) {
          throw error;
        }
      }

      await apiFetch<Candidate>(`/candidates/${candidate.id}/assign`, {
        method: "POST",
        json: { vacancy_id: vacancy.id },
      });

      setAppliedIds((prev) =>
        prev.includes(vacancy.id) ? prev : [...prev, vacancy.id],
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Не удалось отправить отклик",
      );
    } finally {
      setApplyingId(null);
    }
  };

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
              Карьера
            </p>
            <h1 className="text-2xl font-semibold">Открытые вакансии</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Выберите подходящую роль и отправьте отклик — мы рассмотрим его в
              ближайшее время.
            </p>
          </div>

          <MainButton
            onClick={handleSignOut}
            title="Выйти"
            className="w-full sm:w-auto"
          />
        </header>

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {submitError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <div className="grid gap-4">
          {vacancies.map((vacancy) => {
            const isApplied = appliedIds.includes(vacancy.id);
            const isApplying = applyingId === vacancy.id;

            return (
              <article
                key={vacancy.id}
                className="rounded-2xl border border-border bg-background-elevated p-5 shadow-sm transition-all hover:border-brand-primary/30 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{vacancy.title}</h2>
                      <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">
                        {vacancy.employmentType ?? "Полная занятость"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {vacancy.department} • {vacancy.location ?? "Удаленно"}
                    </p>
                    <p className="max-w-2xl text-sm text-muted-foreground/90">
                      {vacancy.description}
                    </p>
                  </div>

                  <MainButton
                    onClick={() => handleApply(vacancy)}
                    title={isApplied ? "Отклик отправлен" : isApplying ? "Отправляем..." : "Откликнуться"}
                    disabled={isApplying || isApplied}
                    className="w-full md:w-auto"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
