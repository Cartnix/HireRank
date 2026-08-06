"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "@/shared/FieldInput";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import {
  LoginFormValues,
  RegisterFormValues,
  RegisterFormValuesType,
} from "@/features/auth/model/FormSchema";
import { useAuthForm } from "@/features/auth/useAuthForm";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { oauthStartUrl } from "@/shared/api/auth";

export const AuthModal = () => {
  const [view, setView] = useState<"login" | "register">("login");
  const isRegister = view === "register";
  const router = useRouter();
  const { refreshSession } = useAuthSession();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValuesType>({
    resolver: zodResolver(isRegister ? RegisterFormValues : LoginFormValues),
    mode: "onChange",
    defaultValues: {
      role: "candidate",
    },
  });

  const { onSubmit, isLoading } = useAuthForm({
    view,
    setError,
    onSuccess: async () => {
      await refreshSession();
      router.push("/");
    },
  });

  const isPending = isSubmitting || isLoading;

  const toggleView = () => {
    setView(isRegister ? "login" : "register");
    reset({ role: "candidate" });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-lg rounded-3xl p-8 md:p-10 flex flex-col gap-6
                       bg-background-elevated border border-border-subtle/50 shadow-2xl transition-all duration-300"
    >
      <div className="mb-2 text-center">
        <h2 className="text-foreground">
          {isRegister ? "Регистрация" : "Вход в систему"}
        </h2>
        <p className="text-foreground-secondary mt-2">
          {isRegister
            ? "Создайте аккаунт HireRank за пару секунд"
            : "Добро пожаловать — войдите через Google, LinkedIn или email"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={oauthStartUrl("google")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border-subtle py-3 text-sm font-medium text-foreground hover:bg-background transition-colors"
        >
          Войти через Google
        </a>
        <a
          href={oauthStartUrl("linkedin")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border-subtle py-3 text-sm font-medium text-foreground hover:bg-background transition-colors"
        >
          Войти через LinkedIn
        </a>
        <div className="flex items-center gap-3 text-xs text-foreground-secondary uppercase tracking-wide">
          <span className="h-px flex-1 bg-border-subtle" />
          или
          <span className="h-px flex-1 bg-border-subtle" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <InputField
          {...register("email")}
          type="email"
          placeholder="name@company.kz"
          label="Email"
          error={errors.email?.message}
        />
        <InputField
          {...register("password")}
          type="password"
          placeholder="••••••••"
          label="Password"
          error={errors.password?.message}
        />
        {isRegister && (
          <>
            <InputField
              {...register("repeatPassword")}
              type="password"
              placeholder="••••••••"
              label="Repeat password"
              error={errors.repeatPassword?.message}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-foreground-secondary">Роль</label>
              <select
                {...register("role")}
                className="rounded-2xl border border-border bg-background-elevated px-4 py-3 text-foreground"
              >
                <option value="candidate">Кандидат</option>
                <option value="hr">HR</option>
                <option value="manager">Менеджер</option>
                <option value="recruiter">Рекрутер</option>
              </select>
              {errors.role?.message && (
                <p className="text-sm text-danger">{errors.role.message}</p>
              )}
            </div>
          </>
        )}
      </div>

      <MainButton
        type="submit"
        disabled={isPending}
        title={
          isPending
            ? "Обработка..."
            : isRegister
              ? "Создать аккаунт"
              : "Войти"
        }
        className="mt-4 py-3.5 rounded-2xl font-semibold text-base"
      />

      <button
        type="button"
        onClick={toggleView}
        className="text-center text-sm text-foreground-secondary hover:text-brand-primary transition-colors mt-1 underline underline-offset-4"
      >
        {isRegister
          ? "Уже есть аккаунт? Войти"
          : "Нет аккаунта? Зарегистрироваться"}
      </button>
    </form>
  );
};
