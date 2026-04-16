import { getDashboardStats } from "@/features/admin/api/get-dashboard-stats";
import { Users, ClipboardList, Award, MessageSquare, Star, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Дашборд</h1>
        <p className="text-slate-500 mt-1">Обзор платформы</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Пользователи"
          value={stats.users.total}
          icon={<Users className="w-5 h-5" />}
          accent="from-blue-600 to-indigo-600"
          sub={`+${stats.users.today} сегодня, +${stats.users.week} за неделю`}
        />
        <MetricCard
          label="Задачи"
          value={stats.orders.open + stats.orders.inProgress + stats.orders.completed}
          icon={<ClipboardList className="w-5 h-5" />}
          accent="from-emerald-600 to-teal-600"
          sub={`${stats.orders.open} открытых · ${stats.orders.inProgress} в работе · ${stats.orders.completed} завершено`}
        />
        <MetricCard
          label="Ожидают верификации"
          value={stats.pendingMasters}
          icon={<Award className="w-5 h-5" />}
          accent="from-amber-600 to-orange-600"
          sub={`${stats.responsesToday} откликов сегодня`}
          href="/admin/provider-applications"
        />
        <MetricCard
          label="Средний рейтинг"
          value={stats.avgRating || "—"}
          icon={<Star className="w-5 h-5" />}
          accent="from-violet-600 to-purple-600"
          sub={`${stats.reviews.total} отзывов`}
        />
      </div>

      {/* Orders by day chart */}
      <div className="bg-[#16162a] rounded-2xl border border-white/5 p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Задачи за 30 дней
        </h2>
        <div className="flex items-end gap-1 h-32">
          {stats.tasksByDay.map((day: { date: string; count: number }) => {
            const maxCount = Math.max(...stats.tasksByDay.map((d: { count: number }) => d.count), 1);
            const height = Math.max((day.count / maxCount) * 100, 4);
            return (
              <div
                key={day.date}
                className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity relative group"
                style={{ height: `${height}%` }}
                title={`${day.date}: ${day.count} задач`}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {day.count}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-600">
          <span>{stats.tasksByDay[0]?.date ?? "—"}</span>
          <span>{stats.tasksByDay[stats.tasksByDay.length - 1]?.date ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
  sub: string;
  href?: string;
}) {
  const CardWrapper = href ? "a" : "div";

  return (
    <CardWrapper
      href={href}
      className="bg-[#16162a] rounded-2xl border border-white/5 p-5 block hover:border-white/10 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <div className={`bg-gradient-to-tr ${accent} p-2 rounded-lg text-white`}>{icon}</div>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </CardWrapper>
  );
}
