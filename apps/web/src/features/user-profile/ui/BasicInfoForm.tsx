"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import {
  updateBasicProfileSchema,
  type UpdateBasicProfileInput,
} from "../model/schema";
import { updateBasicProfileAction } from "../api/actions";
import { PhoneInput } from "@/shared/ui/phone-input";
import { Controller } from "react-hook-form";
import { formatPhoneNumber } from "@/shared/lib/phone";


interface Option {
  id: string;
  name: string;
}

interface BasicInfoFormProps {
  defaultValues: UpdateBasicProfileInput;
  cities: Option[];
}

export function BasicInfoForm({ defaultValues, cities }: BasicInfoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateBasicProfileInput>({
    resolver: zodResolver(updateBasicProfileSchema),
    defaultValues: {
      ...defaultValues,
      phone: defaultValues.phone ? formatPhoneNumber(defaultValues.phone) : "",
    },
  });


  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = form;

  const onSubmit = (vals: UpdateBasicProfileInput) => {
    startTransition(async () => {
      const res = await updateBasicProfileAction(vals);
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success("Профиль обновлён");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Имя" error={errors.firstName?.message}>
          <input
            type="text"
            {...register("firstName")}
            className={inputCls(!!errors.firstName)}
          />
        </Field>

        <Field label="Фамилия" error={errors.lastName?.message}>
          <input
            type="text"
            {...register("lastName")}
            className={inputCls(!!errors.lastName)}
          />
        </Field>
      </div>

      <Field
        label="Отображаемое имя"
        hint="Как вас будут видеть другие пользователи"
        error={errors.displayName?.message}
      >
        <input
          type="text"
          {...register("displayName")}
          className={inputCls(!!errors.displayName)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Телефон" error={errors.phone?.message}>
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <PhoneInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isPending}
                hasError={!!errors.phone}
                placeholder="+7 (900) 000-00-00"
              />
            )}
          />
        </Field>


        <Field label="Город" error={errors.cityId?.message}>
          <select
            {...register("cityId")}
            className={inputCls(!!errors.cityId)}
          >
            <option value="">Выберите город</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm",
            "transition-all hover:brightness-110 disabled:opacity-50"
          )}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Сохранить
        </button>
      </div>
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
      {hint && !error && (
        <span className="text-xs text-muted-foreground/80">{hint}</span>
      )}
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
