import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Inbox } from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { cn } from "@/shared/lib/cn";
import { MyOrderRow } from "@/entities/order";
import { DEFAULT_PAGE_SIZE } from "@/shared/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Мои заказы — УслугиРядом",
};

type Tab = "active" | "completed" | "archived";

const TABS: { key: Tab; label: string; statuses: string[] }[] = [
  { key: "active", label: "Активные", statuses: ["OPEN", "IN_PROGRESS"] },
  { key: "completed", label: "Завершённые", statuses: ["COMPLETED"] },
  { key: "archived", label: "Архив", statuses: ["CANCELED", "EXPIRED"] },
];

interface MyOrdersPageProps {
  searchParams: Promise<{ tab?: string; page?: string }>;
}

export default async function MyOrdersPage({ searchParams }: MyOrdersPageProps) {
  const { tab: tabParam, page: pageParam } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const activeTab: Tab =
    tabParam === "completed" || tabParam === "archived" ? tabParam : "active";
  const page = Math.max(1, Number(pageParam) || 1);
  const statuses = TABS.find((t) => t.key === activeTab)!.statuses;

  const [orders, totalCount, counts] = await Promise.all([
    db.order.findMany({
      where: {
        clientId: user.id,
        status: { in: statuses as never },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        slug: true,
        title: true,
        status: true,
        budget: true,
        address: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
        city: { select: { slug: true } },
        _count: { select: { proposals: true } },
      },
    }),
    db.order.count({
      where: { clientId: user.id, status: { in: statuses as never } },
    }),
    db.order.groupBy({
      by: ["status"],
      where: { clientId: user.id },
      _count: true,
    }),
  ]);

  const countByTab = (tab: Tab) => {
    const set = new Set(TABS.find((t) => t.key === tab)!.statuses);
    return counts
      .filter((c) => set.has(c.status))
      .reduce((acc, c) => acc + c._count, 0);
  };

  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Мои заказы
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Все заказы, которые вы разместили
          </p>
        </div>

        <Link
          href="/orders/new"
          className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
        >
          <Plus className="size-4" />
          Новый заказ
        </Link>
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-surface p-1">
        {TABS.map((t) => {
          const active = t.key === activeTab;
          const count = countByTab(t.key);
          return (
            <Link
              key={t.key}
              href={t.key === "active" ? "/my-orders" : `/my-orders?tab=${t.key}`}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {count > 0 && (
                <span
                  className={cn(
                    "ml-2 rounded-full px-2 py-0.5 text-xs",
                    active
                      ? "bg-primary-foreground/20"
                      : "bg-muted text-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <MyOrderRow
              key={o.id}
              data={{
                id: o.id,
                orderNumber: o.orderNumber,
                href: `/orders/${o.city.slug}/${o.category.slug}/${o.slug || o.id}`,
                title: o.title,
                category: o.category.name,
                status: o.status,
                budget: o.budget,
                address: o.address,
                createdAt: o.createdAt,
                proposalsCount: o._count.proposals,
              }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pager currentPage={page} totalPages={totalPages} tab={activeTab} />
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; hint: string }> = {
    active: {
      title: "Нет активных заказов",
      hint: "Создайте заказ, чтобы найти исполнителя",
    },
    completed: {
      title: "Нет завершённых заказов",
      hint: "Завершённые заказы будут здесь",
    },
    archived: {
      title: "Архив пуст",
      hint: "Отменённые и истёкшие заказы будут здесь",
    },
  };
  const m = messages[tab];

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-6" />
      </span>
      <div>
        <p className="text-base font-semibold">{m.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{m.hint}</p>
      </div>
      {tab === "active" && (
        <Link
          href="/orders/new"
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          <Plus className="size-4" />
          Создать заказ
        </Link>
      )}
    </div>
  );
}

function Pager({
  currentPage,
  totalPages,
  tab,
}: {
  currentPage: number;
  totalPages: number;
  tab: Tab;
}) {
  const tabQ = tab === "active" ? "" : `tab=${tab}&`;
  const build = (p: number) => `/my-orders?${tabQ}page=${p}`;

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        const active = p === currentPage;
        return (
          <Link
            key={p}
            href={build(p)}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/60 hover:text-primary"
            )}
          >
            {p}
          </Link>
        );
      })}
    </div>
  );
}
