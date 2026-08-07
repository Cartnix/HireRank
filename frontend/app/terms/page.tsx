import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <p className="mb-6 text-sm text-foreground-secondary">
        <Link href="/" className="underline underline-offset-4">
          ← HireRank
        </Link>
      </p>

      <h1 className="text-3xl font-semibold tracking-tight">
        Условия использования
      </h1>
      <p className="mt-2 text-sm text-foreground-secondary">
        Версия {process.env.NEXT_PUBLIC_LEGAL_POLICY_VERSION ?? "2026-08-06"} ·
        HireRank ATS
      </p>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">1. Сервис</h2>
        <p>
          HireRank — ATS (учёт кандидатов и найма). Доступ — авторизованным
          пользователям организации-заказчика в рамках RBAC и tenant-изоляции.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">2. Аккаунт</h2>
        <p>
          Достоверные данные для входа, запрет передачи учётных данных третьим
          лицам. Вход: email/пароль или OAuth (Google, LinkedIn) с минимизацией
          scope. ИИН не используется для входа.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">3. Персональные данные</h2>
        <p>
          Обработка регулируется{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 text-foreground"
          >
            Политикой сбора и обработки персональных данных
          </Link>
          . Нажатие «Войти» или OAuth на экране входа означает согласие с этими
          Условиями и Политикой. Регистрация требует раздельного явного согласия
          без предзаполнения (закон РК о ПД §1.4).
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">4. Допустимое использование</h2>
        <p>
          Запрещены обход доступа, брутфорс, выгрузка ПД вне служебной
          необходимости. Оператор ограничивает доступ при нарушениях и ведёт
          audit trail входов (IP, User-Agent, время).
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">5. Изменения</h2>
        <p>
          Существенные изменения Условий или Политики требуют повторного явного
          принятия («Принять и продолжить») перед продолжением работы.
        </p>
      </section>

      <p className="mt-12 text-sm text-foreground-secondary">
        <Link href="/privacy" className="underline underline-offset-2">
          Политика сбора и обработки персональных данных
        </Link>
      </p>
    </main>
  );
}
