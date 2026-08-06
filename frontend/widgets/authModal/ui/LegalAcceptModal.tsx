"use client";

import { useState } from "react";
import Link from "next/link";
import {
  REQUIRED_CONSENT_MSG,
  hasRequiredConsent,
  toConsentPayload,
} from "@/features/auth/model/FormSchema";
import { acceptLegal } from "@/shared/api/auth";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { MainButton } from "@/shared/ui/buttons/MainButton";

/**
 * Force-major update gate: blocks product until user accepts current
 * Политика сбора и обработки ПД / Условия (and refreshes expired consent).
 */
export function LegalAcceptModal() {
  const { user, refreshSession } = useAuthSession();
  const [accountConsent, setAccountConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!user) return null;
  const needsGate =
    user.legal_acceptance_required === true ||
    user.consent_refresh_required === true;
  if (!needsGate) return null;

  const onAccept = async () => {
    setError(null);
    if (user.consent_refresh_required && !hasRequiredConsent({
      consent_account_processing: accountConsent,
      consent_talent_pool: false,
      consent_cross_border: false,
    })) {
      setError(REQUIRED_CONSENT_MSG);
      return;
    }
    setPending(true);
    try {
      await acceptLegal(
        user.consent_refresh_required
          ? toConsentPayload({
              consent_account_processing: true,
              consent_talent_pool: false,
              consent_cross_border: false,
            })
          : undefined,
      );
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось принять");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-accept-title"
        className="w-full max-w-md rounded-3xl border border-border-subtle bg-background-elevated p-8 shadow-2xl flex flex-col gap-5"
      >
        <h2 id="legal-accept-title" className="text-xl font-semibold text-foreground">
          Мы обновили условия обработки данных
        </h2>
        <p className="text-sm text-foreground-secondary leading-relaxed">
          Ознакомьтесь с новой редакцией{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Условий использования
          </Link>{" "}
          и{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Политики сбора и обработки персональных данных
          </Link>{" "}
          (версия {user.current_legal_policy_version}). Чтобы продолжить, примите
          их.
        </p>

        {user.consent_refresh_required && (
          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={accountConsent}
              onChange={(e) => setAccountConsent(e.target.checked)}
            />
            <span>
              Я даю согласие на сбор и обработку моих персональных данных в
              соответствии с Политикой (срок согласия обновляется).
            </span>
          </label>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <MainButton
          type="button"
          disabled={pending}
          title={pending ? "Сохранение..." : "Принять и продолжить"}
          onClick={() => void onAccept()}
          className="py-3.5 rounded-2xl font-semibold"
        />
      </div>
    </div>
  );
}
