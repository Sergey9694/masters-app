"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { transition } from "@/shared/lib/motion";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  Mail,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/cn";
import { requestPasswordReset } from "../model/actions";
import { TelegramLoginButton } from "./TelegramLoginButton";

type Mode = "social" | "email" | "forgot-password";
const MODE_ORDER: Mode[] = ["social", "email", "forgot-password"];

interface LoginFormProps {
  botId?: string;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ botId, onSwitchToRegister }: LoginFormProps) {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "1";
  const errorParam = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("social");
  const dirRef = useRef(1);
  const switchMode = (next: Mode) => {
    dirRef.current = MODE_ORDER.indexOf(next) >= MODE_ORDER.indexOf(mode) ? 1 : -1;
    setMode(next);
  };
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (errorParam === "CredentialsSignin") {
      toast.error("Неверный email или пароль");
    }
  }, [errorParam]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("email", {
      email,
      password,
      redirect: false,
      callbackUrl: "/orders",
    });

    setLoading(false);

    if (res?.error) {
      toast.error(
        res.error === "CredentialsSignin" ? "Неверный email или пароль" : res.error
      );
    } else if (res && !res.error) {
      window.location.href = res.url ?? "/orders";
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Введите email"); return; }
    setLoading(true);
    const res = await requestPasswordReset({ email });
    setLoading(false);
    if (res?.serverError) { toast.error(res.serverError); return; }
    if (res?.data?.success) {
      setResetSent(true);
      toast.success("Ссылка для сброса отправлена — проверьте почту");
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {verified && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
          <CheckCircle2 className="size-5 shrink-0 text-success" />
          <p className="text-sm font-medium text-success">
            Email подтверждён — теперь войдите в аккаунт
          </p>
        </div>
      )}

      <div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: dirRef.current * 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dirRef.current * -10 }}
            transition={transition.base}
          >
            {/* Mode: social */}
            {mode === "social" && (
              <div className="flex flex-col gap-3">
                <TelegramLoginButton botId={botId} disabled={loading} />

                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-surface px-3 text-xs uppercase tracking-widest text-muted-foreground">
                      или
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => switchMode("email")}
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background text-sm font-semibold transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-50"
                >
                  <Mail className="size-4" />
                  Войти через Email
                </button>

                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Нет аккаунта?{" "}
                  {onSwitchToRegister ? (
                    <button type="button" onClick={onSwitchToRegister} className="font-semibold text-primary hover:underline">
                      Зарегистрироваться
                    </button>
                  ) : (
                    <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                      Зарегистрироваться
                    </Link>
                  )}
                </p>
              </div>
            )}

            {/* Mode: email login */}
            {mode === "email" && (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => switchMode("social")}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  Назад
                </button>

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
                      autoComplete="current-password"
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

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot-password")}
                    className="text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    Забыли пароль?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Войти
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Нет аккаунта?{" "}
                  <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                    Зарегистрироваться
                  </Link>
                </p>
              </form>
            )}

            {/* Mode: forgot password */}
            {mode === "forgot-password" && (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => switchMode("email")}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  Назад
                </button>

                <p className="text-sm text-muted-foreground">
                  Введите email — пришлём ссылку для восстановления пароля.
                </p>

                {resetSent ? (
                  <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
                    <CheckCircle2 className="size-5 shrink-0 text-success" />
                    <p className="text-sm font-medium text-success">
                      Письмо отправлено — проверьте почту
                    </p>
                  </div>
                ) : (
                  <>
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

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
                    >
                      {loading && <Loader2 className="size-4 animate-spin" />}
                      Отправить ссылку
                    </button>
                  </>
                )}
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
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
