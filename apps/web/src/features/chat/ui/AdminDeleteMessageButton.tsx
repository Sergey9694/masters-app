"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { deleteMessageAdminAction } from "../api/admin-actions";

export function AdminDeleteMessageButton({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteMessageAdminAction({ messageId });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success("Сообщение удалено");
      router.refresh();
    });
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      disabled={isPending}
      onClick={handleDelete}
      className="h-7 w-7 shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
      title="Удалить сообщение"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
    </Button>
  );
}
