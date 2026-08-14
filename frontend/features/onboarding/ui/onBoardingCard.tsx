"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingFormSchema, OnboardingFormValues } from "../model/schema";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import { OnboardingComplete } from "../onboardingComplete";
import { useRouter } from "next/navigation";
import { OnBoardingInputs } from "./onBoardingFields";

export function OnboardingCard() {
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const methods = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsPending(true);
    setSubmitError(null);

    try {
      const result = await OnboardingComplete(data);

      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      router.push("/dashboard");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="relative w-full max-w-lg rounded-3xl p-8 md:p-10 flex flex-col gap-6 bg-background-elevated border border-border-subtle/50 shadow-2xl transition-all duration-300"
      >
        <div className="mb-2 text-center">
          <h2 className="text-foreground text-xl font-bold">
            Расскажите о себе
          </h2>
          <p className="text-foreground-secondary mt-2">
            Это поможет нам персонализировать ваш опыт
          </p>
        </div>

        <OnBoardingInputs />

        {submitError && (
          <p className="text-sm text-red-500 text-center">{submitError}</p>
        )}

        <div className="flex gap-3 mt-4">
          <MainButton
            type="submit"
            disabled={isPending}
            title={isPending ? "Обработка..." : "Завершить"}
            className="py-3.5 rounded-2xl font-semibold text-base flex-1"
          />
        </div>
      </form>
    </FormProvider>
  );
}
