import { getAllTasks } from "@/features/admin/api/get-all-orders";
import { OrderStatus } from "@prisma/client";
import { TaskModerationActions } from "@/features/admin/ui/order-moderation-actions";
import { AdminTaskFilters } from "@/features/admin/ui/admin-order-filters";
import { Pagination } from "@/shared/ui/custom/pagination";

const statusLabels: Record<OrderStatus, string> = {
  OPEN: "Открыта",
  IN_PROGRESS: "В работе",
  COMPLETED: "Завершена",
  CANCELED: "Отменена",
  EXPIRED: "Истекла",
};

const statusColors: Record<OrderStatus, string> = {
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
  const status = (params.status as OrderStatus | undefined) || undefined;
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
      <AdminTaskFilters 
        initialSearch={search} 
        initialStatus={status} 
        statusLabels={statusLabels} 
      />

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
            {data.orders.map((order) => (
              <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <p className="font-bold text-white truncate max-w-[250px]">{order.title}</p>
                  <p className="text-xs text-slate-500">{order.client.firstName}</p>
                </td>
                <td className="p-4 text-slate-400">{order.category.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{order._count.proposals}</td>
                <td className="p-4 text-slate-500 text-xs">
                  {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="p-4">
                  <TaskModerationActions orderId={order.id} status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination totalPages={data.totalPages} currentPage={page} />
    </div>
  );
}
