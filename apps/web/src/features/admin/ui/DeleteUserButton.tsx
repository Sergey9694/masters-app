"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUserAction } from "../api/delete-user";
import { ConfirmDialog } from "@/shared/ui/custom/confirm-dialog";
import { Button } from "@/shared/ui/button";

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUserAction({ userId });
      
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.validationErrors) {
        toast.error("Ошибка валидации");
      } else {
        toast.success(`Пользователь «${userName}» удалён`);
      }
    });
  };

  return (
    <ConfirmDialog
      title="Удалить пользователя?"
      description={`Вы собираетесь безвозвратно удалить пользователя «${userName}» со всеми его заказами, профилем, откликами и отзывами. Это действие нельзя отменить.`}
      confirmText="Удалить навсегда"
      variant="destructive"
      onConfirm={handleDelete}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
          title="Удалить пользователя"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      }
    />
  );
}
