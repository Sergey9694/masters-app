import { getPendingProviders } from "@/features/admin/api/get-pending-providers";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { Star, Briefcase, MessageSquare } from "lucide-react";
import { ProviderModerationActions } from "@/features/admin/ui/ProviderModerationActions";
import { Pagination } from "@/shared/ui/custom/pagination";

export default async function AdminProviderApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { providers, total, totalPages } = await getPendingProviders({ page });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Заявки исполнителей</h1>
        <p className="text-slate-500 mt-1">
          Ожидают верификации: {total}
        </p>
      </div>

      {providers.length === 0 ? (
        <div className="bg-[#16162a] rounded-2xl border border-white/5 p-12 text-center">
          <p className="text-slate-500 font-bold">Нет ожидающих заявок</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {providers.map((m) => (
              <div
                key={m.id}
                className="bg-[#16162a] rounded-2xl border border-white/5 p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={m.user.avatar || ""} />
                    <AvatarFallback className="font-bold bg-slate-800 text-slate-400">
                      {m.user.firstName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-white">
                      {m.user.firstName} {m.user.lastName || ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      Регистрация: {new Date(m.user.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                {m.bio && (
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                    {m.bio}
                  </p>
                )}

                {/* Categories */}
                {m.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.categories.map((mc: any) => (
                      <span
                        key={mc.categoryId}
                        className="px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-400 text-xs font-bold"
                      >
                        {mc.category.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    {m.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {m.reviewsCount} отзывов
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {m.completedOrders} завершено
                  </span>
                  <span className="flex items-center gap-1">
                    {m.proposalsCount} откликов
                  </span>
                </div>

                {/* Portfolio */}
                {m.portfolio && m.portfolio.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {m.portfolio.map((url: string, i: number) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Portfolio ${i + 1}`}
                        className="w-16 h-16 rounded-lg object-cover border border-white/5 flex-shrink-0"
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <ProviderModerationActions 
                  providerId={m.id} 
                  providerName={m.user.firstName} 
                />
              </div>
            ))}
          </div>

          <Pagination totalPages={totalPages} currentPage={page} />
        </>
      )}
    </div>
  );
}
