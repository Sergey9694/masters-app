"use client";

import { useAction } from "next-safe-action/hooks";
import { Loader2, ShieldX, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { unblockUserAction } from "../api/actions";

interface Props {
  conversationId: string;
  blockedUserId: string;
  blockedByMe: boolean;
  onUnblocked?: () => void;
}

export function BlockedState({ conversationId, blockedUserId, blockedByMe, onUnblocked }: Props) {
  const { execute, isPending } = useAction(unblockUserAction, {
    onSuccess: () => {
      toast.success("Переписка разблокирована");
      onUnblocked?.();
    },
    onError: ({ error }) => toast.error(error.serverError || "Не удалось разблокировать"),
  });

  return (
    <div className="border-t border-border/40 bg-surface/70 px-4 py-4">
      <div className="flex flex-col gap-3 rounded-xl border border-rose-200/60 bg-rose-50/80 p-4 text-sm text-rose-950 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldX className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold">
              {blockedByMe ? "Вы заблокировали пользователя" : "Переписка ограничена"}
            </p>
            <p className="mt-0.5 text-xs opacity-80">
              {blockedByMe
                ? "Новые сообщения отключены, пока вы не снимете блокировку."
                : "Собеседник ограничил возможность отправки сообщений."}
            </p>
          </div>
        </div>

        {blockedByMe && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => execute({ blockedId: blockedUserId, conversationId })}
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Unlock className="mr-2 size-4" />
            )}
            Разблокировать
          </Button>
        )}
      </div>
    </div>
  );
}
