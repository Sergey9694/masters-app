import { getPendingMasters } from "@/features/admin/api/get-pending-masters";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { Star, Briefcase, MessageSquare } from "lucide-react";
import { MasterModerationActions } from "@/features/admin/ui/master-moderation-actions";

export default async function AdminMasterApplicationsPage() {
  const masters = await getPendingMasters();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Заявки мастеров</h1>
        <p className="text-slate-500 mt-1">
          Ожидают верификации: {masters.length}
        </p>
      </div>

      {masters.length === 0 ? (
        <div className="bg-[#16162a] rounded-2xl border border-white/5 p-12 text-center">
          <p className="text-slate-500 font-bold">Нет ожидающих заявок</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {masters.map((m) => (
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
                  {m.categories.map((mc) => (
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
                  {m.completedTasks} завершено
                </span>
                <span className="flex items-center gap-1">
                  {m.responsesCount} откликов
                </span>
              </div>

              {/* Portfolio */}
              {m.portfolio && m.portfolio.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {m.portfolio.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Portfolio ${i + 1}`}
                      className="w-16 h-16 rounded-lg object-cover border border-white/5"
                    />
                  ))}
                </div>
              )}

              {/* Actions */}
              <MasterModerationActions 
                masterId={m.id} 
                masterName={m.user.firstName} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
