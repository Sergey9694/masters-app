"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, SaveIcon } from "lucide-react";
import { z } from "zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/cn";
import { updateOrderAction } from "../api/update-order-action";
import { AddressPicker } from "./AddressPicker";

const schema = z.object({
  title: z.string().min(5, "Не менее 5 символов").max(100, "Слишком длинный"),
  description: z.string().min(10, "Не менее 10 символов").max(1000, "Слишком длинное"),
  categoryId: z.string().min(1, "Выберите категорию"),
  cityId: z.string().min(1, "Выберите город"),
  budget: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      message: "Бюджет не может быть отрицательным",
    }),
  address: z.string().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  orderId: string;
  defaultValues: FormValues;
  categories: { id: string; name: string }[];
}

export function OrderEditFormLight({ orderId, defaultValues, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...defaultValues,
      lat: defaultValues.lat ?? null,
      lng: defaultValues.lng ?? null,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = (vals: FormValues) => {
    startTransition(async () => {
      const res = await updateOrderAction({ id: orderId, ...vals });
      if (res?.data?.success) {
        toast.success("Заказ обновлён");
        router.push(res.data.redirect);
        router.refresh();
        return;
      }
      toast.error(res?.serverError ?? "Ошибка сохранения");
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-foreground px-1">
                Заголовок
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Кратко опишите задачу" 
                  className="h-12 rounded-xl border-border/60 bg-surface focus:ring-primary/20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-foreground px-1">
                Описание
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={5}
                  placeholder="Подробности, требования, сроки..."
                  className="min-h-[120px] rounded-xl border-border/60 bg-surface focus:ring-primary/20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground px-1">
                  Категория
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-border/60 bg-surface focus:ring-primary/20">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground px-1">
                  Бюджет (₽)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    placeholder="Например: 5000"
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
                    }}
                    className="h-12 rounded-xl border-border/60 bg-surface focus:ring-primary/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <AddressPicker form={form} />

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm",
            "transition-all hover:brightness-110 disabled:opacity-50"
          )}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
          Сохранить изменения
        </button>
      </form>
    </Form>
  );
}

