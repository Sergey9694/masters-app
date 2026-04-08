import { cn } from "@/shared/lib/cn";

export type TaskStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

interface StatusBadgeProps {
  status: TaskStatus | string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  OPEN: { 
    text: "Открыта", 
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20" 
  },
  IN_PROGRESS: { 
    text: "В работе", 
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20" 
  },
  COMPLETED: { 
    text: "Завершена", 
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
  },
  CANCELED: { 
    text: "Отменена", 
    color: "text-red-400 bg-red-500/10 border-red-500/20" 
  },
};

/**
 * Переиспользуемый компонент шильдика статуса задачи.
 * Содержит единую логику цветов и названий статусов.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { text: status, color: "text-slate-400 bg-slate-500/10" };

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
      config.color,
      className
    )}>
      {config.text}
    </span>
  );
}
