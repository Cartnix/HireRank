export function GhostButton({
  children,
  onClick,
  className = "",
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-background-elevated px-3.5 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
