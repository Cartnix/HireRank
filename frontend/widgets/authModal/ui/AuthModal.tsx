"use client";

import { MainButton } from "@/shared/ui/buttons/MainButton";
import { REQUIRED_CONSENT_MSG } from "@/features/auth/model/FormSchema";
import { ConsentFieldset } from "./ConsentFieldset";
import { OAuthButtons } from "./OAuthButtons";
import { EmailPasswordForm } from "./EmailPasswordForm";
import { LegalLinks } from "./LegalLinks";
import { useAuthModalState } from "../hooks/useAuthModalState";

export const AuthModal = () => {
  const {
    isRegister,
    register,
    handleSubmit,
    setError,
    errors,
    blockSubmit,
    isPending,
    oauthError,
    emailHint,
    onEmailBlur,
    onOAuth,
    switchTo,
    consentAccount,
    crossBorder,
    getValues,
    consentReady,
  } = useAuthModalState();

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isRegister && !consentReady) {
      e.preventDefault();
      setError("consent_account_processing", {
        message: REQUIRED_CONSENT_MSG,
      });
      return;
    }
    void handleSubmit(e);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
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
            ? "Согласия разделены и выключены по умолчанию (закон РК о ПД §1.4)"
            : "Войдите через Google, LinkedIn или email"}
        </p>
      </div>

      {isRegister && (
        <ConsentFieldset
          control={undefined as any}
          register={register}
          errors={errors}
          crossBorder={crossBorder}
        />
      )}

      <OAuthButtons
        isRegister={isRegister}
        isDisabled={blockSubmit}
        oauthError={oauthError}
        onOAuth={onOAuth}
      />

      <EmailPasswordForm
        isRegister={isRegister}
        register={register}
        errors={errors}
        emailHint={emailHint}
        onEmailBlur={onEmailBlur}
      />

      <MainButton
        type="submit"
        disabled={blockSubmit}
        title={
          isPending
            ? "Обработка..."
            : isRegister && !consentReady
              ? "Отметьте обязательное согласие"
              : isRegister
                ? "Зарегистрироваться"
                : "Войти"
        }
        className="mt-4 py-3.5 rounded-2xl font-semibold text-base"
      />

      {!isRegister && (
        <p className="text-xs text-foreground-secondary text-center leading-relaxed -mt-2">
          Нажимая кнопку «Войти», вы подтверждаете согласие с <LegalLinks />.
          Обрабатываются email, технические данные сессии (IP, cookie) и факт
          входа.
        </p>
      )}

      <button
        type="button"
        onClick={() => switchTo(isRegister ? "login" : "register")}
        className="text-center text-sm text-foreground-secondary hover:text-brand-primary transition-colors mt-1 underline underline-offset-4"
      >
        {isRegister
          ? "Уже есть аккаунт? Войти"
          : "Нет аккаунта? Зарегистрироваться"}
      </button>
    </form>
  );
};
