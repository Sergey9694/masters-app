"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/cn";
import { registerWithEmail } from "../model/actions";
import { TelegramLoginButton } from "./TelegramLoginButton";

interface RegisterFormProps {
  botId?: string;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ botId, onSwitchToLogin }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await registerWithEmail({ email, password, name });
    setLoading(false);
    if (res?.validationErrors) {
      toast.error("Пароль должен быть не менее 8 символов");
      return;
    }
    if (res?.serverError) {
      toast.error(res.serverError);
      return;
    }
    setDone(true);
    toast.success("Аккаунт создан! Проверьте почту для подтверждения.");
  };

  if (done) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          Письмо с подтверждением отправлено на{" "}
          <span className="font-semibold text-foreground">{email}</span>.
          Перейдите по ссылке в письме, затем войдите в аккаунт.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
        >
          Войти в аккаунт
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <TelegramLoginButton
        botId={botId}
        disabled={loading}
        label="Зарегистрироваться через Telegram"
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface px-3 text-xs uppercase tracking-widest text-muted-foreground">
            или
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Имя и фамилия">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Иван Иванов"
            required
            autoComplete="name"
            className={inputCls}
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className={inputCls}
          />
        </Field>

        <Field label="Пароль">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              className={cn(inputCls, "pr-10")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Создать аккаунт
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          {onSwitchToLogin ? (
            <button type="button" onClick={onSwitchToLogin} className="font-semibold text-primary hover:underline">
              Войти
            </button>
          ) : (
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Войти
            </Link>
          )}
        </p>
      </form>
    </div>
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

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10";
