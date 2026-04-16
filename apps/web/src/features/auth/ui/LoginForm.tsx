"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Github, Loader2, ShieldCheck, ChevronRight, Lock, UserPlus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent } from "@/shared/ui/card";
import { toast } from "sonner";
import { registerWithEmail } from "../model/actions";

export function LoginForm() {
  const [mode, setMode] = useState<"social" | "email" | "register">("social");
  const [loading, setLoading] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

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
      if (regRes?.serverError) {
        toast.error(regRes.serverError);
        setLoading(null);
        return;
      }
      toast.success("Аккаунт создан! Входим...");
    }

    const res = await signIn("email", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard"
    });

    if (res?.error) {
      toast.error("Неверный email или пароль");
      setLoading(null);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const isDev = process.env.NODE_ENV === "development";

  return (
    <Card className="glass-premium border-white/10 shadow-2xl overflow-hidden rounded-[32px]">
      <CardContent className="p-8">
        <AnimatePresence mode="wait">
          {mode === "social" ? (
            <motion.div
              key="social"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-white gap-3 group"
                onClick={() => handleSocialLogin("google")}
                disabled={!!loading}
              >
                {loading === "google" ? <Loader2 className="animate-spin" /> : (
                   <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                     <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                     <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                     <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                     <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                   </svg>
                )}
                Войти через Google
              </Button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f172a] px-2 text-slate-500 font-bold tracking-widest">ИЛИ</span></div>
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
                  className="w-full mt-4 text-slate-500 hover:text-indigo-400 gap-2"
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
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2">
                 <Button variant="ghost" size="sm" onClick={() => setMode("social")} className="p-0 h-auto hover:bg-transparent text-slate-400 hover:text-white">
                    Назад
                 </Button>
                 <span className="text-slate-600">/</span>
                 <span className="text-white font-bold">{mode === 'email' ? 'Вход по почте' : 'Регистрация'}</span>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-indigo-300 opacity-60 ml-1">Как вас зовут?</label>
                    <Input 
                      placeholder="Имя Фамилия" 
                      className="h-12 bg-white/5 border-white/10 rounded-xl"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-indigo-300 opacity-60 ml-1">Email</label>
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    className="h-12 bg-white/5 border-white/10 rounded-xl"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-indigo-300 opacity-60 ml-1">Пароль</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="h-12 bg-white/5 border-white/10 rounded-xl"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="premium" 
                  size="lg" 
                  className="w-full h-14 rounded-2xl group"
                  disabled={!!loading}
                >
                  {loading === 'email' ? <Loader2 className="animate-spin" /> : (
                    <>
                      {mode === 'email' ? 'Войти' : 'Создать аккаунт'}
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                 <button 
                   onClick={() => setMode(mode === 'email' ? 'register' : 'email')}
                   className="text-sm text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-2"
                 >
                   {mode === 'email' ? (
                     <>
                       <UserPlus className="w-4 h-4" />
                       Еще нет аккаунта? Зарегистрироваться
                     </>
                   ) : (
                     <>
                       <Lock className="w-4 h-4" />
                       Уже есть аккаунт? Войти
                     </>
                   )}
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
