import { notFound, redirect } from "next/navigation";
import { Star, ShieldCheck, Briefcase, Banknote, Calendar, MessageSquare, User as UserIcon, Tag } from "lucide-react";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { TaskImageGallery } from "@/features/task-view/ui/TaskImageGallery";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionHeader } from "@/shared/ui/section-header";
import { ExpandableText } from "@/shared/ui/expandable-text";

import { cn } from "@/shared/lib/cn";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MasterProfilePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const master = await db.masterProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      reviews: {
        include: {
          author: {
            select: {
              firstName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!master) notFound();

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />

      <PageHeader 
        title="Профиль мастера"
        subtitle={master.isVerified ? "Проверенный специалист" : "Частный мастер"}
      />

      {/* Main Stats Card */}
      <StaggerItem>
        <Card className="glass-premium border-none p-5 rounded-[32px] relative overflow-hidden mb-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] -mr-16 -mt-16 pointer-events-none" />
          
          <div className="flex items-start gap-4 relative z-10 mb-4">
            <div className="relative p-[3px] rounded-full neon-border-gradient shadow-2xl shadow-indigo-500/20">
              <Avatar className="w-20 h-20 rounded-full bg-slate-900 overflow-hidden border-none text-white">
                <AvatarImage src={master.user.avatar || ""} alt="" className="object-cover" />
                <AvatarFallback className="text-2xl font-black text-slate-500 bg-slate-900 flex items-center justify-center">
                  {master.user.firstName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white leading-tight">
                    {master.user.firstName} {master.user.lastName}
                  </h1>
                  {master.isVerified && (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 fill-emerald-400/10" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 shrink-0">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-black text-yellow-500">
                    {master.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-cyan-400/40" />
                  {master.reviews.length} отзывов
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-4 border-b border-white/10 mb-4">
            <div className="bg-white/5 rounded-[20px] p-4 neon-border-gradient">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white mb-1">Опыт</p>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-400/60" />
                <span className="text-sm font-black text-cyan-400/90">{master.experienceYears || 0} лет</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-[20px] p-4 neon-border-gradient">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white mb-1">Цена от</p>
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-cyan-400/60" />
                <span className="text-sm font-black text-cyan-400/90">
                  {master.minPrice ? `${master.minPrice.toLocaleString()} ₽` : "Договорная"}
                </span>
              </div>
            </div>
          </div>

          {master.bio && (
            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white mb-1.5">О себе</p>
              <ExpandableText text={master.bio} maxLength={180} />
            </div>
          )}

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white mb-2">Специализация</p>
            <div className="flex flex-wrap gap-2">
              {master.categories.map((c) => (
                <Badge key={c.categoryId} variant="category">
                   {c.category.name}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </StaggerItem>

      {/* Portfolio Gallery */}
      {master.portfolio && master.portfolio.length > 0 && (
        <StaggerItem>
          <SectionHeader 
            title="Портфолио" 
            count={master.portfolio.length} 
            className="mb-4 [&>h2]:!text-cyan-400/60 [&>span]:!text-cyan-400/60" 
          />
          <Card className="glass border-none p-5 rounded-[24px] mb-6">
            <TaskImageGallery images={master.portfolio} />
          </Card>
        </StaggerItem>
      )}

      {/* Reviews */}
      <StaggerItem>
        <SectionHeader 
          title="Отзывы" 
          count={master.reviews.length} 
          className="mb-4 [&>h2]:!text-cyan-400/60 [&>span]:!text-cyan-400/60" 
        />
        <div className="space-y-4">
          {master.reviews.length === 0 ? (
            <div className="glass border border-dashed border-white/10 p-8 rounded-[24px] text-center">
              <p className="text-sm font-bold text-cyan-400/60">Пока нет отзывов</p>
            </div>
          ) : (
            master.reviews.map((review) => (
              <Card key={review.id} className="glass border-none p-5 rounded-[24px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-slate-800">
                      <AvatarImage src={review.author.avatar || ""} />
                      <AvatarFallback className="text-[8px] font-black">
                        {review.author.firstName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-black text-slate-300">{review.author.firstName}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={cn(
                          "w-3 h-3",
                          s <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-slate-700"
                        )} 
                      />
                    ))}
                  </div>
                </div>
                {review.text && (
                  <p className="text-sm text-slate-400 leading-relaxed italic">
                    "{review.text}"
                  </p>
                )}
              </Card>
            ))
          )}
        </div>
      </StaggerItem>
    </StaggerWrap>
  );
}
