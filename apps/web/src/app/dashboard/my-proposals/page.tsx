export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { Card } from "@/shared/ui/card";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusAccordion } from "@/shared/ui/status-accordion";
import { OrderListItem } from "@/entities/order";

import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/shared/ui/pagination";

import { DEFAULT_PAGE_SIZE } from "@/shared/lib/constants";

interface MyResponsesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MyResponsesPage({ searchParams }: MyResponsesPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!user.providerProfile) {
    return (
      <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
        <TelegramBackButton />
        <PageHeader title="Мои отклики" />
        <StaggerItem>
          <Link href="/dashboard/become-provider">
            <Card className="glass border border-emerald-500/20 p-6 rounded-[24px] text-center hover:bg-white/5 transition-colors">
              <p className="text-sm font-bold text-slate-300 mb-2">
                Вы ещё не зарегистрированы как мастер
              </p>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
                Стать мастером →
              </p>
            </Card>
          </Link>
        </StaggerItem>
      </StaggerWrap>
    );
  }

  const [proposals, totalCount] = await Promise.all([
    db.proposal.findMany({
      where: { providerId: user.providerProfile.id },
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
            title: true,
            status: true,
            images: true,
            assignedProviderId: true,
            description: true,
            category: { select: { name: true } },
            address: true,
          },
        },
      },
    }),
    db.proposal.count({
      where: { providerId: user.providerProfile.id },
    })
  ]);

  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />

      <PageHeader 
        title="Мои отклики" 
        subtitle={`${proposals.length} всего`}
      />

      {proposals.length === 0 ? (
        <StaggerItem>
          <div className="glass border border-dashed border-white/10 p-8 rounded-[24px] text-center">
            <p className="text-sm font-bold text-slate-400 mb-4">
              Вы ещё не откликались ни на одну заявку
            </p>
            <Link
              href="/dashboard/feed"
              className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
            >
              Посмотреть ленту →
            </Link>
          </div>
        </StaggerItem>
      ) : (
        <div className="space-y-6">
          {[
            {
              title: "Активные",
              color: "orange" as const,
              items: proposals.filter(r => 
                r.order.status === "OPEN" || 
                (r.order.status === "IN_PROGRESS" && r.order.assignedProviderId === user.providerProfile!.id)
              )
            },
            {
              title: "Завершенные",
              color: "green" as const,
              items: proposals.filter(r => r.order.status === "COMPLETED")
            },
            {
              title: "Архив",
              color: "red" as const,
              items: proposals.filter(r => 
                (r.order.status as any) === "CANCELED" || 
                (r.order.status as any) === "EXPIRED" ||
                (r.order.status === "IN_PROGRESS" && r.order.assignedProviderId !== user.providerProfile!.id)
              )
            }
          ].filter(group => group.items.length > 0).map((group) => (
            <StaggerItem key={group.title}>
              <StatusAccordion 
                title={group.title} 
                count={group.items.length} 
                color={group.color}
                defaultOpen={group.title === "Активные"}
              >
                {group.items.map((r) => (
                  <OrderListItem
                    key={r.id}
                    title={r.order.title}
                    description={r.order.description}
                    category={r.order.category.name}
                    status={r.order.status}
                    price={r.price}
                    address={r.order.address}
                    isChosen={r.order.assignedProviderId === user.providerProfile!.id}
                    date={r.createdAt}
                    href={`/dashboard/order/${r.order.id}`}
                  />
                ))}
              </StatusAccordion>
            </StaggerItem>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <StaggerItem className="mt-10">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href={`/dashboard/my-proposals?page=${Math.max(1, page - 1)}`} 
                  disabled={page <= 1}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    href={`/dashboard/my-proposals?page=${i + 1}`}
                    isActive={page === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  href={`/dashboard/my-proposals?page=${Math.min(totalPages, page + 1)}`}
                  disabled={page >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </StaggerItem>
      )}
    </StaggerWrap>
  );
}