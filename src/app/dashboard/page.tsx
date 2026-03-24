import { getCurrentUser } from "@/shared/lib/get-user";
import { redirect } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Hammer, Bell, MapPin, Search, PlusCircle } from "lucide-react";
import { CategoryGrid } from "@/widgets/CategoryGrid/index";
import { db } from "@/shared/lib/db";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  // Fetch categories for the widget (RSC data loading)
  const categories = await db.category.findMany({

    orderBy: { name: 'asc' }
  });


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
        <CategoryGrid initialCategories={categories} />

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

      {/* Floating Navigation (2026 Signature Style) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[32px] border border-white/20 dark:border-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] flex items-center justify-around px-2 z-50">
          <NavItem icon={<Hammer className="w-6 h-6" />} active />
          <NavItem icon={<Search className="w-6 h-6" />} />
          
          <div className="relative -mt-12 group">
              <div className="absolute inset-x-0 bottom-[-10px] h-8 bg-blue-600/40 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/40 text-white cursor-pointer hover:scale-105 active:scale-90 transition-all border-4 border-slate-50 dark:border-slate-950 relative z-10">
                  <PlusCircle className="w-10 h-10" />
              </div>
          </div>

          <NavItem icon={<Bell className="w-6 h-6" />} />
          <NavItem icon={<MapPin className="w-6 h-6" />} />
      </div>
    </div>
  );
}

function NavItem({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) {
  return (
    <div className={`p-3 rounded-2xl transition-all cursor-pointer ${active ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}>
      {icon}
    </div>
  );
}

function ActionCard({ title, desc, icon, color }: { title: string, desc: string, icon: React.ReactNode, color: string }) {
  return (
    <Card className="p-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none bg-white dark:bg-slate-900 flex items-center gap-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group active:scale-[0.98] rounded-[28px]">
      <div className={`${color} p-4 rounded-[22px] text-white shadow-xl shadow-blue-500/10 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-[0.15em] mb-1 leading-none">{title}</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">{desc}</p>
      </div>
    </Card>
  );
}


