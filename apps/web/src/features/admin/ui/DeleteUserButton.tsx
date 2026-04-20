"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUser } from "../api/delete-user";

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-red-400 font-bold mr-1">Удалить?</span>
        <button
          onClick={() => {
            startTransition(async () => {
              try {
                await deleteUser(userId);
                toast.success(`Пользователь «${userName}» удалён`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Ошибка удаления");
                setConfirm(false);
              }
            });
          }}
          disabled={isPending}
          className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Да"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          disabled={isPending}
          className="px-2 py-0.5 rounded-md text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
        >
          Нет
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      title="Удалить пользователя"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
