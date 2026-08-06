"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { InputField } from "@/shared/FieldInput";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import {
  LoginFormValues,
  REQUIRED_CONSENT_MSG,
  RegisterFormValues,
  RegisterFormValuesType,
  hasRequiredConsent,
  implicitLoginConsentPayload,
  toConsentPayload,
} from "@/features/auth/model/FormSchema";
import { useAuthForm } from "@/features/auth/useAuthForm";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { startOAuth } from "@/shared/api/auth";

const consentDefaults = {
  role: "candidate" as const,
  consent_account_processing: false as const,
  consent_talent_pool: false,
  consent_cross_border: false,
};

function LegalLinks() {
  return (
    <>
      <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
        Условиями использования
      </Link>
      {" и "}
      <Link
        href="/privacy"
        className="underline underline-offset-2 hover:text-foreground"
      >
        Политикой конфиденциальности
      </Link>
    </>
  );
}

export const AuthModal = () => {
  const [view, setView] = useState<"login" | "register">("login");
  const isRegister = view === "register";
  const router = useRouter();
  const { refreshSession } = useAuthSession();
  const [oauthError, setOauthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValuesType>({
    resolver: zodResolver(isRegister ? RegisterFormValues : LoginFormValues),
    mode: "onChange",
    defaultValues: consentDefaults,
  });

  const consentAccount = useWatch({
    control,
    name: "consent_account_processing",
    defaultValue: false,
  });
  const consentReady = !isRegister || consentAccount === true;

  const { onSubmit, isLoading } = useAuthForm({
    view,
    setError,
    onSuccess: async () => {
      await refreshSession();
      router.push("/");
    },
  });

  const isPending = isSubmitting || isLoading;
  const blockSubmit = isPending || (isRegister && !consentReady);

  const toggleView = () => {
    setView(isRegister ? "login" : "register");
    setOauthError(null);
    reset({ ...consentDefaults });
  };

  const onOAuth = async (provider: "google" | "linkedin") => {
    setOauthError(null);

    if (isRegister) {
      const values = getValues();
      const flags = {
        consent_account_processing: Boolean(values.consent_account_processing),
        consent_talent_pool: Boolean(values.consent_talent_pool),
        consent_cross_border: Boolean(values.consent_cross_border),
      };
      if (!hasRequiredConsent(flags)) {
        setError("consent_account_processing", {
          message: REQUIRED_CONSENT_MSG,
        });
        return;
      }
      try {
        await startOAuth(provider, toConsentPayload(flags));
      } catch (err) {
        setOauthError(err instanceof Error ? err.message : "OAuth failed");
      }
      return;
    }

    // Returning login via OAuth: implicit consent (CTA = acceptance).
    try {
      await startOAuth(provider, implicitLoginConsentPayload());
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : "OAuth failed");
    }
  };

  const guardedSubmit = handleSubmit((data) => {
    if (isRegister) {
      if (
        !hasRequiredConsent({
          consent_account_processing: Boolean(data.consent_account_processing),
          consent_talent_pool: Boolean(data.consent_talent_pool),
          consent_cross_border: Boolean(data.consent_cross_border),
        })
      ) {
        setError("consent_account_processing", {
          message: REQUIRED_CONSENT_MSG,
        });
        return;
      }
    }
    return onSubmit(data);
  });

  return (
    <form
      onSubmit={(e) => {
        if (isRegister && !consentReady) {
          e.preventDefault();
          setError("consent_account_processing", {
            message: REQUIRED_CONSENT_MSG,
          });
          return;
        }
        void guardedSubmit(e);
      }}
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
            ? "Создайте аккаунт — согласия разделены и выключены по умолчанию (закон РК о ПД §1.4)"
            : "Войдите через Google, LinkedIn или email"}
        </p>
      </div>

      {isRegister && (
        <fieldset className="flex flex-col gap-3 rounded-2xl border border-border-subtle p-4">
          <legend className="px-1 text-sm text-foreground-secondary">
            Согласия при регистрации (раздельные, без предзаполнения)
          </legend>
          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              {...register("consent_account_processing")}
            />
            <span>
              Обработка моих ПД для создания и работы аккаунта HireRank
              (обязательно). Документы: <LegalLinks />.
            </span>
          </label>
          {errors.consent_account_processing?.message && (
            <p className="text-sm text-danger">
              {errors.consent_account_processing.message}
            </p>
          )}
          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              {...register("consent_talent_pool")}
            />
            <span>Talent pool / кадровый резерв (опционально)</span>
          </label>
          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              {...register("consent_cross_border")}
            />
            <span>Трансграничная передача ПД (опционально)</span>
          </label>
        </fieldset>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={blockSubmit}
          onClick={() => void onOAuth("google")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border-subtle py-3 text-sm font-medium text-foreground hover:bg-background transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {isRegister ? "Зарегистрироваться через Google" : "Войти через Google"}
        </button>
        <button
          type="button"
          disabled={blockSubmit}
          onClick={() => void onOAuth("linkedin")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border-subtle py-3 text-sm font-medium text-foreground hover:bg-background transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {isRegister
            ? "Зарегистрироваться через LinkedIn"
            : "Войти через LinkedIn"}
        </button>
        {oauthError && (
          <p className="text-sm text-danger text-center">{oauthError}</p>
        )}
        {!isRegister && (
          <p className="text-xs text-foreground-secondary text-center leading-relaxed">
            Нажимая кнопку входа через Google или LinkedIn, вы соглашаетесь с{" "}
            <LegalLinks />. Запрашиваются только идентификатор и email провайдера.
            При первом входе через соцсеть создаётся аккаунт HireRank.
          </p>
        )}
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
        disabled={blockSubmit}
        title={
          isPending
            ? "Обработка..."
            : isRegister && !consentReady
              ? "Отметьте обязательное согласие"
              : isRegister
                ? "Создать аккаунт"
                : "Войти"
        }
        className="mt-4 py-3.5 rounded-2xl font-semibold text-base"
      />

      {!isRegister && (
        <p className="text-xs text-foreground-secondary text-center leading-relaxed -mt-2">
          Нажимая «Войти», вы соглашаетесь с <LegalLinks />. Обрабатываются
          email, технические данные сессии (IP, cookie) и факт входа для
          защиты аккаунта.
        </p>
      )}

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
