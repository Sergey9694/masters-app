"use client";

import { adminLogin } from "@/features/admin/api/admin-login";
import { useActionState } from "react";
import { ShieldCheck, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [state, formAction] = useActionState(adminLogin, null);

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Админ-панель</h1>
          <p className="text-sm text-slate-500 mt-1">Войдите для продолжения</p>
        </div>

        {/* Form */}
        <form action={formAction} className="bg-[#16162a] rounded-2xl border border-white/5 p-6 space-y-4">
          {state?.error && (
            <div className="bg-red-600/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 font-bold">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Логин
            </label>
            <input
              name="username"
              type="text"
              autoComplete="username"
              placeholder="admin"
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Пароль
            </label>
            <div className="relative">
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-600 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98]"
          >
            Войти
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          Только для авторизованных администраторов
        </p>
      </div>
    </div>
  );
}
