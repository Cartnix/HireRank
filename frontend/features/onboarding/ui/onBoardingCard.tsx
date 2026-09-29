"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingFormSchema, OnboardingFormValues } from "../model/schema";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import { LoaderCircle, UserRound } from "lucide-react";
import { useCurrentUser } from "@/shared/api/auth-store";
import { useRouter } from "next/navigation";
import { OnBoardingInputs } from "./onBoardingFields";
import { useOnboarding } from "../useOnboarding";

export function OnboardingCard() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { onBoardingSubmit, isLoading } = useOnboarding();

  const methods = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: OnboardingFormValues) => {
    setSubmitError(null);

    const result = await onBoardingSubmit({
      first_name: data.firstName,
      last_name: data.lastName,
    });

    if (result.error) {
      setSubmitError(result.error.message);
      return;
    }

    const destination = currentUser?.role === "candidate" ? "/careers" : "/dashboard";
    router.push(destination);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="relative flex w-full flex-col gap-6 rounded-3xl border border-border-subtle/70 bg-background-elevated/95 p-6 shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-9"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <UserRound size={21} strokeWidth={1.8} />
          </div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-primary">
            Настройка профиля
          </p>
          <h2 className="m-0! text-xl font-bold tracking-normal text-foreground sm:text-2xl">
            Расскажите о себе
          </h2>
          <p className="mx-auto mb-0 mt-2 max-w-sm text-sm leading-6 text-foreground-secondary">
            Это поможет нам персонализировать ваш опыт
          </p>
        </div>

        <OnBoardingInputs />

        {submitError && (
          <p
            role="alert"
            className="mb-0 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive"
          >
            {submitError}
          </p>
        )}

        <MainButton
          type="submit"
          disabled={isLoading}
          title={isLoading ? "Сохраняем профиль..." : "Продолжить"}
          className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"
        >
          {isLoading && <LoaderCircle size={16} className="animate-spin" />}
        </MainButton>
      </form>
    </FormProvider>
  );
}
