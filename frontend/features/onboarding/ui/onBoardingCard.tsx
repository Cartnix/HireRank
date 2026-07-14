"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingFormSchema, OnboardingFormValues } from "../model/schema";
import { InputField } from "@/shared/FieldInput";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import { OnboardingComplete } from "../onboardingComplete";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    key: "personal",
    title: "Расскажите о себе",
    subtitle: "Это поможет нам персонализировать ваш опыт",
  },
  {
    key: "company",
    title: "О вашей компании",
    subtitle: "Последний шаг перед началом работы",
  },
] as const;

export function OnboardingCard() {
  const [step, setStep] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    mode: "onBlur",
  });

  const isLastStep = step === STEPS.length - 1;

  const handleNext = async () => {
    const fieldsToValidate =
      step === 0
        ? (["firstName", "lastName"] as const)
        : (["companyName", "role"] as const);

    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => s + 1);
  };

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
    <form
      onSubmit={isLastStep ? handleSubmit(onSubmit) : (e) => e.preventDefault()}
      className="relative w-full max-w-lg rounded-3xl p-8 md:p-10 flex flex-col gap-6
                       bg-background-elevated border border-border-subtle/50 shadow-2xl transition-all duration-300"
    >
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= step ? "bg-brand-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="mb-2 text-center">
        <h2 className="text-foreground">{STEPS[step].title}</h2>
        <p className="text-foreground-secondary mt-2">{STEPS[step].subtitle}</p>
      </div>

      <div className="flex flex-col gap-4">
        {step === 0 && (
          <>
            <InputField
              {...register("firstName")}
              placeholder="Иван"
              label="Имя"
              error={errors.firstName?.message}
            />
            <InputField
              {...register("lastName")}
              placeholder="Иванов"
              label="Фамилия"
              error={errors.lastName?.message}
            />
          </>
        )}

        {step === 1 && (
          <>
            <InputField
              {...register("companyName")}
              placeholder="Acme Inc."
              label="Название компании"
              error={errors.companyName?.message}
            />
            <InputField
              {...register("role")}
              placeholder="CEO, HR-менеджер и т.д."
              label="Ваша должность"
              error={errors.role?.message}
            />
          </>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-red-500 text-center">{submitError}</p>
      )}

      <div className="flex gap-3 mt-4">
        {step > 0 && (
          <MainButton
            type="button"
            onClick={() => setStep((s) => s - 1)}
            title="Назад"
            className="py-3.5 rounded-2xl font-semibold text-base bg-muted text-foreground hover:bg-border-subtle"
          />
        )}

        <MainButton
          type={isLastStep ? "submit" : "button"}
          onClick={isLastStep ? undefined : handleNext}
          disabled={isPending}
          title={
            isPending ? "Обработка..." : isLastStep ? "Завершить" : "Продолжить"
          }
          className="py-3.5 rounded-2xl font-semibold text-base flex-1"
        />
      </div>
    </form>
  );
}
