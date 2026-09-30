> Обновление dev mode: клиентские наборы и localStorage удалены, данные загружаются из отдельной БД только superuser. Текущий порядок — [DEV_DATABASE.md](DEV_DATABASE.md). Описания прежних mock/localStorage ниже относятся к исходному аудиту.

# Аудит интеграции frontend ↔ backend MVP

Дата: 2026-09-30. Ветка: `audit/mvp-frontend-backend`.

Этот этап — только аудит исходников. Подключения API, интерфейс, дизайн и бизнес-логика не изменены. Выводы о наличии реализации не означают успешного прохождения runtime/E2E: серверы и БД в рамках аудита не запускались.

## Рамки и источники требований

Проверены `ROADMAP.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `RBAC.md`, UC-01–07, маршруты FastAPI, ATS-сервисы, схемы запросов/ответов и точки получения данных на фронте. Отдельного документа с названием ТЗ в отслеживаемых файлах не обнаружено; требования взяты из перечисленных документов.

Рабочая граница — Phase 1 roadmap: ATS, intake, пул, вакансии, назначение, ручные статусы, RBAC/tenant isolation. LLM, MCP, memory и внешние каналы — последующие этапы. Существующие блоки сохраняются; после интеграции у неподдержанных блоков появляется небольшой тег «Демо · ожидает backend».

Есть расхождения документов: `PRODUCT.md` описывает автоматический AI-анализ как целевой поток, а roadmap и индекс UC откладывают его за MVP. В PRODUCT есть ссылки на отсутствующий UC-09 и старые якоря roadmap; ARCHITECTURE ссылается на отсутствующий PASSPORT.md. UC-02 допускает выбор вакансии при intake, но PRODUCT требует сначала unprocessed-кандидата. При интеграции безопасная последовательность: сохранить unassigned → отдельно подтвердить назначение, не считать предпочтение кандидата назначением. Не менять смысл документов молча.

## Главный результат

Auth и onboarding используют реальный API. Основные ATS-экраны при этом работают на отдельном браузерном Copilot state. Создание вакансии или кандидата в этих экранах не создаёт запись в PostgreSQL. Наличие API-функции в репозитории не означает, что текущая страница её вызывает.

### Матрица покрытия

Все пути API ниже относительны к `/api/v1`.

| Функция / UC | Текущее состояние frontend | Backend | Следующий шаг |
|---|---|---|---|
| Auth, OAuth, consent, legal | `shared/api/auth.ts`, AuthProvider и auth-формы используют API | `/auth/*` реализованы | Сохранить существующий транспорт cookies/CSRF; проверить весь поток в runtime |
| Onboarding | `features/onboarding/useOnboarding.ts` вызывает updateMe | Изменение auth-профиля | Не считать onboarding полноценным заполнением анкеты Candidate |
| Список/деталь вакансии, UC-03/05 | `views/jobs/ui/JobsPageClient.tsx`: loadCopilotState, tenant = первая демо-компания | GET `/vacancies/`, GET `/vacancies/{id}` | Перевести на API, серверные фильтры/пагинацию, загрузку детали по ID |
| Создание/удаление вакансии, UC-03 | addVacancy/removeVacancy и saveCopilotState | POST `/vacancies/`, DELETE `/vacancies/{id}` | Подключить существующий API с проверкой permission в UI |
| Изменение вакансии | API-wrapper есть, текущий экран локальный; handleUpdateStages ничего не делает | PATCH `/vacancies/{id}` для основных полей | Подключить допустимые поля; этапы требуют отдельной реализации |
| Карьера кандидата, UC-01 | `views/userPage/ui/CareerView.tsx`: локальные открытые вакансии; кнопки отклика нет | GET вакансий с ограничением open для candidate; POST `/vacancies/{id}/applications` | Реальный список/деталь; подключить отклик и корректно показать 409 при повторе |
| Пул/деталь кандидата, UC-02/05 | `views/candidates/ui/CandidatePageClient.tsx`: локальный state и dashboardAdapters | GET `/candidates/`, GET `/candidates/{id}` | Подключить API; учитывать роль, серверный поиск и все страницы |
| HR intake, UC-02 | intake() сохраняет в localStorage; выбранный файл представлен только именем | POST `/candidates/`: questionnaire, email, resume_url | Подключить сохранение структурированных данных/референса; реальная загрузка файла отсутствует |
| Своя анкета, UC-01 | Нет подключённого полного candidate resume flow | GET/PUT `/{id}/questionnaire`, PATCH `/candidates/{id}`; проверка ownership | Найти own Candidate через API и сохранять анкету; не создавать HR-запись от имени candidate |
| Назначение, UC-04 | Реальные данные не используются; адаптер отображает requestedVacancyId как assigned_vacancy_id | POST `/candidates/{id}/assign`: создаёт Application, статус assigned | Отдельное подтверждение назначения HR/admin; убрать ложное назначение по предпочтению |
| Удаление кандидата | На текущем экране не подключено | DELETE `/candidates/{id}`, permission candidate.delete | Подключать только для разрешённого сервером пользователя |
| Файл резюме | «Открыть» в CandidateProfile без обработчика | GET `/candidates/{id}/resume-url`, но URL — presign.local stub | Не выдавать stub за рабочую загрузку/скачивание; сначала storage backend |
| Статусы/этапы pipeline | Локальные demo-статусы/этапы | Назначение есть; отдельного API смены статуса/этапа нет | Доработка backend в M4; PATCH анкеты не поддерживает статус |
| Dashboard | `app/dashboard/page.tsx` → dashboardMock; виджеты имеют свои mock-модели | GET `/dashboard`: агрегаты по роли | Подключить только реальные метрики; другие блоки сохранить и пометить демо |
| Уведомления | DashboardNotifications: localStorage, локальное markRead | Доставка application notification есть в сервисе; публичного API списка/прочтения нет | Пока тег демо; подключение после появления read/update API |
| Заметки кандидата | useCandidatesPage хранит notesByCandidate в React state | API заметок нет | Тег «Демо · заметки не сохраняются на сервере» |
| История кандидата | Презентационное поле history, отсутствует в CandidatePublic | Есть auth/application audit, но нет endpoint истории кандидата | Сохранить блок, тег демо; нужен API и полное покрытие событий |
| Календарь/интервью | CalendarGrid и upcoming widgets используют демонстрационные данные | Публичных interview CRUD routes нет | Сохранить с тегом демо |
| AI, рекомендации, MCP, memory, audit Copilot | features/hr-copilot: seed, engine, browser storage | Реального Copilot API в api/main.py нет | Оставить отдельной явно подписанной демонстрацией post-MVP |
| Admin, UC-06 | Отдельный полноценный admin UI не установлен аудитом | Users routes и permissions существуют | Инвентаризировать нужные admin-сценарии отдельно; не считать UC закрытым наличием users API |

## Ошибки контрактов и поведения перед подключением

1. `entities/job/model/api.ts` отправляет CreateVacancyPayload целиком. Backend `CreateVacancyRequest` использует extra=forbid и принимает только title, status, department, description, requirements. location, employmentType, salaryMin/Max, recruiter, experience вызовут 422, если присутствуют. Эти поля нельзя молча терять: сохранять интерфейс, явно отметить неподдержанное сохранение до расширения контракта.
2. Create использует `/vacancies`, detail/update/delete — завершающий `/`, тогда как канонические routes: `/vacancies/` и `/vacancies/{id}`. Убрать зависимость мутаций от redirect.
3. `updateVacancy` допускает stages, но UpdateVacancyRequest их запрещает. Отдельного публичного API редактирования pipeline stages нет.
4. `getCandidates` получает только первую страницу (по умолчанию 20), `getVacancies` выбрасывает pagination. Клиентская фильтрация такого результата даст неполную картину. Нужны серверные фильтры и пагинация либо явная загрузка всех страниц для необходимых вычислений.
5. Frontend Candidate требует заполненную Questionnaire и массив education; backend допускает произвольный dict и nullable email/даты. Прямой cast API-ответа может привести к падению `q.education.length` и `created_at.slice`. Нужен адаптер с defaults без выдуманных биографических данных.
6. Frontend CandidateStatus содержит unassigned/assigned/rejected; backend имеет дополнительные состояния. JobStatus также не является точным API enum. Разделить API-типы из schema.d.ts и подписи для UI, проверить актуальность сгенерированной схемы.
7. Профиль открывается только при `selectedCandidate && selectedJob`. Поэтому unassigned-кандидат не получает детальную карточку. Допустить профиль без вакансии, сохранив дизайн.
8. Деталь кандидата/вакансии сейчас ищется в локальном списке. После перехода на пагинацию нужно загружать detail endpoint, иначе ID вне текущей страницы будет ошибочно «не найден».
9. `dashboardAdapters.ts` смешивает предпочтительную и назначенную вакансии. Реальная связь берётся из assigned_vacancy_id; preferred/requested vacancy остаётся отдельным полем анкеты.
10. `proxy.ts` только вызывает NextResponse.next, dashboard layout не проверяет сессию/роль. Demo-экраны обходят серверную авторизацию, поскольку не обращаются к API. При интеграции проверять session/permissions, 401/403/404, не использовать первую демо-компанию или переключатель роли для доступа.

## Неполнота backend, которую нельзя решить заменой mock на fetch

- `app/ats/resume.py` прямо обозначен stub: presign.local не является защищённым хранилищем. create_candidate даже без файла создаёт opaque key; наличие resume_url ещё не доказывает наличие файла.
- Questionnaire сохраняется JSON, но доменная валидация полноценного HTML resume и consent для HR intake требует отдельной проверки/доработки. Consent регистрации не доказывает согласие каждого введённого HR кандидата.
- assign_candidate не проверяет статус open вакансии; apply_to_vacancy проверяет. Проверку для ручного назначения нужно согласовать с M4 и добавить на сервере.
- apply_to_vacancy создаёт активное Application, но не меняет Candidate.status, в отличие от assign_candidate. Перед отображением pipeline нужно явно определить различие «отклик»/«назначение», а не выводить статус из факта выбора вакансии.
- Dashboard содержит и реальные COUNT, и значения по умолчанию: candidates_created_by_me=0, unread_notifications=0, recent_pending_packages=[] без вычисления. Не выдавать эти значения за измеренную аналитику. В API нет полной метрики «в работе», предыдущего месяца, time-to-hire, velocity, AI top, расписания.
- Маршрутов ручной смены статуса/этапа, заметок, истории кандидата, списка/прочтения уведомлений и файлового upload в зарегистрированном API нет. Таблица БД или событие не заменяют публичный контракт.
- CRUD/назначение кандидатов не демонстрируют полное audit-покрытие submission/access/status из M4; отдельные application/auth audit уже есть.

## План компоновки без изменения дизайна

1. **Контракты и доступ:** API DTO → presentation adapters, канонические paths, ошибки/загрузка/пустые состояния, session/permissions, серверные фильтры и пагинация. Ни один API error не подменять seed-данными.
2. **Вакансии:** real list/detail/create/update/delete, careers list/detail. Существующую форму сохранить; неподдержанные backend поля явно маркировать до расширения схемы.
3. **Кандидаты:** real pool/detail, HR intake с questionnaire и референсом, own questionnaire, отдельное подтверждённое assign, кандидат без вакансии. Для candidate отклик — существующий applications API, с обработкой duplicate.
4. **Главная:** role-shaped dashboard aggregates; подписать непокрытые метрики/графики по месту. Не заменять «в работе» на total_candidates без изменения смысла.
5. **Демо-теги:** переиспользуемый небольшой badge в заголовке/углу конкретного блока. Тексты: «Демо · ожидает backend», для несохраняемых полей — «Демо · не сохраняется», для файлов — «Демо · загрузка не подключена». На смешанной странице подписывать конкретный блок, не всю страницу. После подключения badge убрать только с реально покрытой функции.
6. **Дальнейший roadmap M4–M5:** защищённый resume storage, валидация/consent, статус/этап, аудит, необходимые read APIs. Затем доказать acceptance flow. AI/MCP/memory оставить за MVP.

### Критерии завершения следующего этапа

- Созданная UI вакансия и HR-кандидат присутствуют в API/БД и остаются после reload, нового браузера и повторного входа.
- Назначение создаёт реальную связь с вакансией; предпочтение не считается назначением; unassigned-профиль открывается.
- Candidate видит только своё, manager использует read-only возможности, HR/admin имеют разрешённые мутации. Прямые запросы и другой tenant проверяются на сервере.
- Ошибки, 409 duplicate, отсутствие записи и пустой пул отображаются честно; API недоступность не включает demo fallback.
- Существующая компоновка, формы, вкладки и блоки сохраняются. Непокрытые функции имеют локальные демо-теги.
- Полный поток M5: intake → ATS pool → vacancy → ручная смена статуса, с аудитом и отрицательными tenant/RBAC проверками. Пока backend статуса/storage не готов, не объявлять этот acceptance пройденным.

## Проверки этого аудита

Проведён статический разбор действующих страниц, wrappers, DTO, зарегистрированных routes и ATS services. Наличие regression-тестов подтверждено в `backend/tests/api/routes/test_ats_api.py`, `test_tenant_isolation.py`, `test_dashboard_analytics.py`, `test_auth_cookies.py` и `backend/tests/db/`; они не запускались, и не заменяют отсутствующее UI E2E-доказательство. Единственное изменение текущего этапа — этот документ.


## Результат компоновки после аудита

Первоначальные таблицы выше фиксируют состояние до изменений. Подключённые
функции и доказательства проверок теперь отслеживаются в [changelog](../changelog.md)
и разделе remediation в [roadmap](ROADMAP.md). Это не закрывает M4/M5 целиком:
file storage, ручные статусы, полноценный consent/access audit и отсутствующие
read APIs остаются отдельными задачами. Дополнительно regression-тесты обнаружили
отсутствующий HR grant `application.assign`; он восстановлен новой миграцией
`c4d5e6f7a8b9`, без изменения ранее выпущенных миграций.


## Developer access and administration follow-up (2026-09-30)

The owner/admin work has now been verified against the running local Compose
API/database with **real sessions** through agent-browser. This replaces the
previous mocked-session evidence for developer access, without changing the
historical audit findings above.

- [x] Apply `d5e6f7a8b9c0` and initialize the configured owner.
- [x] Separate owner-only developer access from administrator permissions.
- [x] Reject ordinary role/localStorage spoofing with server 403s; prohibit admin owner edits, deletion, self-promotion and creation of a superuser.
- [x] Verify administration off/on, role/data-mode/reload resets, user CRUD and shared vacancy views with real API persistence.
- [x] Fix user deletion with consent/OAuth links, unavailable controls still shown as disabled, and demo IDs reaching the live API while authorization loads.
- [x] Verify six developer previews, five ordinary real sessions, mobile 390px, final browser errors and cleanup of temporary records.
- [x] Run 47 targeted backend and 12 frontend regression tests; refresh ATS/RBAC and generated contracts.
- [ ] Full M4/M5 remains open for the storage, validation, status/audit and missing APIs listed above.

Details and reproduction commands: [verification checklist](verification/DEV_MODE_ADMINISTRATION.md).
