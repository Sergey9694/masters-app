import { getMetrics } from "@/features/admin/api/get-metrics";
import { TrendingUp, CheckCircle, XCircle, MessageSquare, Clock } from "lucide-react";

export default async function AdminMetricsPage() {
  const m = await getMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Метрики</h1>
        <p className="text-slate-500 mt-1">Аналитика платформы</p>
      </div>

      {/* Funnel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Всего задач"
          value={m.totalTasks}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="from-blue-600 to-indigo-600"
        />
        <MetricCard
          label="Завершено"
          value={`${m.completionRate}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          accent="from-emerald-600 to-teal-600"
          sub={`${m.completedTasks} задач`}
        />
        <MetricCard
          label="Отменено"
          value={`${m.cancelRate}%`}
          icon={<XCircle className="w-5 h-5" />}
          accent="from-red-600 to-orange-600"
          sub={`${m.canceledTasks} задач`}
        />
        <MetricCard
          label="Ср. время"
          value={m.avgHours ? `${m.avgHours}ч` : "—"}
          icon={<Clock className="w-5 h-5" />}
          accent="from-amber-600 to-yellow-600"
          sub="от создания до завершения"
        />
      </div>

      {/* Top Categories */}
      <div className="bg-[#16162a] rounded-2xl border border-white/5 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Топ категорий</h2>
        <div className="space-y-3">
          {m.topCategories.map((cat, i) => {
            const maxTasks = m.topCategories[0]._count.orders;
            const pct = maxTasks > 0 ? (cat._count.orders / maxTasks) * 100 : 0;
            return (
              <div key={cat.name} className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                <span className="text-sm font-bold text-white w-40">{cat.name}</span>
                <div className="flex-1 h-6 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 w-8 text-right">
                  {cat._count.orders}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity by Day */}
      <div className="bg-[#16162a] rounded-2xl border border-white/5 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Активность по дням недели</h2>
        <div className="flex gap-3">
          {m.activityByDay.map((d) => {
            const maxCount = Math.max(...m.activityByDay.map((x) => x.count), 1);
            const height = Math.max((d.count / maxCount) * 120, 8);
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{d.count}</span>
                <div
                  className="w-full bg-gradient-to-t from-violet-600 to-purple-500 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
                  style={{ height: `${height}px` }}
                />
                <span className="text-[10px] text-slate-600 font-bold">{d.day.slice(0, 2)}</span>
              </div>
            );
          })}
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
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#16162a] rounded-2xl border border-white/5 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <div className={`bg-gradient-to-tr ${accent} p-2 rounded-lg text-white`}>{icon}</div>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
