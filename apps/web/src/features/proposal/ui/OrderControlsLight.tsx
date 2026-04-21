"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, UserX, Loader2 } from "lucide-react";

import {
  acceptProposalAction,
  completeOrderAction,
  cancelOrderAction,
  refuseOrderAction,
} from "../api/actions";

interface AcceptProposalButtonProps {
  proposalId: string;
}

export function AcceptProposalButton({ proposalId }: AcceptProposalButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const res = await acceptProposalAction({ proposalId });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success("Исполнитель выбран");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
      Выбрать
    </button>
  );
}

interface OrderStatusControlsProps {
  orderId: string;
  status: string;
  isOwner: boolean;
  isAssignedProvider: boolean;
}

export function OrderStatusControlsLight({
  orderId,
  status,
  isOwner,
  isAssignedProvider,
}: OrderStatusControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ serverError?: string } | undefined>, successText: string) => {
    startTransition(async () => {
      const res = await fn();
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success(successText);
      router.refresh();
    });
  };

  const buttons: Array<{ label: string; icon: typeof CheckCircle2; onClick: () => void; tone: "primary" | "muted" | "danger" }> = [];

  if (isOwner && status === "OPEN") {
    buttons.push({
      label: "Отменить заказ",
      icon: XCircle,
      onClick: () => run(() => cancelOrderAction({ referenceId: orderId }), "Заказ отменён"),
      tone: "danger",
    });
  }

  if (isOwner && status === "IN_PROGRESS") {
    buttons.push({
      label: "Завершить заказ",
      icon: CheckCircle2,
      onClick: () => run(() => completeOrderAction({ referenceId: orderId }), "Заказ завершён"),
      tone: "primary",
    });
  }

  if (isAssignedProvider && status === "IN_PROGRESS") {
    buttons.push({
      label: "Отказаться от выполнения",
      icon: UserX,
      onClick: () => run(() => refuseOrderAction({ referenceId: orderId }), "Вы отказались от заказа"),
      tone: "muted",
    });
  }

  if (buttons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((b) => {
        const Icon = b.icon;
        const toneClass =
          b.tone === "primary"
            ? "bg-primary text-primary-foreground hover:brightness-110"
            : b.tone === "danger"
              ? "border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
              : "border border-border bg-background text-foreground hover:bg-muted";
        return (
          <button
            key={b.label}
            type="button"
            onClick={b.onClick}
            disabled={isPending}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition-all disabled:opacity-50 ${toneClass}`}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
            {b.label}
          </button>
        );
      })}
    </div>
  );
}
