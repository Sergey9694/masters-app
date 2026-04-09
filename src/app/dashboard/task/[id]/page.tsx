import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Banknote, MapPin, Clock, User as UserIcon, Star, ShieldCheck, MessageSquare } from "lucide-react";
import { formatSmartDate } from "@/shared/lib/date";
import { getMapUrl } from "@/shared/lib/maps";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { RespondForm } from "@/features/task-response/ui/RespondForm";
import { AcceptResponseButton } from "@/features/task-response/ui/AcceptResponseButton";
import { TaskStatusButtons } from "@/features/task-response/ui/TaskStatusButtons";
import { ReviewForm } from "@/features/review/ui/ReviewForm";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { TaskImageGallery } from "@/features/task-view/ui/TaskImageGallery";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusBadge } from "@/shared/ui/status-badge";
import { SectionHeader } from "@/shared/ui/section-header";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const task = await db.taskRequest.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      customer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      assignedMaster: {
        select: {
          id: true,
          rating: true,
          isVerified: true,
          user: { select: { firstName: true, avatar: true } },
        },
      },
      review: { select: { id: true, rating: true, text: true } },
      responses: {
        orderBy: { createdAt: "desc" },
        include: {
          master: {
            select: {
              id: true,
              rating: true,
              isVerified: true,
              user: { select: { firstName: true, lastName: true, avatar: true } },
            },
          },
        },
      },
    },
  });

  if (!task) notFound();

  const isOwner = task.customerId === user.id;
  const isMaster = Boolean(user.masterProfile);
  const alreadyResponded =
    isMaster &&
    task.responses.some((r) => r.masterId === user.masterProfile!.id);
  const canRespond = !isOwner && isMaster && task.status === "OPEN" && !alreadyResponded;

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />

      <PageHeader 
        title="Заявка"
        subtitle={<StatusBadge status={task.status} />}
        fallbackUrl="/dashboard/feed"
      />

      {/* Task Summary */}
      <StaggerItem>
        <Card className="glass border-none p-6 rounded-[32px] mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/20 overflow-hidden">
                <AvatarImage src={task.customer.avatar || ""} alt={task.customer.firstName} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-blue-400 font-bold text-xs uppercase bg-transparent">
                  {task.customer.firstName?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                  {task.customer.firstName}
                </p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatSmartDate(task.createdAt)}
                </p>
              </div>
            </div>
            <Badge variant="category">
              {task.category.name}
            </Badge>
          </div>

          <h2 className="text-2xl font-black text-white leading-tight mb-3">{task.title}</h2>
          <p className="text-sm font-normal text-slate-300 leading-relaxed mb-5 opacity-90">{task.description}</p>

          <TaskImageGallery images={task.images} />

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Banknote className="w-4 h-4" />
              </div>
              <span className="text-sm font-black">
                {task.budget ? `${task.budget.toLocaleString()} ₽` : "Договорная"}
              </span>
            </div>
            
            {task.address && (
              <a 
                href={getMapUrl(task.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group/map"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/map:bg-blue-500/20 transition-colors">
                  <MapPin className="w-4 h-4 group-hover/map:animate-bounce" />
                </div>
                <span className="text-sm font-bold group-hover/map:underline decoration-blue-500/30 underline-offset-4">
                  {task.address}
                </span>
              </a>
            )}

            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest ml-auto">
              <MessageSquare className="w-3.5 h-3.5" />
              {task.responses.length} отклик(ов)
            </div>
          </div>
        </Card>
      </StaggerItem>

      {/* Controls: owner (complete/cancel) or assigned master (refuse) */}
      {(isOwner || task.assignedMasterId === user.masterProfile?.id) &&
        (task.status === "OPEN" || task.status === "IN_PROGRESS") && (
          <StaggerItem className="mb-6">
            <TaskStatusButtons
              taskId={task.id}
              status={task.status}
              isOwner={isOwner}
              isAssignedMaster={task.assignedMasterId === user.masterProfile?.id}
            />
          </StaggerItem>
        )}

      {/* Assigned master card (visible when task is IN_PROGRESS / COMPLETED) */}
      {task.assignedMaster && (task.status === "IN_PROGRESS" || task.status === "COMPLETED") && (
        <StaggerItem className="mb-6">
          <SectionHeader title="Исполнитель" accentColor="emerald" className="mb-4" />
          <Card className="glass border border-emerald-500/20 p-5 rounded-[24px]">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                <AvatarImage src={task.assignedMaster.user.avatar || ""} alt="" className="object-cover" />
                <AvatarFallback className="flex items-center justify-center text-slate-400 bg-transparent">
                  <UserIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-black text-white leading-none mb-1 flex items-center gap-2">
                  {task.assignedMaster.user.firstName}
                  {task.assignedMaster.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  {(task.assignedMaster.rating ?? 0).toFixed(1)}
                </p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      )}

      {/* Review form (owner, COMPLETED, no existing review) */}
      {isOwner && task.status === "COMPLETED" && !task.review && task.assignedMasterId && (
        <StaggerItem className="mb-6">
          <ReviewForm taskId={task.id} />
        </StaggerItem>
      )}

      {/* Existing review */}
      {task.review && (
        <StaggerItem className="mb-6">
          <Card className="glass border border-yellow-500/20 p-5 rounded-[24px]">
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={
                    n <= task.review!.rating
                      ? "w-4 h-4 fill-yellow-400 text-yellow-400"
                      : "w-4 h-4 text-slate-700"
                  }
                />
              ))}
            </div>
            {task.review.text && (
              <p className="text-sm text-slate-300 leading-relaxed">{task.review.text}</p>
            )}
          </Card>
        </StaggerItem>
      )}

      {/* Respond Form (master, not owner, OPEN, not already) */}
      {canRespond && (
        <StaggerItem className="mb-6">
          <RespondForm taskId={task.id} />
        </StaggerItem>
      )}

      {alreadyResponded && !isOwner && (
        <StaggerItem className="mb-6">
          <div className="glass border border-emerald-500/20 p-4 rounded-[24px] text-center">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Вы уже откликнулись на эту заявку
            </p>
          </div>
        </StaggerItem>
      )}

      {!isMaster && !isOwner && task.status === "OPEN" && (
        <StaggerItem className="mb-6">
          <Link href="/dashboard/become-master">
            <div className="glass border border-white/10 p-4 rounded-[24px] text-center hover:bg-white/5 transition-colors">
              <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                Чтобы откликнуться — станьте мастером
              </p>
            </div>
          </Link>
        </StaggerItem>
      )}

      {/* Responses list (owner sees all, master sees only own) */}
      {(() => {
        const filteredResponses = task.responses.filter(
          (r) => isOwner || r.masterId === user.masterProfile?.id
        );
        if (filteredResponses.length === 0) return null;

        return (
          <StaggerItem className="mb-6">
            <SectionHeader 
              title="Отклики" 
              count={filteredResponses.length} 
              className="mb-4" 
            />
            <div className="space-y-3">
              {filteredResponses.map((r) => (
                <Card key={r.id} className="glass border-none p-5 rounded-[24px]">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                        <AvatarImage src={r.master.user.avatar || ""} alt="" className="object-cover" />
                        <AvatarFallback className="flex items-center justify-center text-slate-400 bg-transparent">
                          <UserIcon className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-black text-white leading-none mb-1 flex items-center gap-2">
                          {r.master.user.firstName}
                          {r.master.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {(r.master.rating ?? 0).toFixed(1)}
                        </p>
                      </div>
                    </div>
                    {r.price && (
                      <div className="text-sm font-black text-emerald-400 whitespace-nowrap">
                        {r.price.toLocaleString()} ₽
                      </div>
                    )}
                  </div>
                  {r.message && (
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">{r.message}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      {formatSmartDate(r.createdAt)}
                    </span>
                    {isOwner && task.status === "OPEN" && (
                      <AcceptResponseButton responseId={r.id} />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </StaggerItem>
        );
      })()}

      {isOwner && task.responses.length === 0 && (
        <StaggerItem>
          <div className="glass border border-dashed border-white/10 p-8 rounded-[24px] text-center">
            <p className="text-sm font-bold text-slate-400">
              Пока никто не откликнулся. Мастера скоро увидят вашу заявку.
            </p>
          </div>
        </StaggerItem>
      )}
    </StaggerWrap>
  );
}
