import { getCurrentUser } from "@/shared/lib/get-user";
import { redirect } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Hammer, Bell, MapPin, Search, PlusCircle } from "lucide-react";
import { CategoryGrid } from "@/widgets/CategoryGrid";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 pb-24">
      {/* Header Widget (Soon to be moved to widgets/) */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none mb-1">
            Привет, {user.firstName}!
          </h1>
          <div className="flex items-center gap-1.5 text-blue-600">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Марьино-Южное</span>
          </div>
        </div>
        <div className="relative">
          <Button variant="outline" size="icon" className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900 active:scale-95 transition-transform">
            <Bell className="w-5 h-5 text-slate-600" />
          </Button>
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-slate-50 dark:border-slate-950 rounded-full" />
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <Card className="p-5 border-none shadow-sm bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center group active:scale-95 transition-transform">
           <div className="text-3xl font-black text-blue-600 mb-1 leading-none">0</div>
           <div className="text-[10px] uppercase text-slate-400 font-extrabold tracking-tighter">Активных задач</div>
        </Card>
        <Card className="p-5 border-none shadow-sm bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center group active:scale-95 transition-transform">
           <div className="text-3xl font-black text-amber-500 mb-1 leading-none">5.0</div>
           <div className="text-[10px] uppercase text-slate-400 font-extrabold tracking-tighter">Ваш рейтинг</div>
        </Card>
      </div>

      {/* Dashboard Feature Blocks */}
      <div className="space-y-10">
        
        {/* Widget: Service Selection */}
        <CategoryGrid />

        {/* Action Cards (Main Operations) */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 px-1 flex items-center gap-2">
            Быстрые действия
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </h2>
          
          <ActionCard 
            title="Найти мастера" 
            desc="Поиск специалистов в каталоге" 
            icon={<Search className="w-6 h-6" />}
            color="bg-indigo-600"
          />

          <ActionCard 
            title="Озвучить проблему" 
            desc="Создайте тендер и ждите откликов" 
            icon={<PlusCircle className="w-6 h-6" />}
            color="bg-blue-600"
          />

          {!user.masterProfile && (
             <div className="pt-2">
                <ActionCard 
                  title="Стать мастером" 
                  desc="Начните помогать своим соседям" 
                  icon={<Hammer className="w-6 h-6" />}
                  color="bg-emerald-600"
                />
             </div>
          )}
        </div>
      </div>

      {/* Floating Navigation */}
      <div className="fixed bottom-6 left-4 right-4 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex items-center justify-around px-4 z-50">
          <Button variant="ghost" size="icon" className="text-blue-600"><Hammer className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon" className="text-slate-400"><Search className="w-6 h-6" /></Button>
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center -mt-12 shadow-lg shadow-blue-500/40 text-white cursor-pointer active:scale-90 transition-transform">
              <PlusCircle className="w-8 h-8" />
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400"><Bell className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon" className="text-slate-400"><MapPin className="w-6 h-6" /></Button>
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon, color }: { title: string, desc: string, icon: React.ReactNode, color: string }) {
  return (
    <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 flex items-center gap-5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group active:scale-[0.98]">
      <div className={`${color} p-4 rounded-[20px] text-white shadow-lg shadow-${color.split('-')[1]}-500/20 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-black text-slate-900 dark:text-white uppercase text-[11px] tracking-widest mb-0.5 leading-none">{title}</h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{desc}</p>
      </div>
    </Card>
  );
}

