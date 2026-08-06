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
        Версия от 6 августа 2026 · HireRank ATS
      </p>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">1. Сервис</h2>
        <p>
          HireRank — система учёта кандидатов и найма (ATS). Доступ предоставляется
          авторизованным пользователям организации-заказчика в рамках выданных
          ролей (RBAC) и tenant-изоляции.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">2. Аккаунт</h2>
        <p>
          Вы обязуетесь указывать достоверные данные для входа, не передавать
          учётные данные третьим лицам и незамедлительно сообщать о компрометации
          сессии. Вход возможен по email/паролю или через OAuth (Google,
          LinkedIn) в пределах настроенных провайдеров.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">3. Персональные данные</h2>
        <p>
          Обработка ПД регулируется{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 text-foreground"
          >
            Политикой конфиденциальности
          </Link>
          . Нажатие «Войти» или кнопки OAuth на экране входа означает согласие с
          этими Условиями и Политикой. Регистрация требует раздельных согласий
          без предзаполнения (закон РК о ПД §1.4).
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">4. Допустимое использование</h2>
        <p>
          Запрещены попытки обхода контроля доступа, брутфорс, выгрузка ПД вне
          служебной необходимости и использование сервиса в нарушение применимого
          права. Оператор может ограничить доступ при нарушении.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">5. Изменения</h2>
        <p>
          Существенные изменения Условий или Политики могут потребовать повторного
          явного принятия перед продолжением работы в аккаунте. Актуальная версия
          всегда доступна по этому адресу.
        </p>
      </section>

      <p className="mt-12 text-sm text-foreground-secondary">
        <Link href="/privacy" className="underline underline-offset-2">
          Политика конфиденциальности
        </Link>
      </p>
    </main>
  );
}
