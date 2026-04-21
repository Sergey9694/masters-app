"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, SendHorizontal } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { taskResponseSchema, type TaskResponseFormValues } from "../model/schema";
import { submitProposalAction } from "../api/actions";

interface RespondFormLightProps {
  orderId: string;
}

/**
 * Светлая форма отклика на заказ (Фаза 5.5).
 * Использует тот же server action, что и легаси RespondForm.
 */
export function RespondFormLight({ orderId }: RespondFormLightProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<TaskResponseFormValues>({
    resolver: zodResolver(taskResponseSchema),
    defaultValues: { orderId, price: "", message: "" },
  });

  const onSubmit = (vals: TaskResponseFormValues) => {
    startTransition(async () => {
      const res = await submitProposalAction(vals);
      if (res?.data?.success) {
        toast.success("Отклик отправлен");
        form.reset({ orderId, price: "", message: "" });
        router.refresh();
        return;
      }
      if (res?.serverError) toast.error(res.serverError);
    });
  };

  const errors = form.formState.errors;

  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-5 shadow-sm">
      <h3 className="text-base font-semibold">Откликнуться на заказ</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Предложите свою цену и напишите, когда вы можете выполнить работу
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Ваша цена (₽)
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Опционально"
            className={cn(
              "h-11 rounded-xl border border-border bg-background px-3 text-sm",
              "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
              errors.price && "border-destructive"
            )}
            {...form.register("price")}
          />
          {errors.price && (
            <span className="text-xs text-destructive">{errors.price.message}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Сообщение заказчику
          </span>
          <textarea
            rows={4}
            placeholder="Когда сможете приехать, что входит в работу…"
            className={cn(
              "min-h-24 resize-y rounded-xl border border-border bg-background p-3 text-sm leading-relaxed",
              "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
              errors.message && "border-destructive"
            )}
            {...form.register("message")}
          />
          {errors.message && (
            <span className="text-xs text-destructive">{errors.message.message}</span>
          )}
        </label>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm",
            "transition-all hover:brightness-110 disabled:opacity-50"
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Отправить отклик
              <SendHorizontal className="size-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
