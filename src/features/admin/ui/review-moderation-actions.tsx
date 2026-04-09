"use client";

import { useTransition } from "react";
import { deleteReview } from "../api/moderate-review";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/shared/ui/custom/confirm-dialog";

interface Props {
  reviewId: string;
  authorName: string;
}

export function ReviewModerationActions({ reviewId, authorName }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleConfirmDelete = () => {
    startTransition(async () => {
      try {
        await deleteReview(reviewId);
        toast.success("Отзыв удален", {
          description: `Отзыв от ${authorName} успешно удален из системы.`,
        });
      } catch (e) {
        toast.error("Ошибка при удалении");
      }
    });
  };

  return (
    <ConfirmDialog
      title="Удалить отзыв?"
      description={`Вы собираетесь безвозвратно удалить отзыв от пользователя ${authorName}. Это действие нельзя отменить.`}
      variant="destructive"
      confirmText="Удалить"
      onConfirm={handleConfirmDelete}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
          title="Удалить"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      }
    />
  );
}
