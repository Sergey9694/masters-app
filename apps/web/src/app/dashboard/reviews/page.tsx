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
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user || !user.providerProfile) redirect("/dashboard");

  const reviews = await db.review.findMany({
    where: { providerId: user.providerProfile.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        }
      },
      order: {
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
        <div className="space-y-3">
          {reviews.map((review) => (
            <StaggerItem key={review.id}>
              <Card className="glass border-none p-4 rounded-[28px] hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar size="default" className="border border-white/10">
                      <AvatarImage 
                        src={review.author.avatar || ""} 
                        alt={review.author.firstName}
                      />
                      <AvatarFallback className="bg-indigo-500/10 text-indigo-400 font-bold uppercase text-[10px]">
                        {review.author.firstName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h4 className="text-[13px] font-black text-white leading-tight">
                        {review.author.firstName} {review.author.lastName?.substring(0, 1)}.
                      </h4>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-2.5 h-2.5 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500/60 uppercase tracking-tighter flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full">
                    <Calendar className="w-2.5 h-2.5" />
                    {formatSmartDate(review.createdAt)}
                  </div>
                </div>

                <p className="text-[13px] text-slate-300 leading-snug font-medium mb-3 italic px-1">
                  «{review.text || "Без комментария"}»
                </p>

                <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-t border-white/5 pt-3">
                  <Briefcase className="w-3 h-3 text-indigo-500/50" />
                  <span className="opacity-60">Заказ:</span>
                  <span className="text-slate-400 truncate max-w-[150px]">{review.order.title}</span>
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
