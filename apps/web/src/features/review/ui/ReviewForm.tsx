"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Star, SendHorizontal } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { MotionToast } from "@/shared/ui/motion-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Textarea } from "@/shared/ui/textarea";
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

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { referenceId, rating: 5, text: "" },
  });

  const rating = form.watch("rating");

  const onSubmit = (vals: ReviewFormValues) => {
    startTransition(async () => {
      const res = await createReviewAction(vals);

      if (res?.data?.success) {
        toast.custom(() => (
          <MotionToast type="success">Спасибо за отзыв!</MotionToast>
        ));
        router.refresh();
        onSuccess?.();
        return;
      }

      toast.error(res?.serverError || "Ошибка при отправке отзыва");
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={() => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Оценка</FormLabel>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = n <= (hoveredRating || rating);
                  return (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHoveredRating(n)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => form.setValue("rating", n)}
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Комментарий (опционально)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Как справился исполнитель?"
                  className="min-h-22.5"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Отправить отзыв
              <SendHorizontal className="size-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
