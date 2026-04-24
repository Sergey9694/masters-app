"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, SaveIcon } from "lucide-react";
import { z } from "zod";

import { cn } from "@/shared/lib/cn";
import { updateOrderAction } from "../api/update-order-action";
import { DadataAddressInput } from "./DadataAddressInput";

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
});

type FormValues = z.infer<typeof schema>;

interface Props {
  orderId: string;
  defaultValues: FormValues;
  categories: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

export function OrderEditFormLight({ orderId, defaultValues, categories, cities }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="Заголовок" error={errors.title?.message}>
        <input
          {...register("title")}
          placeholder="Кратко опишите задачу"
          className={inputCls(!!errors.title)}
        />
      </Field>

      <Field label="Описание" error={errors.description?.message}>
        <textarea
          {...register("description")}
          rows={5}
          placeholder="Подробности, требования, сроки..."
          className={cn(
            "w-full resize-y rounded-xl border bg-background p-3 text-sm",
            "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
            errors.description ? "border-destructive" : "border-border"
          )}
        />
      </Field>

      <Field label="Категория" error={errors.categoryId?.message}>
        <select {...register("categoryId")} className={inputCls(!!errors.categoryId)}>
          <option value="">Выберите...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Бюджет (₽)" hint="Оставьте пустым, если не определились" error={errors.budget?.message}>
        <input
          type="number"
          min={0}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
          }}
          {...register("budget")}
          placeholder="Например: 5000"
          className={inputCls(!!errors.budget)}
        />
      </Field>

      <Field label="Адрес" hint="Где нужно выполнить работу" error={errors.address?.message}>
        <Controller
          control={control}
          name="address"
          render={({ field }) => (
            <DadataAddressInput
              value={field.value ?? ""}
              onChange={field.onChange}
              onSelect={(s) => {
                const cityName = s.data.city || s.data.settlement;
                if (cityName) {
                  const matchedCity = cities.find(c => 
                    c.name.toLowerCase().includes(cityName.toLowerCase()) ||
                    cityName.toLowerCase().includes(c.name.toLowerCase())
                  );
                  if (matchedCity) {
                    setValue("cityId", matchedCity.id, { shouldValidate: true });
                    clearErrors("address");
                  } else {
                    setError("address", { 
                      type: "manual", 
                      message: `Мы пока не работаем в г. ${cityName}. Выберите другой адрес.` 
                    });
                  }
                }
              }}
              onBlur={field.onBlur}
              hasError={!!errors.address}
            />
          )}
        />
      </Field>

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
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground/80">{hint}</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-xl border bg-background px-3 text-sm",
    "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
    hasError ? "border-destructive" : "border-border"
  );
}
