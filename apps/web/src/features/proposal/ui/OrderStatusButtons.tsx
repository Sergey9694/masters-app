"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { MotionToast } from "@/shared/ui/motion-toast";
import { completeOrderAction, cancelOrderAction, refuseOrderAction } from "../api/actions";

interface Props {
  referenceId: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  isOwner: boolean;
  isAssignedMaster: boolean;
}

export function OrderStatusButtons({ referenceId, status, isOwner, isAssignedMaster }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onComplete = () => {
    startTransition(async () => {
      const res = await completeOrderAction(referenceId);
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
      const res = await cancelOrderAction(referenceId);
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

  const onRefuse = () => {
    if (!confirm("Вы действительно хотите отказаться от выполнения заказа?")) return;
    startTransition(async () => {
      const res = await refuseOrderAction(referenceId);
      if ("success" in res) {
        toast.custom(() => (
          <MotionToast type="success">Вы отказались от заказа</MotionToast>
        ));
        router.refresh();
        return;
      }
      toast.error(res.error);
    });
  };

  return (
    <div className="flex gap-3">
      {isOwner && status === "IN_PROGRESS" && (
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
      {isOwner && (status === "OPEN" || status === "IN_PROGRESS") && (
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
      {isAssignedMaster && status === "IN_PROGRESS" && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isPending}
          onClick={onRefuse}
          className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Отказаться"}
        </Button>
      )}
    </div>
  );
}
