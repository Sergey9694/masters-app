import { TelegramAuth } from "@/features/auth/ui/TelegramAuth";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ShieldCheck, MapPin, Users, Hammer } from "lucide-react";
import Link from "next/link";
import { mockLogin } from "@/features/auth/model/actions";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      {/* Автоматический вход через Telegram */}
      <TelegramAuth />

      {/* Эффект свечения на фоне */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-md mx-auto px-6 py-16 flex flex-col items-center text-center pt-24">
        {/* Анимированная иконка */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 animate-pulse" />
          <div className="relative p-5 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/40 transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <Hammer className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
          Районный <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 font-black">
            Мастер
          </span>
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-[280px]">
          Лучшие специалисты района в 15 минутах от вашей двери.
        </p>

        {/* Сетка преимуществ */}
        <div className="grid gap-4 w-full mb-12 text-left">
          <FeatureCard 
            icon={<MapPin className="w-5 h-5 text-blue-500" />}
            title="Только рядом"
            desc="Мастера в радиусе 15 минут езды. Минимум времени на ожидание."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
            title="Проверено соседями"
            desc="Ручная верификация документов и честный рейтинг."
          />
          <FeatureCard 
            icon={<Users className="w-5 h-5 text-violet-500" />}
            title="Свои люди"
            desc="Поддержите местных профи и забудьте о рисках с улицы."
          />
        </div>

        {/* Кнопка действия */}
        <div className="w-full space-y-6">
          <Button asChild size="lg" className="w-full text-lg h-16 rounded-2xl shadow-xl shadow-blue-600/30 bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98] font-bold">
             <Link href="https://t.me/your_bot_name">Запустить Сервис</Link>
          </Button>

          {process.env.NODE_ENV === "development" && (
            <form action={mockLogin}>
              <Button variant="ghost" className="w-full text-slate-400 text-xs hover:text-blue-500 transition-colors">
                 Войти как Тестовый Админ (Dev Only)
              </Button>
            </form>
          )}
          
          <div className="flex items-center justify-center gap-2 text-slate-400">
             <div className="h-px w-8 bg-slate-200" />
             <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Telegram Web App</span>
             <div className="h-px w-8 bg-slate-200" />
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <Card className="p-4 border-none shadow-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl flex gap-4 items-start border border-white/20 dark:border-slate-800 transition-all hover:translate-x-1 duration-300 group">
      <div className="p-2.5 bg-blue-50 dark:bg-slate-700 rounded-xl shadow-inner group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug">{desc}</p>
      </div>
    </Card>
  );
}
