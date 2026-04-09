import { getAllTasks } from "@/features/admin/api/get-all-tasks";
import { hideTask, deleteTask } from "@/features/admin/api/moderate-task";
import { TaskStatus } from "@prisma/client";
import { Eye, Trash2 } from "lucide-react";

const statusLabels: Record<TaskStatus, string> = {
  OPEN: "Открыта",
  IN_PROGRESS: "В работе",
  COMPLETED: "Завершена",
  CANCELED: "Отменена",
  EXPIRED: "Истекла",
};

const statusColors: Record<TaskStatus, string> = {
  OPEN: "bg-emerald-700/50 text-emerald-300",
  IN_PROGRESS: "bg-blue-700/50 text-blue-300",
  COMPLETED: "bg-slate-700/50 text-slate-300",
  CANCELED: "bg-red-700/50 text-red-300",
  EXPIRED: "bg-amber-700/50 text-amber-300",
};

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status as TaskStatus | undefined) || undefined;
  const search = params.search || "";
  const page = Number(params.page) || 1;

  const data = await getAllTasks({ page, status, search });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Задачи</h1>
        <p className="text-slate-500 mt-1">Всего: {data.total}</p>
      </div>

      {/* Filters */}
      <form className="flex gap-3" method="get">
        <input
          name="search"
          defaultValue={search}
          placeholder="Поиск..."
          className="flex-1 bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
        />
        <select
          name="status"
          defaultValue={status || ""}
          className="bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
        >
          <option value="">Все статусы</option>
          {Object.entries(statusLabels).map(([key, val]) => (
            <option key={key} value={key}>{val}</option>
          ))}
        </select>
      </form>

      {/* Table */}
      <div className="bg-[#16162a] rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-left p-4 font-bold">Задача</th>
              <th className="text-left p-4 font-bold">Категория</th>
              <th className="text-left p-4 font-bold">Статус</th>
              <th className="text-left p-4 font-bold">Отклики</th>
              <th className="text-left p-4 font-bold">Дата</th>
              <th className="text-left p-4 font-bold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {data.tasks.map((task) => (
              <tr key={task.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <p className="font-bold text-white truncate max-w-[250px]">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.customer.firstName}</p>
                </td>
                <td className="p-4 text-slate-400">{task.category.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusColors[task.status]}`}>
                    {statusLabels[task.status]}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{task._count.responses}</td>
                <td className="p-4 text-slate-500 text-xs">
                  {new Date(task.createdAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <form action={async () => { "use server"; await hideTask(task.id); }}>
                      <button type="submit" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-amber-400 transition-colors" title="Скрыть">
                        <Eye className="w-4 h-4" />
                      </button>
                    </form>
                    <form action={async () => { "use server"; await deleteTask(task.id); }}>
                      <button type="submit" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors" title="Удалить">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "bg-[#1a1a2e] text-slate-500 hover:text-white"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
