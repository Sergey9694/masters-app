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
import { RespondForm } from "@/features/proposal/ui/RespondForm";
import { AcceptResponseButton } from "@/features/proposal/ui/AcceptResponseButton";
import { OrderStatusButtons } from "@/features/proposal/ui/OrderStatusButtons";
import { ReviewForm } from "@/features/review/ui/ReviewForm";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { OrderImageGallery } from "@/features/order-view/ui/OrderImageGallery";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusBadge } from "@/shared/ui/status-badge";
import { SectionHeader } from "@/shared/ui/section-header";
import { OrderCardBase } from "@/entities/order/ui/OrderCardBase";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const order = await db.order.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      client: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      assignedProvider: {
        select: {
          id: true,
          rating: true,
          isVerified: true,
          user: { select: { firstName: true, avatar: true } },
        },
      },
      review: { select: { id: true, rating: true, text: true } },
      proposals: {
        orderBy: { createdAt: "desc" },
        include: {
          provider: {
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

  if (!order) notFound();

  const isOwner = order.clientId === user.id;
  const isProvider = Boolean(user.providerProfile);
  const alreadyResponded =
    isProvider &&
    order.proposals.some((r) => r.providerId === user.providerProfile!.id);
  const canRespond = !isOwner && isProvider && order.status === "OPEN" && !alreadyResponded;

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />

      <PageHeader
        title="Заявка"
        fallbackUrl="/dashboard/feed"
      />

      {/* Order Summary */}
      <StaggerItem className="mb-6">
        <OrderCardBase
          isClickable={false}
          category={<Badge variant="category">{order.category.name}</Badge>}
          user={
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-slate-800">
                <AvatarImage src={order.client.avatar || ""} alt={order.client.firstName} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-blue-400 font-bold text-[10px] uppercase">
                  {order.client.firstName?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1">
                  {order.client.firstName}
                </p>
                <div className="flex items-center gap-1.5 opacity-60">
                   <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Заказчик</p>
                </div>
              </div>
            </div>
          }
          title={<h2 className="text-2xl font-black text-white leading-tight">{order.title}</h2>}
          description={order.description}
          image={order.images.length > 0 ? <OrderImageGallery images={order.images} /> : undefined}
          budget={
            <div className="flex items-center gap-2 text-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Banknote className="w-4 h-4" />
              </div>
              <span className="text-sm font-black whitespace-nowrap">
                {order.budget ? `${order.budget.toLocaleString()} ₽` : "Договорная"}
              </span>
            </div>
          }
          address={order.address ? (
            <a 
              href={getMapUrl(order.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group/address overflow-hidden"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/address:bg-blue-500/20 transition-colors shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold underline decoration-blue-500/30 underline-offset-4 truncate">
                {order.address}
              </span>
            </a>
          ) : undefined}
          responsesCount={
            <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              <MessageSquare className="w-3.5 h-3.5" />
              {order.proposals.length} отклика
            </div>
          }
          date={
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">
              <Clock className="w-3.5 h-3.5" />
              {formatSmartDate(order.createdAt)}
            </div>
          }
        />
      </StaggerItem>

      {/* Controls: owner (complete/cancel) or assigned provider (refuse) */}
      {(isOwner || order.assignedProviderId === user.providerProfile?.id) &&
        (order.status === "OPEN" || order.status === "IN_PROGRESS") && (
          <StaggerItem className="mb-6">
            <OrderStatusButtons
              referenceId={order.id}
              status={order.status}
              isOwner={isOwner}
              isAssignedMaster={order.assignedProviderId === user.providerProfile?.id}
            />
          </StaggerItem>
        )}

      {/* Assigned provider card (visible when order is IN_PROGRESS / COMPLETED) */}
      {order.assignedProvider && (order.status === "IN_PROGRESS" || order.status === "COMPLETED") && (
        <StaggerItem className="mb-6">
          <SectionHeader title="Исполнитель" accentColor="emerald" className="mb-4" />
          <Link href={`/dashboard/providers/${order.assignedProvider.id}`}>
            <Card className="glass border border-emerald-500/20 p-5 rounded-[24px] hover:bg-emerald-500/5 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                  <AvatarImage src={order.assignedProvider.user.avatar || ""} alt="" className="object-cover" />
                  <AvatarFallback className="flex items-center justify-center text-slate-400 bg-transparent">
                    <UserIcon className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-black text-white leading-none mb-1 flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                    {order.assignedProvider.user.firstName}
                    {order.assignedProvider.isVerified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    {(order.assignedProvider.rating ?? 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </StaggerItem>
      )}

      {/* Review form (owner, COMPLETED, no existing review) */}
      {isOwner && order.status === "COMPLETED" && !order.review && order.assignedProviderId && (
        <StaggerItem className="mb-6">
          <ReviewForm referenceId={order.id} />
        </StaggerItem>
      )}

      {/* Existing review */}
      {order.review && (
        <StaggerItem className="mb-6">
          <Card className="glass border border-yellow-500/20 p-5 rounded-[24px]">
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={
                    n <= order.review!.rating
                      ? "w-4 h-4 fill-yellow-400 text-yellow-400"
                      : "w-4 h-4 text-slate-700"
                  }
                />
              ))}
            </div>
            {order.review.text && (
              <p className="text-sm text-slate-300 leading-relaxed">{order.review.text}</p>
            )}
          </Card>
        </StaggerItem>
      )}

      {/* Respond Form (provider, not owner, OPEN, not already) */}
      {canRespond && (
        <StaggerItem className="mb-6">
          <RespondForm orderId={order.id} />
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

      {!isProvider && !isOwner && order.status === "OPEN" && (
        <StaggerItem className="mb-6">
          <Link href="/dashboard/become-provider">
            <div className="glass border border-white/10 p-4 rounded-[24px] text-center hover:bg-white/5 transition-colors">
              <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                Чтобы откликнуться — станьте мастером
              </p>
            </div>
          </Link>
        </StaggerItem>
      )}

      {/* Responses list (owner sees all, provider sees only own) */}
      {(() => {
        const filteredResponses = order.proposals.filter(
          (r) => isOwner || r.providerId === user.providerProfile?.id
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
                    <Link href={`/dashboard/providers/${r.providerId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                        <AvatarImage src={r.provider.user.avatar || ""} alt="" className="object-cover" />
                        <AvatarFallback className="flex items-center justify-center text-slate-400 bg-transparent">
                          <UserIcon className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-black text-white leading-none mb-1 flex items-center gap-2">
                          {r.provider.user.firstName}
                          {r.provider.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {(r.provider.rating ?? 0).toFixed(1)}
                        </p>
                      </div>
                    </Link>
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
                    {isOwner && order.status === "OPEN" && (
                      <AcceptResponseButton proposalId={r.id} />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </StaggerItem>
        );
      })()}

      {isOwner && order.proposals.length === 0 && (
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
