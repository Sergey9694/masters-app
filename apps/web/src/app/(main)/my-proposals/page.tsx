import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Briefcase } from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { cn } from "@/shared/lib/cn";
import { MyOrderRow } from "@/entities/order";
import { DEFAULT_PAGE_SIZE } from "@/shared/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Мои отклики — УслугиРядом",
};

type Tab = "active" | "won" | "lost";

const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "Активные" },
  { key: "won", label: "Выигранные" },
  { key: "lost", label: "Завершённые" },
];

interface MyProposalsPageProps {
  searchParams: Promise<{ tab?: string; page?: string }>;
}

export default async function MyProposalsPage({
  searchParams,
}: MyProposalsPageProps) {
  const { tab: tabParam, page: pageParam } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  if (!user.providerProfile) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Briefcase className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Станьте исполнителем</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Чтобы откликаться на заказы, добавьте профиль исполнителя
          </p>
        </div>
        <Link
          href="/become-provider"
          className="mt-2 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          Начать
        </Link>
      </div>
    );
  }

  const providerId = user.providerProfile.id;
  const activeTab: Tab =
    tabParam === "won" || tabParam === "lost" ? tabParam : "active";
  const page = Math.max(1, Number(pageParam) || 1);

  const whereClause = buildProposalWhere(providerId, activeTab);

  const [proposals, totalCount] = await Promise.all([
    db.proposal.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
      select: {
        id: true,
        price: true,
        createdAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            slug: true,
            title: true,
            status: true,
            budget: true,
            address: true,
            assignedProviderId: true,
            createdAt: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
    }),
    db.proposal.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Мои отклики
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Заказы, на которые вы откликнулись
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-surface p-1">
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <Link
              key={t.key}
              href={
                t.key === "active" ? "/my-proposals" : `/my-proposals?tab=${t.key}`
              }
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {proposals.length === 0 ? (
        <EmptyProposals tab={activeTab} />
      ) : (
        <div className="flex flex-col gap-3">
          {proposals.map((p) => (
            <MyOrderRow
              key={p.id}
              data={{
                id: p.id,
                orderNumber: p.order.orderNumber,
                href: `/orders/${p.order.category.slug}/${p.order.slug || p.order.id}`,
                title: p.order.title,
                category: p.order.category.name,
                status: p.order.status,
                budget: p.order.budget,
                price: p.price,
                address: p.order.address,
                createdAt: p.createdAt,
                isChosen: p.order.assignedProviderId === providerId,
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

function buildProposalWhere(providerId: string, tab: Tab) {
  const base = { providerId };
  if (tab === "active") {
    return {
      ...base,
      OR: [
        { order: { status: "OPEN" as const } },
        {
          order: {
            status: "IN_PROGRESS" as const,
            assignedProviderId: providerId,
          },
        },
      ],
    };
  }
  if (tab === "won") {
    return {
      ...base,
      order: { status: "COMPLETED" as const, assignedProviderId: providerId },
    };
  }
  return {
    ...base,
    OR: [
      { order: { status: { in: ["CANCELED", "EXPIRED"] as never } } },
      {
        order: {
          status: "IN_PROGRESS" as const,
          NOT: { assignedProviderId: providerId },
        },
      },
      {
        order: {
          status: "COMPLETED" as const,
          NOT: { assignedProviderId: providerId },
        },
      },
    ],
  };
}

function EmptyProposals({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; hint: string }> = {
    active: {
      title: "Нет активных откликов",
      hint: "Откликнитесь на подходящий заказ из ленты",
    },
    won: {
      title: "Пока нет выигранных заказов",
      hint: "Здесь появятся заказы, которые вы успешно завершили",
    },
    lost: {
      title: "Архив пуст",
      hint: "Завершённые и проигранные отклики появятся здесь",
    },
  };
  const m = messages[tab];

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MessageSquare className="size-6" />
      </span>
      <div>
        <p className="text-base font-semibold">{m.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{m.hint}</p>
      </div>
      {tab === "active" && (
        <Link
          href="/orders"
          className="mt-2 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          Открыть ленту заказов
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
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        const active = p === currentPage;
        return (
          <Link
            key={p}
            href={`/my-proposals?${tabQ}page=${p}`}
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
