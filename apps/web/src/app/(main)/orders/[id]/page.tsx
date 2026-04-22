import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  MapPin,
  Banknote,
  MessageSquare,
  ShieldCheck,
  Star,
  Pencil,
  User as UserIcon,
} from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { cn } from "@/shared/lib/cn";
import { getMapUrl } from "@/shared/lib/maps";
import { formatSmartDate } from "@/shared/lib/date";

import { OrderGalleryLight } from "@/features/order-view/ui/OrderGalleryLight";
import { RespondFormLight } from "@/features/proposal/ui/RespondFormLight";
import {
  AcceptProposalButton,
  OrderStatusControlsLight,
} from "@/features/proposal/ui/OrderControlsLight";
import { ReviewForm } from "@/features/review/ui/ReviewForm";
import { OrderFeedCard, OrderStatusPill } from "@/entities/order";

export const dynamic = "force-dynamic";

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
      category: { select: { id: true, name: true } },
      client: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      city: { select: { id: true, name: true } },
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
    order.proposals.some((p) => p.providerId === user.providerProfile!.id);
  const canRespond =
    !isOwner && isProvider && order.status === "OPEN" && !alreadyResponded;
  const isAssignedProvider = order.assignedProviderId === user.providerProfile?.id;

  const similarOrders = await db.order.findMany({
    where: {
      id: { not: order.id },
      status: "OPEN",
      categoryId: order.categoryId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      images: true,
      budget: true,
      address: true,
      createdAt: true,
      status: true,
      category: { select: { name: true } },
      client: { select: { firstName: true, avatar: true } },
      city: { select: { name: true } },
      _count: { select: { proposals: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const similarNormalized = similarOrders.map((o) => ({
    ...o,
    proposalCount: o._count.proposals,
  }));

  const visibleProposals = order.proposals.filter(
    (p) => isOwner || p.providerId === user.providerProfile?.id
  );

  return (
    <div className="flex flex-col gap-6">
      <nav
        aria-label="Хлебные крошки"
        className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          Главная
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/orders" className="hover:text-foreground">
          Заказы
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/orders?categoryId=${order.categoryId}`}
          className="hover:text-foreground"
        >
          {order.category.name}
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <header className="rounded-2xl border border-border/60 bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {order.category.name}
              </span>
              <OrderStatusPill status={order.status} />
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {formatSmartDate(order.createdAt)}
              </span>
              {isOwner && order.status === "OPEN" && (
                <Link
                  href={`/dashboard/order/${order.id}/edit`}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                  Редактировать
                </Link>
              )}
            </div>

            <h1 className="mt-4 wrap-break-word text-2xl font-semibold leading-tight sm:text-3xl">
              {order.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="inline-flex items-center gap-2 text-foreground">
                <Banknote className="size-4 text-success" />
                <span className="font-semibold">
                  {order.budget
                    ? `${order.budget.toLocaleString("ru-RU")} ₽`
                    : "Договорная"}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4" />
                {order.city.name}
              </div>
              {order.address && (
                <a
                  href={getMapUrl(order.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                >
                  <MapPin className="size-4 shrink-0" />
                  <span className="wrap-break-word min-w-0">{order.address}</span>
                </a>
              )}
              <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare className="size-4" />
                {order.proposals.length} откликов
              </div>
            </div>

            <p className="mt-6 wrap-break-word whitespace-pre-line text-base leading-relaxed text-foreground">
              {order.description}
            </p>

            {order.images.length > 0 && (
              <div className="mt-6">
                <OrderGalleryLight images={order.images} title={order.title} />
              </div>
            )}
          </header>

          {(isOwner || isAssignedProvider) &&
            (order.status === "OPEN" || order.status === "IN_PROGRESS") && (
              <OrderStatusControlsLight
                orderId={order.id}
                status={order.status}
                isOwner={isOwner}
                isAssignedProvider={isAssignedProvider}
              />
            )}

          {order.assignedProvider &&
            (order.status === "IN_PROGRESS" || order.status === "COMPLETED") && (
              <section className="rounded-2xl border border-success/30 bg-success/5 p-5">
                <h2 className="text-sm font-semibold text-success">Исполнитель</h2>
                <Link
                  href={`/dashboard/provider/${order.assignedProvider.id}`}
                  className="mt-3 flex items-center gap-3 transition-colors hover:text-primary"
                >
                  <div className="size-12 shrink-0 overflow-hidden rounded-full bg-muted">
                    {order.assignedProvider.user.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={order.assignedProvider.user.avatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <UserIcon className="size-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      {order.assignedProvider.user.firstName}
                      {order.assignedProvider.isVerified && (
                        <ShieldCheck className="size-4 text-primary" />
                      )}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-warning text-warning" />
                      {(order.assignedProvider.rating ?? 0).toFixed(1)}
                    </p>
                  </div>
                </Link>
              </section>
            )}

          {canRespond && <RespondFormLight orderId={order.id} />}

          {alreadyResponded && !isOwner && (
            <div className="rounded-2xl border border-success/30 bg-success/5 p-4 text-center text-sm font-medium text-success">
              Вы уже откликнулись на этот заказ
            </div>
          )}

          {!isProvider && !isOwner && order.status === "OPEN" && (
            <Link
              href="/dashboard/become-provider"
              className="rounded-2xl border border-dashed border-border bg-muted/40 p-5 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Чтобы откликнуться — станьте исполнителем
            </Link>
          )}

          {isOwner &&
            order.status === "COMPLETED" &&
            !order.review &&
            order.assignedProviderId && <ReviewForm referenceId={order.id} />}

          {order.review && (
            <section className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "size-4",
                      n <= order.review!.rating
                        ? "fill-warning text-warning"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              {order.review.text && (
                <p className="mt-2 wrap-break-word text-sm text-foreground">{order.review.text}</p>
              )}
            </section>
          )}

          {visibleProposals.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Отклики</h2>
                <span className="text-sm text-muted-foreground">
                  {visibleProposals.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {visibleProposals.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-border/60 bg-surface p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/dashboard/provider/${p.providerId}`}
                        className="flex items-center gap-3 transition-colors hover:text-primary"
                      >
                        <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                          {p.provider.user.avatar ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={p.provider.user.avatar}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <UserIcon className="size-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-semibold">
                            {p.provider.user.firstName}
                            {p.provider.isVerified && (
                              <ShieldCheck className="size-3.5 text-primary" />
                            )}
                          </p>
                          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="size-3 fill-warning text-warning" />
                            {(p.provider.rating ?? 0).toFixed(1)}
                          </p>
                        </div>
                      </Link>

                      {p.price && (
                        <span className="whitespace-nowrap text-base font-semibold text-success">
                          {p.price.toLocaleString("ru-RU")} ₽
                        </span>
                      )}
                    </div>

                    {p.message && (
                      <p className="mt-3 wrap-break-word whitespace-pre-line text-sm leading-relaxed text-foreground">
                        {p.message}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatSmartDate(p.createdAt)}
                      </span>
                      {isOwner && order.status === "OPEN" && (
                        <AcceptProposalButton proposalId={p.id} />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {isOwner && order.proposals.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              Пока никто не откликнулся. Исполнители увидят ваш заказ в ленте.
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border/60 bg-surface p-5">
            <h2 className="text-sm font-semibold">Заказчик</h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                {order.client.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={order.client.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <UserIcon className="size-4" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">{order.client.firstName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Разместил заказ</p>
              </div>
            </div>
          </section>

          {similarNormalized.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold">Похожие заказы</h2>
              <div className="flex flex-col gap-3">
                {similarNormalized.map((o) => (
                  <OrderFeedCard
                    key={o.id}
                    order={o}
                    href={`/orders/${o.id}`}
                  />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

