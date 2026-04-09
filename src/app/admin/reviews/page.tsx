import { getAllReviews } from "@/features/admin/api/get-all-reviews";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { Star } from "lucide-react";
import { ReviewModerationActions } from "@/features/admin/ui/review-moderation-actions";
import { Pagination } from "@/shared/ui/custom/pagination";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const data = await getAllReviews({ page });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Отзывы</h1>
        <p className="text-slate-500 mt-1">Всего: {data.total}</p>
      </div>

      <div className="space-y-3">
        {data.reviews.map((review) => (
          <div
            key={review.id}
            className="bg-[#16162a] rounded-2xl border border-white/5 p-5 flex gap-4"
          >
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={review.author.avatar || ""} />
              <AvatarFallback className="text-xs font-bold bg-slate-800 text-slate-400">
                {review.author.firstName[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {review.author.firstName}
                  </span>
                  <span className="text-slate-600">→</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {review.master.user.firstName}
                  </span>
                  <div className="flex items-center gap-0.5 ml-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <ReviewModerationActions 
                  reviewId={review.id} 
                  authorName={review.author.firstName} 
                />
              </div>

              {review.text && (
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {review.text}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                <span className="truncate max-w-[200px]">{review.task.title}</span>
                <span>·</span>
                <span>{new Date(review.createdAt).toLocaleDateString("ru-RU")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination totalPages={data.totalPages} currentPage={page} />
    </div>
  );
}
