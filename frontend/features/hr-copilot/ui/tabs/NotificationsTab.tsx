import type { Notification } from "../../model/types";
import { date, secondary } from "../constants";
import { Section } from "../Section";

export function NotificationsTab({
  notifications,
  onMarkRead,
}: {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}) {
  return (
    <Section title="События в портале" description="Уведомление информирует; подтвердить AI действие можно только в HR Copilot.">
      <div className="mt-4 space-y-2">
        {notifications.map((x) => (
          <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
            <div>
              <strong>{x.text}</strong>
              <div className="text-xs text-muted-foreground">{date(x.createdAt)}</div>
            </div>
            <button onClick={() => onMarkRead(x.id)} className={secondary}>
              {x.read ? "Прочитано" : "Прочитать"}
            </button>
          </div>
        ))}
        {!notifications.length && <p className="text-sm text-muted-foreground">Уведомлений пока нет.</p>}
        <div className="rounded-xl bg-brand-primary/5 p-4 text-xs">
          Email и отправка писем кандидатам здесь показаны только как будущие каналы; реальная отправка не выполняется.
        </div>
      </div>
    </Section>
  );
}
