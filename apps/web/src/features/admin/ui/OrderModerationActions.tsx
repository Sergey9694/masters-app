"use client";

import { useTransition } from "react";
import { toggleOrderVisibility, deleteOrderAction } from "../api/moderate-order";
import { Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";
import { ConfirmDialog } from "@/shared/ui/custom/confirm-dialog";

interface Props {
  referenceId: string;
  status: OrderStatus;
}

export function OrderModerationActions({ referenceId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const isCanceled = status === "CANCELED";

  const toggleVisibility = () => {
    startTransition(async () => {
      const res = await toggleOrderVisibility(referenceId);
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success(isCanceled ? "Заказ восстановлен" : "Заказ скрыт", {
        description: `Статус зазака изменен на ${isCanceled ? "Открыта" : "Отменена"}`,
      });
    });
  };

  const confirmDelete = () => {
    startTransition(async () => {
      const res = await deleteOrderAction(referenceId);
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success("Заказ удален", {
        description: "Объект и все связанные отклики безвозвратно удалены.",
      });
    });
  };

  return (
    <div className={`flex gap-1 transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <ConfirmDialog
        title={isCanceled ? "Восстановить заказ?" : "Скрыть заказ?"}
        description={isCanceled 
          ? "Заказ снова станет видимым для исполнителей в общей ленте." 
          : "Исполнители больше не смогут видеть этот заказ и оставлять отклики."}
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
        title="Удалить заказ?"
        description="ВНИМАНИЕ! Это действие необратимо. Будут удалены все данные заказа и отклики исполнителей."
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
