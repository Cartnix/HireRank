import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <p className="mb-6 text-sm text-foreground-secondary">
        <Link href="/" className="underline underline-offset-4">
          ← HireRank
        </Link>
      </p>

      <h1 className="text-3xl font-semibold tracking-tight">
        Политика сбора и обработки персональных данных
      </h1>
      <p className="mt-2 text-sm text-foreground-secondary">
        Версия {process.env.NEXT_PUBLIC_LEGAL_POLICY_VERSION ?? "2026-08-06"} ·
        HireRank ATS · закон РК «О персональных данных и их защите»
      </p>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">1. Оператор и локализация</h2>
        <p>
          Оператор персональных данных — контролёр инстанса HireRank (on-prem /
          in-perimeter у заказчика). Сбор, накопление и хранение ПД граждан РК,
          включая фиксацию сессий, IP и логов входа, выполняются на серверах /
          в ЦОД на территории Республики Казахстан (локализация БД). Зарубежные
          облака допускаются только для репликации после первичной записи в РК и
          при наличии отдельного согласия на трансграничную передачу.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">
          2. Когда начинается обработка
        </h2>
        <p>
          Обработка ПД происходит не только при регистрации. Ввод email/пароля
          или OAuth при входе, создание сессии, технические cookie и IP — отдельные
          операции. На форме входа согласие оформляется неявной привязкой к
          действию: «Нажимая „Войти“, вы подтверждаете согласие с{" "}
          <Link href="/terms" className="underline underline-offset-2 text-foreground">
            Условиями использования
          </Link>{" "}
          и актуальной Политикой сбора и обработки персональных данных».
        </p>
        <p>
          При <strong className="text-foreground">регистрации</strong> согласия
          разделены и выключены по умолчанию (закон РК о ПД §1.4). Срок действия
          согласия ограничен целями обработки и не является бессрочным; по
          истечении TTL требуется обновление.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">3. Какие данные и зачем</h2>
        <ul className="list-disc space-y-3 pl-6">
          <li>
            <strong className="text-foreground">Учётная запись</strong> — email,
            хеш пароля (если есть), имя при указании, роль, tenant.
          </li>
          <li>
            <strong className="text-foreground">Сессия и безопасность</strong> —
            HttpOnly cookie, CSRF-токен, IP, User-Agent и время входа в локальном
            audit log (для расследования инцидентов и уведомления регулятора).
          </li>
          <li>
            <strong className="text-foreground">OAuth (Google / LinkedIn)</strong>{" "}
            — только <code className="text-sm">openid</code> и{" "}
            <code className="text-sm">email</code>. ИИН не используется как логин.
          </li>
          <li>
            <strong className="text-foreground">Talent pool / трансграница</strong> —
            только при отдельном согласии (для трансграницы — с указанием стран).
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">4. Cookie и трекеры</h2>
        <p>
          На страницах входа и регистрации допускаются только технические cookie
          (Session ID, CSRF). Маркетинговые и аналитические пиксели (Meta, TikTok,
          Google Analytics и аналоги) до авторизации не размещаются.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">5. Обновление политики</h2>
        <p>
          При существенном изменении условий следующий вход блокирует работу в
          продукте до ознакомления с новой редакцией и нажатия «Принять и
          продолжить».
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">6. Ваши права и инциденты</h2>
        <p>
          Отзыв согласий и удаление / анонимизация идентификатора авторизации:{" "}
          <code className="text-sm">POST /api/v1/auth/forget-me</code>. При
          компрометации сессий оператор уведомляет уполномоченный орган РК в
          установленный законом срок (ориентир — один рабочий день).
        </p>
      </section>

      <p className="mt-12 text-sm text-foreground-secondary">
        Также см.{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Условия использования
        </Link>
        . SoT: <code>docs/laws/ATS_COMPLIANCE_RK.md</code>,{" "}
        <code>docs/laws/GDPR.md</code>.
      </p>
    </main>
  );
}
