"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { MotionToast } from "@/shared/ui/motion-toast";
import { completeTaskAction, cancelTaskAction } from "../api/actions";

interface Props {
  taskId: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
}

export function TaskStatusButtons({ taskId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onComplete = () => {
    startTransition(async () => {
      const res = await completeTaskAction(taskId);
      if ("success" in res) {
        toast.custom(() => (
          <MotionToast type="success">Заявка завершена</MotionToast>
        ));
        router.refresh();
        return;
      }
      toast.error(res.error);
    });
  };

  const onCancel = () => {
    if (!confirm("Отменить заявку?")) return;
    startTransition(async () => {
      const res = await cancelTaskAction(taskId);
      if ("success" in res) {
        toast.custom(() => (
          <MotionToast type="success">Заявка отменена</MotionToast>
        ));
        router.refresh();
        return;
      }
      toast.error(res.error);
    });
  };

  return (
    <div className="flex gap-3">
      {status === "IN_PROGRESS" && (
        <Button
          type="button"
          variant="premium"
          size="lg"
          disabled={isPending}
          onClick={onComplete}
          className="flex-1"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Завершить
            </>
          )}
        </Button>
      )}
      {(status === "OPEN" || status === "IN_PROGRESS") && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isPending}
          onClick={onCancel}
          className="flex-1"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Отменить
        </Button>
      )}
    </div>
  );
}
