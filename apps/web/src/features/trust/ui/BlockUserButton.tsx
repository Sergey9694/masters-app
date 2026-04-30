"use client";

import { useAction } from "next-safe-action/hooks";
import { Ban, Loader2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { blockUserAction, unblockUserAction } from "../api/actions";
import type { BlockStateDTO } from "@uslugi/shared-types";

interface Props {
  blockedId: string;
  conversationId?: string;
  blockState: BlockStateDTO;
  onChanged?: (state: BlockStateDTO) => void;
  className?: string;
}

export function BlockUserButton({ blockedId, conversationId, blockState, onChanged, className }: Props) {
  const block = useAction(blockUserAction, {
    onSuccess: () => {
      const nextState = { blockedByMe: true, blockedMe: false, isBlocked: true };
      onChanged?.(nextState);
      toast.success("Пользователь заблокирован");
    },
    onError: ({ error }) => toast.error(error.serverError || "Не удалось заблокировать"),
  });

  const unblock = useAction(unblockUserAction, {
    onSuccess: () => {
      const nextState = { blockedByMe: false, blockedMe: false, isBlocked: false };
      onChanged?.(nextState);
      toast.success("Пользователь разблокирован");
    },
    onError: ({ error }) => toast.error(error.serverError || "Не удалось разблокировать"),
  });

  const pending = block.isPending || unblock.isPending;
  const blockedByMe = blockState.blockedByMe;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("text-muted-foreground hover:text-foreground", className)}
      disabled={pending}
      aria-label={blockedByMe ? "Разблокировать" : "Заблокировать"}
      title={blockedByMe ? "Разблокировать" : "Заблокировать"}
      onClick={() => {
        if (blockedByMe) {
          unblock.execute({ blockedId, conversationId });
        } else {
          block.execute({ blockedId, conversationId, reason: "chat_user_block" });
        }
      }}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : blockedByMe ? (
        <Unlock className="size-4" />
      ) : (
        <Ban className="size-4" />
      )}
    </Button>
  );
}
