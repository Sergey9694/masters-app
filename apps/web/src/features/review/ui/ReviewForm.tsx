"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Star, SendHorizontal } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { reviewSchema, type ReviewFormValues } from "../model/schema";
import { createReviewAction } from "../api/actions";

interface Props {
  referenceId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ referenceId, onSuccess }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hoveredRating, setHoveredRating] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { referenceId, rating: 5, text: "" },
  });

  const rating = watch("rating");

  const onSubmit = (vals: ReviewFormValues) => {
    startTransition(async () => {
      const res = await createReviewAction(vals);

      if (res?.data?.success) {
        toast.success("Спасибо за отзыв!");
        router.refresh();
        onSuccess?.();
        return;
      }

      toast.error(res?.serverError || "Ошибка при отправке отзыва");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <input type="hidden" {...register("referenceId")} />

      <Field label="Оценка">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = n <= (hoveredRating || rating);
            return (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHoveredRating(n)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setValue("rating", n, { shouldValidate: true })}
                className="transition-transform active:scale-90"
              >
                <Star
                  className={cn(
                    "size-8 transition-colors",
                    active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                  )}
                />
              </button>
            );
          })}
        </div>
        {errors.rating && (
          <p className="text-xs text-destructive">{errors.rating.message}</p>
        )}
      </Field>

      <Field label="Комментарий (опционально)">
        <textarea
          {...register("text")}
          placeholder="Как справился исполнитель?"
          rows={4}
          className={textareaCls}
        />
        {errors.text && (
          <p className="text-xs text-destructive">{errors.text.message}</p>
        )}
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Отправить отзыв
            <SendHorizontal className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const textareaCls =
  "min-h-[90px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10";
