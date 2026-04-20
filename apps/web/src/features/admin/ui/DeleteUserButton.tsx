"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUser } from "../api/delete-user";
import { ConfirmDialog } from "@/shared/ui/custom/confirm-dialog";

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteUser(userId);
        toast.success(`Пользователь «${userName}» удалён`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Ошибка удаления");
      }
    });
  };

  return (
    <ConfirmDialog
      title="Удалить пользователя?"
      description={`Вы собираетесь безвозвратно удалить пользователя «${userName}» со всеми его заказами, профилем, откликами и отзывами. Это действие нельзя отменить.`}
      confirmText="Удалить"
      cancelText="Отмена"
      variant="destructive"
      onConfirm={handleDelete}
      trigger={
        <button
          disabled={isPending}
          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          title="Удалить пользователя"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      }
    />
  );
}
