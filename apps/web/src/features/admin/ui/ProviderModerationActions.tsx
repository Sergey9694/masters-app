"use client";

import { useTransition } from "react";
import { verifyProviderAction, rejectProviderAction } from "../api/verify-provider";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/shared/ui/custom/confirm-dialog";

interface Props {
  providerId: string;
  providerName: string;
}

export function ProviderModerationActions({ providerId, providerName }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleVerify = () => {
    startTransition(async () => {
      const result = await verifyProviderAction({ providerId });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        toast.success(`Исполнитель ${providerName} верифицирован`, {
          description: "Теперь он может откликаться на заказы.",
        });
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectProviderAction({ providerId });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        toast.success(`Заявка ${providerName} отклонена`, {
          description: "Профиль исполнителя удален.",
        });
      }
    });
  };

  return (
    <div className={`flex gap-2 pt-2 transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <ConfirmDialog
        title="Верифицировать исполнителя?"
        description={`Вы подтверждаете статус исполнителя для ${providerName}.`}
        confirmText="Верифицировать"
        onConfirm={handleVerify}
        trigger={
          <Button
            size="sm"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Аппрувить
          </Button>
        }
      />

      <ConfirmDialog
        title="Отклонить заявку?"
        description={`Заявка от ${providerName} будет удалена без возможности восстановления.`}
        variant="destructive"
        confirmText="Отклонить"
        onConfirm={handleReject}
        trigger={
          <Button
            size="sm"
            variant="ghost"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold transition-colors border border-red-500/20"
          >
            <X className="w-4 h-4" />
            Отклонить
          </Button>
        }
      />
    </div>
  );
}
