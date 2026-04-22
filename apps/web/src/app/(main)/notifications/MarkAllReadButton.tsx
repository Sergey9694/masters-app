"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { cn } from "@/shared/lib/cn";
import { markAllReadAction } from "@/features/notifications";

export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markAllReadAction();
          toast.success("Все уведомления прочитаны");
          router.refresh();
        })
      }
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold",
        "transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-60"
      )}
    >
      <CheckCheck className="size-4" />
      Прочитать всё
    </button>
  );
}
