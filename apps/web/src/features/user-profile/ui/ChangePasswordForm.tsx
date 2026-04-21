"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "../model/schema";
import { changePasswordAction } from "../api/actions";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (vals: ChangePasswordInput) => {
    startTransition(async () => {
      const res = await changePasswordAction(vals);
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success("Пароль обновлён");
      reset();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="Текущий пароль" error={errors.currentPassword?.message}>
        <input
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
          className={inputCls(!!errors.currentPassword)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Новый пароль"
          hint="Минимум 8 символов"
          error={errors.newPassword?.message}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...register("newPassword")}
            className={inputCls(!!errors.newPassword)}
          />
        </Field>

        <Field
          label="Повторите пароль"
          error={errors.confirmPassword?.message}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className={inputCls(!!errors.confirmPassword)}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm",
            "transition-all hover:brightness-110 disabled:opacity-50"
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          Сменить пароль
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
