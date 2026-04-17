"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ShieldCheck, ChevronRight, Lock, UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent } from "@/shared/ui/card";
import { toast } from "sonner";
import { registerWithEmail, requestPasswordReset } from "../model/actions";

/**
 * Переиспользуемый компонент поля ввода для авторизации
 */
function AuthField({ 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = true 
}: {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-xs font-black uppercase tracking-widest text-indigo-300 opacity-60 ml-1">
        {label}
      </label>
      <Input
        type={type}
        placeholder={placeholder}
        className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-indigo-500/50 transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

/**
 * Основная кнопка действия (Submit)
 */
function AuthSubmitButton({ 
  loading, 
  children, 
  disabled 
}: { 
  loading: boolean; 
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      type="submit"
      variant="premium"
      size="lg"
      className="w-full h-14 rounded-2xl group transition-all active:scale-[0.98]"
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <>
          {children}
          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </Button>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<"social" | "email" | "register" | "forgot-password">("social");
  const [loading, setLoading] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleSocialLogin = async (provider: string) => {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (err) {
      toast.error("Ошибка при входе через " + provider);
      setLoading(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(mode);
    
    if (mode === "register") {
      const regRes = await registerWithEmail({ email, password, name });
      
      if (regRes?.validationErrors) {
        toast.error("Ошибка валидации: Пароль должен быть от 8 символов");
        setLoading(null);
        return;
      }
      
      if (regRes?.serverError) {
        toast.error(regRes.serverError);
        setLoading(null);
        return;
      }

      if (!regRes?.data?.success) {
        toast.error("Не удалось создать аккаунт");
        setLoading(null);
        return;
      }

      toast.success(regRes.data.message || "Аккаунт создан! Проверьте почту для подтверждения.");
      setLoading(null);
      setMode("email"); // Переключаем на вход, чтобы пользователь мог войти после подтверждения
      return;
    }

    const res = await signIn("email", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard"
    });

    if (res?.error) {
      // Пытаемся показать конкретную ошибку (например, "Email не подтвержден")
      const errorMsg = res.error === "CredentialsSignin" 
        ? "Неверный email или пароль" 
        : res.error;
      toast.error(errorMsg);
      setLoading(null);
    } else if (res && !res.error) {
      toast.success("Вход выполнен!");
      window.location.href = "/dashboard";
    } else {
      toast.error("Произошла неизвестная ошибка при входе");
      setLoading(null);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Введите email");
      return;
    }
    setLoading("reset");
    const result = await requestPasswordReset({ email });
    setLoading(null);
    if (result?.data?.success) {
      setResetSent(true);
      toast.success("Ссылка для сброса отправлена (проверьте логи)");
    }
  };

  const isDev = process.env.NODE_ENV === "development";

  return (
    <Card className="glass-premium border-white/10 shadow-2xl overflow-hidden rounded-[32px] w-full max-w-[440px]">
      <motion.div
        animate={{ height: "auto" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-visible"
      >
        <CardContent className="p-8 pb-6">
          <AnimatePresence mode="wait">
            {mode === "social" ? (
              <motion.div
                key="social"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-2xl font-black text-white tracking-tight">Добро пожаловать</h2>
                  <p className="text-sm text-slate-400">Выберите способ входа в систему</p>
                </div>

                <Button
                  variant="premium"
                  size="lg"
                  className="w-full h-14 rounded-2xl gap-3"
                  onClick={() => setMode("email")}
                  disabled={!!loading}
                >
                  <Mail className="w-5 h-5" />
                  Продолжить через Email
                </Button>

                {isDev && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 text-slate-500 hover:text-indigo-400 gap-2"
                    onClick={() => handleSocialLogin("mock-admin")}
                    disabled={!!loading}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Вход как Админ (Dev)
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="relative flex items-center justify-center pb-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setMode(mode === "forgot-password" ? "email" : "social")} 
                      className="absolute left-0 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                      {mode === 'email' ? 'Вход' : mode === 'register' ? 'Регистрация' : 'Сброс пароля'}
                    </h2>
                </div>

                {mode === 'forgot-password' ? (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <p className="text-sm text-slate-400 text-center max-w-[280px] mx-auto leading-relaxed">
                      Введите ваш email, и мы отправим ссылку для восстановления доступа.
                    </p>
                    
                    <AuthField
                      label="Ваш Email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={setEmail}
                    />
                    
                    <AuthSubmitButton loading={loading === 'reset'}>
                      Отправить ссылку
                    </AuthSubmitButton>
                  </form>
                ) : (
                  <form onSubmit={handleEmailLogin} className="space-y-5">
                    {mode === 'register' && (
                      <AuthField 
                        label="Как вас зовут?"
                        placeholder="Имя Фамилия"
                        value={name}
                        onChange={setName}
                      />
                    )}
                    <AuthField 
                      label="Email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={setEmail}
                    />
                    <AuthField 
                      label="Пароль"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={setPassword}
                    />
                    
                    {mode === 'email' && (
                      <div className="flex justify-end">
                        <button 
                          type="button"
                          onClick={() => setMode("forgot-password")}
                          className="text-xs text-indigo-400 hover:text-white transition-colors font-medium"
                          disabled={!!loading}
                        >
                          Забыли пароль?
                        </button>
                      </div>
                    )}

                    <div className="pt-2">
                      <AuthSubmitButton loading={loading === 'email' || loading === 'register'}>
                        {mode === 'email' ? 'Войти в аккаунт' : 'Создать аккаунт'}
                      </AuthSubmitButton>
                    </div>
                  </form>
                )}

              {mode !== 'forgot-password' && (
                <div className="text-center">
                  <button 
                    onClick={() => setMode(mode === 'email' ? 'register' : 'email')}
                    className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2 group"
                  >
                    {mode === 'email' ? (
                      <>
                        <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Еще нет аккаунта? <span className="text-indigo-400 group-hover:underline">Зарегистрироваться</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Уже есть аккаунт? <span className="text-indigo-400 group-hover:underline">Войти</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </motion.div>
    </Card>
  );
}
