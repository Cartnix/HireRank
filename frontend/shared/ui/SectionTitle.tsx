export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="text-[26px] font-bold tracking-tight text-foreground">{title}</div>
      {subtitle && <div className="mt-1 text-[14px] text-foreground-secondary">{subtitle}</div>}
    </div>
  );
}
