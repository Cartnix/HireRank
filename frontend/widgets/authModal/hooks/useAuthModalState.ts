"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { checkEmail, startOAuth } from "@/shared/api/auth";
import { CONSENT_DEFAULTS } from "../model/constants";

export function useAuthModalState() {
  const [view, setView] = useState<"login" | "register">("login");
  const isRegister = view === "register";
  const router = useRouter();
  const { refreshSession } = useAuthSession();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValuesType>({
    resolver: zodResolver(isRegister ? RegisterFormValues : LoginFormValues),
    mode: "onChange",
    defaultValues: CONSENT_DEFAULTS,
  });

  const consentAccount = useWatch({
    control,
    name: "consent_account_processing",
    defaultValue: false,
  });

  const crossBorder = useWatch({
    control,
    name: "consent_cross_border",
    defaultValue: false,
  });

  const consentReady = !isRegister || consentAccount === true;

  const { onSubmit, isLoading } = useAuthForm({
    view,
    setError,
    onSuccess: async () => {
      await refreshSession();
      router.push(isRegister ? "/onboarding" : "/dashboard");
    },
  });

  const isPending = isSubmitting || isLoading;
  const blockSubmit = isPending || (isRegister && !consentReady);

  const switchTo = (next: "login" | "register", preserveEmail = true) => {
    const email = preserveEmail ? getValues("email") : "";
    setView(next);
    setOauthError(null);
    setEmailHint(null);
    reset({ ...CONSENT_DEFAULTS, email: email || undefined });
  };

  const onEmailBlur = async () => {
    if (isRegister) return;
    const email = getValues("email")?.trim();
    if (!email || !email.includes("@")) return;
    try {
      const status = await checkEmail(email);
      if (!status.registered) {
        setEmailHint(
          "Аккаунт с этим email не найден — откроем регистрацию с согласием на обработку ПД.",
        );
        setValue("email", email);
        switchTo("register", true);
      } else {
        setEmailHint(null);
      }
    } catch {
      
    }
  };

  const onOAuth = async (provider: "google" | "linkedin") => {
    setOauthError(null);

    if (isRegister) {
      const values = getValues();
      const flags = {
        consent_account_processing: Boolean(values.consent_account_processing),
        consent_talent_pool: Boolean(values.consent_talent_pool),
        consent_cross_border: Boolean(values.consent_cross_border),
        consent_cross_border_countries: values.consent_cross_border_countries,
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
          consent_cross_border_countries: data.consent_cross_border_countries,
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

  return {
    view,
    isRegister,
    register,
    handleSubmit: guardedSubmit,
    setError,
    errors,
    isSubmitting,
    isPending,
    blockSubmit,
    oauthError,
    setOauthError,
    emailHint,
    setEmailHint,
    onEmailBlur,
    onOAuth,
    switchTo,
    consentAccount,
    crossBorder,
    getValues,
    consentReady,
  };
}
