"use client";

import { useTransition } from "react";
import { toggleTaskVisibility, deleteTask } from "../api/moderate-task";
import { Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { TaskStatus } from "@prisma/client";
import { ConfirmDialog } from "@/shared/ui/custom/confirm-dialog";

interface Props {
  taskId: string;
  status: TaskStatus;
}

export function TaskModerationActions({ taskId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const isCanceled = status === "CANCELED";

  const toggleVisibility = () => {
    startTransition(async () => {
      try {
        await toggleTaskVisibility(taskId);
        toast.success(isCanceled ? "Задача восстановлена" : "Задача скрыта", {
          description: `Статус задачи изменен на ${isCanceled ? "Открыта" : "Отменена"}`,
        });
      } catch (e) {
        toast.error("Ошибка при обновлении статуса");
      }
    });
  };

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        await deleteTask(taskId);
        toast.success("Задача удалена", {
          description: "Объект и все связанные отклики безвозвратно удалены.",
        });
      } catch (e) {
        toast.error("Ошибка при удалении");
      }
    });
  };

  return (
    <div className={`flex gap-1 transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <ConfirmDialog
        title={isCanceled ? "Восстановить задачу?" : "Скрыть задачу?"}
        description={isCanceled 
          ? "Задача снова станет видимой для мастеров в общей ленте." 
          : "Мастера больше не смогут видеть эту задачу и оставлять отклики."}
        variant="warning"
        confirmText={isCanceled ? "Восстановить" : "Скрыть"}
        onConfirm={toggleVisibility}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isCanceled ? "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10" : "text-slate-500 hover:text-amber-400 hover:bg-white/5"}`}
            title={isCanceled ? "Восстановить" : "Скрыть"}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCanceled ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        }
      />

      <ConfirmDialog
        title="Удалить задачу?"
        description="ВНИМАНИЕ! Это действие необратимо. Будут удалены все данные задачи и отклики мастеров."
        variant="destructive"
        confirmText="Удалить навсегда"
        onConfirm={confirmDelete}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            title="Удалить навсегда"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        }
      />
    </div>
  );
}
