import { LegalLinks } from "./LegalLinks";

interface OAuthButtonsProps {
  isRegister: boolean;
  isDisabled: boolean;
  oauthError: string | null;
  onOAuth: (provider: "google" | "linkedin") => Promise<void>;
}

export function OAuthButtons({
  isRegister,
  isDisabled,
  oauthError,
  onOAuth,
}: OAuthButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => void onOAuth("google")}
        className="flex items-center justify-center gap-2 rounded-2xl border border-border-subtle py-3 text-sm font-medium text-foreground hover:bg-background transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        {isRegister ? "Зарегистрироваться через Google" : "Войти через Google"}
      </button>
      <button
        type="button"
        disabled={isDisabled}
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
          Нажимая кнопку входа через Google или LinkedIn, вы подтверждаете
          согласие с <LegalLinks />. Запрашиваются только openid и email.
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-foreground-secondary uppercase tracking-wide">
        <span className="h-px flex-1 bg-border-subtle" />
        или
        <span className="h-px flex-1 bg-border-subtle" />
      </div>
    </div>
  );
}
