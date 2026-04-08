import { redirect } from "next/navigation";
import { Star, MessageSquare, Briefcase, Calendar } from "lucide-react";
import { formatSmartDate } from "@/shared/lib/date";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { Card } from "@/shared/ui/card";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { PageHeader } from "@/shared/ui/page-header";

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user || !user.masterProfile) redirect("/dashboard");

  const reviews = await db.review.findMany({
    where: { masterId: user.masterProfile.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        }
      },
      task: {
        select: {
          title: true,
        }
      }
    }
  });

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />
      
      <PageHeader 
        title="Мои отзывы" 
        subtitle={reviews.length > 0 ? `${reviews.length} ${getReviewsWord(reviews.length)}` : "У вас пока нет отзывов"}
      />

      {reviews.length === 0 ? (
        <StaggerItem>
          <div className="glass border border-dashed border-white/10 p-12 rounded-[32px] text-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-400">
              Вы ещё не получили ни одного отзыва. <br />
              Завершайте заказы качественно, чтобы клиенты оставляли оценки!
            </p>
          </div>
        </StaggerItem>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <StaggerItem key={review.id}>
              <Card className="glass border-none p-5 rounded-[24px]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      {review.author.avatar ? (
                        <img 
                          src={review.author.avatar} 
                          alt={review.author.firstName} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-black text-indigo-400 uppercase">
                          {review.author.firstName[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {review.author.firstName} {review.author.lastName}
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatSmartDate(review.createdAt)}
                  </span>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/5">
                  <p className="text-[13px] text-slate-300 leading-relaxed font-medium">
                    «{review.text || "Без комментария"}»
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-900/40 px-3 py-2 rounded-xl w-fit">
                  <Briefcase className="w-3 h-3 text-emerald-500" />
                  <span>Заказ: {review.task.title}</span>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </div>
      )}
    </StaggerWrap>
  );
}

function getReviewsWord(count: number) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "отзывов";
  if (lastDigit === 1) return "отзыв";
  if (lastDigit >= 2 && lastDigit <= 4) return "отзыва";
  return "отзывов";
}
