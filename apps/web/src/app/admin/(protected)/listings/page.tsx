export const dynamic = "force-dynamic";

import { getAllListings } from "@/features/admin/api/get-all-listings";
import { ListingStatus } from "@prisma/client";
import { ListingModerationActions } from "@/features/admin/ui/ListingModerationActions";
import { Pagination } from "@/shared/ui/custom/pagination";

const statusLabels: Record<ListingStatus, string> = {
  ACTIVE: "Активно",
  PAUSED: "Приостановлено",
  ARCHIVED: "Архив",
  MODERATION: "На модерации",
  REJECTED: "Отклонено",
};

const statusColors: Record<ListingStatus, string> = {
  ACTIVE: "bg-emerald-700/50 text-emerald-300",
  PAUSED: "bg-slate-700/50 text-slate-300",
  ARCHIVED: "bg-slate-700/50 text-slate-400",
  MODERATION: "bg-amber-700/50 text-amber-300",
  REJECTED: "bg-red-700/50 text-red-300",
};

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status as ListingStatus | undefined) || undefined;
  const search = params.search || "";
  const page = Number(params.page) || 1;

  const data = await getAllListings({ page, status, search });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Объявления</h1>
        <p className="text-slate-500 mt-1">Всего: {data.total}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {([undefined, "MODERATION", "ACTIVE", "PAUSED", "REJECTED", "ARCHIVED"] as const).map((s) => (
          <a
            key={s ?? "all"}
            href={`/admin/listings${s ? `?status=${s}` : ""}${search ? `${s ? "&" : "?"}search=${search}` : ""}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              status === s
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {s ? statusLabels[s] : "Все"}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#16162a] rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-left p-4 font-bold">Объявление</th>
              <th className="text-left p-4 font-bold">Категория</th>
              <th className="text-left p-4 font-bold">Город</th>
              <th className="text-left p-4 font-bold">Статус</th>
              <th className="text-left p-4 font-bold">Дата</th>
              <th className="text-left p-4 font-bold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {data.listings.map((listing) => (
              <tr key={listing.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <p className="font-bold text-white truncate max-w-[250px]">{listing.title}</p>
                  <p className="text-xs text-slate-500">{listing.provider.user.firstName}</p>
                </td>
                <td className="p-4 text-slate-400">{listing.category.name}</td>
                <td className="p-4 text-slate-400">{listing.city.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusColors[listing.status as ListingStatus] || ""}`}>
                    {statusLabels[listing.status as ListingStatus] || listing.status}
                  </span>
                </td>
                <td className="p-4 text-slate-500 text-xs">
                  {new Date(listing.createdAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="p-4">
                  <ListingModerationActions listingId={listing.id} status={listing.status as ListingStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.listings.length === 0 && (
          <p className="p-8 text-center text-slate-500 text-sm">Объявления не найдены</p>
        )}
      </div>

      <Pagination totalPages={data.totalPages} currentPage={page} />
    </div>
  );
}
