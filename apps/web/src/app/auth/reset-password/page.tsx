"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { resetPasswordAction } from "@/features/auth/model/actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <StatusCard title="Ошибка" message="Токен отсутствует или невалиден." />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <StatusCard 
          title="Пароль изменен!" 
          message="Ваш пароль был успешно обновлен. Теперь вы можете войти с новым паролем."
          icon={<CheckCircle2 className="w-12 h-12 text-green-400" />}
          showLogin
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Пароли не совпадают");
      return;
    }
    if (password.length < 8) {
      toast.error("Пароль должен быть не менее 8 символов");
      return;
    }

    setLoading(true);
    const result = await resetPasswordAction({ token, password });
    setLoading(false);

    if (result?.serverError || result?.validationErrors) {
      toast.error(result?.serverError || "Ошибка при смене пароля");
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass-premium border-white/10 shadow-2xl max-w-md w-full p-6 rounded-[32px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><Lock className="w-12 h-12 text-indigo-400" /></div>
          <CardTitle className="text-2xl font-bold text-white">Новый пароль</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-indigo-300 opacity-60 ml-1">Подтверждение</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="h-12 bg-white/5 border-white/10 rounded-xl"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              variant="premium" 
              size="lg" 
              className="w-full h-14 rounded-2xl"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Сбросить пароль"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusCard({ title, message, icon, showLogin }: { title: string; message: string; icon?: React.ReactNode; showLogin?: boolean }) {
  return (
    <Card className="glass-premium border-white/10 shadow-2xl max-w-md w-full text-center p-8 rounded-[32px]">
      <div className="flex justify-center mb-4">{icon || <Lock className="w-12 h-12 text-slate-500" />}</div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 mb-6">{message}</p>
      <Button asChild variant="premium" className="w-full h-12 rounded-xl">
        <Link href={showLogin ? "/auth/login" : "/"}>
          {showLogin ? "Перейти к входу" : "На главную"}
        </Link>
      </Button>
    </Card>
  );
}
