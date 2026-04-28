"use client";

import { useTransition, useState } from "react";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  blockUserChatAction,
  unblockUserChatAction,
  exportConversationAction,
} from "../api/admin-actions";

interface Props {
  userId: string;
  userName: string;
  isBlocked: boolean;
  conversationId: string;
}

export function AdminChatActions({
  userId,
  userName,
  isBlocked,
  conversationId,
}: Props) {
  const [blocked, setBlocked] = useState(isBlocked);
  const [isPending, startTransition] = useTransition();

  const handleBlock = () => {
    startTransition(async () => {
      const res = await blockUserChatAction({ userId });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      setBlocked(true);
      toast.success("Пользователь заблокирован в чате");
    });
  };

  const handleUnblock = () => {
    startTransition(async () => {
      const res = await unblockUserChatAction({ userId });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      setBlocked(false);
      toast.success("Пользователь разблокирован");
    });
  };

  const handleExportCsv = () => {
    startTransition(async () => {
      const res = await exportConversationAction({ conversationId });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      const csv = res?.data?.csv;
      if (!csv) return;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${conversationId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV экспортирован");
    });
  };

  return (
    <div className="flex flex-col gap-2 p-3 border border-white/10 rounded-xl bg-[#16162a]">
      <p className="text-sm font-semibold text-white">{userName}</p>

      {blocked ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleUnblock}
          className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Разблокировать
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={handleBlock}
          className="text-xs"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Заблокировать чат
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleExportCsv}
        className="text-xs border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
        Экспорт CSV
      </Button>
    </div>
  );
}
