import { getSession } from "@/shared/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import Link from "next/link";
import { LayoutDashboard, Users, Award, ClipboardList, MessageSquare, BarChart3, ArrowLeft, LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/model/actions";
import { Button } from "@/shared/ui/button";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Дашборд" },
  { href: "/admin/users", icon: Users, label: "Пользователи" },
  { href: "/admin/provider-applications", icon: Award, label: "Заявки мастеров" },
  { href: "/admin/orders", icon: ClipboardList, label: "Задачи" },
  { href: "/admin/reviews", icon: MessageSquare, label: "Отзывы" },
  { href: "/admin/metrics", icon: BarChart3, label: "Метрики" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { firstName: true, avatar: true },
  });

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#16162a]/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-sm">
              A
            </div>
            <div>
              <p className="text-sm font-bold text-white">Админ-панель</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {user?.firstName || "Админ"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Back to app */}
        <div className="p-3 border-t border-white/5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Вернуться в приложение
          </Link>
          
          <form action={logoutAction} className="mt-1">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Выйти
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
