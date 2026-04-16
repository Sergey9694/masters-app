"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, SendHorizontal } from "lucide-react";

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
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Card } from "@/shared/ui/card";
import {
  taskResponseSchema,
  type TaskResponseFormValues,
} from "../model/schema";
import { submitProposalAction } from "../api/actions";

interface Props {
  referenceId: string;
}

export function RespondForm({ referenceId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<TaskResponseFormValues>({
    resolver: zodResolver(taskResponseSchema),
    defaultValues: { referenceId, price: "", message: "" },
  });

  const onSubmit = (vals: TaskResponseFormValues) => {
    startTransition(async () => {
      const res = await submitProposalAction(vals);
      if (res?.data?.success) {
        toast.custom(() => (
          <MotionToast type="success">Отклик отправлен!</MotionToast>
        ));
        form.reset({ referenceId, price: "", message: "" });
        router.refresh();
        return;
      }
      if (res?.serverError) {
        toast.error(res.serverError);
      }
    });
  };

  return (
    <Card className="glass-premium border-none p-6 rounded-[var(--ui-radius-premium)]">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-4">
        Предложить услугу
      </h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">
                  Ваша цена (₽)
                </FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Опционально" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">
                  Сообщение заказчику
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Когда сможете приехать, что входит в работу..."
                    className="min-h-[100px]"
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
                Откликнуться
                <SendHorizontal className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
