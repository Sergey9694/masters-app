"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Check, Loader2, ThumbsDown, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { resolveReportAction } from "../api/actions";

interface Props {
  reportId: string;
}

export function ReportModerationActions({ reportId }: Props) {
  const router = useRouter();
  const { execute, isPending } = useAction(resolveReportAction, {
    onSuccess: () => {
      toast.success("Решение сохранено");
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError || "Не удалось сохранить решение"),
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => execute({ reportId, status: "REVIEWED" })}
      >
        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
        Проверено
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => execute({ reportId, status: "DISMISSED", actionTaken: "Жалоба отклонена" })}
      >
        <ThumbsDown className="mr-2 size-4" />
        Отклонить
      </Button>
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => execute({ reportId, status: "ACTIONED", actionTaken: "Требуется модераторское действие" })}
      >
        <ShieldCheck className="mr-2 size-4" />
        Принять меры
      </Button>
    </div>
  );
}
