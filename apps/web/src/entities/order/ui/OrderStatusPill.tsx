import { cn } from "@/shared/lib/cn";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Открыт", cls: "bg-primary/10 text-primary" },
  IN_PROGRESS: { label: "В работе", cls: "bg-warning/15 text-warning" },
  COMPLETED: { label: "Завершён", cls: "bg-success/15 text-success" },
  CANCELED: { label: "Отменён", cls: "bg-destructive/15 text-destructive" },
  EXPIRED: { label: "Истёк", cls: "bg-muted text-muted-foreground" },
};

export function OrderStatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const cfg = STATUS_MAP[status] ?? {
    label: status,
    cls: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cfg.cls,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
