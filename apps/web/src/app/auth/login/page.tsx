import { Metadata } from "next";
import { LoginForm } from "../../../features/auth/ui/LoginForm";

export const metadata: Metadata = {
  title: "Вход — УслугиРядом",
  description: "Войдите в свой аккаунт УслугиРядом через Telegram, Google или Email",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="w-full max-w-[420px] z-10">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
            Услуги<span className="text-indigo-400">Рядом</span>
          </h1>
          <p className="text-slate-400 font-medium">
            Выберите удобный способ входа
          </p>
        </div>

        <LoginForm />

        <p className="mt-8 text-center text-sm text-slate-500">
          Продолжая, вы соглашаетесь с{" "}
          <a href="/docs/terms" className="text-indigo-400 hover:underline">Условиями использования</a>
        </p>
      </div>
    </div>
  );
}
