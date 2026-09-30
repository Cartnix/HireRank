export function DemoBadge({ label = "Dev mode · тестовые данные" }: { label?: string }) {
  return <span className="inline-flex max-w-full self-start rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">{label}</span>;
}
