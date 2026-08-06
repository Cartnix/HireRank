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
        Политика конфиденциальности
      </h1>
      <p className="mt-2 text-sm text-foreground-secondary">
        Версия от 6 августа 2026 · действует для HireRank ATS
      </p>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">1. Кто обрабатывает данные</h2>
        <p>
          Контролёр персональных данных — оператор инстанса HireRank (on-prem /
          in-perimeter у заказчика). ПД граждан РК хранятся в периметре
          развёртывания в соответствии с Законом РК «О персональных данных и их
          защите». Для субъектов ЕС применяется также GDPR (ст. 6–7, 13, 17).
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">
          2. Когда мы обрабатываем данные
        </h2>
        <p>
          Обработка начинается не только при регистрации. Email/пароль или OAuth
          при входе, создание сессии, технические cookie и IP — это отдельные
          операции обработки. На форме входа согласие оформляется через явную
          привязку к действию («Нажимая „Войти“, вы соглашаетесь…») со ссылками
          на эту Политику и{" "}
          <Link href="/terms" className="underline underline-offset-2 text-foreground">
            Условия использования
          </Link>
          .
        </p>
        <p>
          При <strong className="text-foreground">регистрации</strong> согласия
          разделены и выключены по умолчанию (закон РК о ПД §1.4) — bundling
          «одним кликом на всё» не используется.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">3. Какие данные и зачем</h2>
        <ul className="list-disc space-y-3 pl-6">
          <li>
            <strong className="text-foreground">Учётная запись</strong> — email,
            хеш пароля (если есть), имя при указании, роль, tenant: создание и
            работа аккаунта, аутентификация.
          </li>
          <li>
            <strong className="text-foreground">Сессия и безопасность</strong> —
            HttpOnly cookie сессии, CSRF-токен, IP и метаданные входа: защита от
            несанкционированного доступа, аудит.
          </li>
          <li>
            <strong className="text-foreground">OAuth (Google / LinkedIn)</strong>{" "}
            — идентификатор провайдера и email. Не запрашиваем списки контактов,
            дату рождения и иные избыточные scope сверх identity.
          </li>
          <li>
            <strong className="text-foreground">Talent pool</strong> — только при
            отдельном согласии на регистрации / в настройках согласий.
          </li>
          <li>
            <strong className="text-foreground">Трансграничная передача</strong> —
            только при отдельном согласии с указанием стран.
          </li>
        </ul>
        <p>
          ИИН, сканы документов и иные чувствительные идентификаторы не
          собираются на этапе регистрации и входа.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">4. Cookie и трекеры</h2>
        <p>
          На экране входа используются только технические cookie, необходимые
          для сессии и CSRF. Маркетинговые пиксели (Meta, TikTok и аналоги) на
          форме авторизации до входа не размещаются.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">5. Раздельные согласия</h2>
        <ul className="list-disc space-y-3 pl-6">
          <li>
            <strong className="text-foreground">Account processing</strong> —
            обязательно для аккаунта HireRank.
          </li>
          <li>
            <strong className="text-foreground">Talent pool</strong> — опционально.
          </li>
          <li>
            <strong className="text-foreground">Cross-border</strong> — опционально;
            при включении указываются страны.
          </li>
        </ul>
        <p>
          Текущие согласия: <code className="text-sm">GET /api/v1/auth/consent</code>
          ; изменение: <code className="text-sm">PATCH /api/v1/auth/consent</code>.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">
          6. Обновление политики
        </h2>
        <p>
          При существенном изменении условий вход может быть заблокирован до
          ознакомления с новой версией и явного принятия («Принимаю»). Дата
          версии указана в начале документа.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-foreground-secondary leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">7. Ваши права</h2>
        <p>
          Вы можете отозвать согласия и запросить удаление / анонимизацию
          идентификатора авторизации:{" "}
          <code className="text-sm">POST /api/v1/auth/forget-me</code> (GDPR
          ст. 17 / закон РК о ПД §3.3). Управление жизненным циклом профиля
          кандидата — в домене кандидатов.
        </p>
      </section>

      <p className="mt-12 text-sm text-foreground-secondary">
        Также см.{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Условия использования
        </Link>
        . Внутренние SoT:{" "}
        <code>docs/laws/ATS_COMPLIANCE_RK.md</code>,{" "}
        <code>docs/laws/GDPR.md</code>, <code>docs/RBAC.md</code>.
      </p>
    </main>
  );
}
