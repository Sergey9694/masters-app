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
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/cn";
import { reviewSchema, type ReviewFormValues } from "../model/schema";
import { createReviewAction } from "../api/actions";

interface Props {
  referenceId: string;
}

export function ReviewForm({ referenceId }: Props) {
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
      if ("success" in res) {
        toast.custom(() => (
          <MotionToast type="success">Спасибо за отзыв!</MotionToast>
        ));
        router.refresh();
        return;
      }
      toast.error(res.error);
    });
  };

  return (
    <Card className="glass-premium border-none p-6 rounded-[var(--ui-radius-premium)]">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-4">
        Оставить отзыв
      </h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="rating"
            render={() => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">
                  Оценка
                </FormLabel>
                <div className="flex items-center gap-2">
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
                            "w-8 h-8 transition-colors",
                            active
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-600",
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
                <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">
                  Комментарий (опционально)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Как справился исполнитель?"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="premium" size="lg" disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Отправить
                <SendHorizontal className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
