import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
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

interface MyTasksPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MyTasksPage({ searchParams }: MyTasksPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [orders, totalCount] = await Promise.all([
    db.order.findMany({
      where: { clientId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        images: true,
        createdAt: true,
        description: true,
        category: { select: { name: true } },
        address: true,
        _count: { select: { proposals: true } },
      },
    }),
    db.order.count({
      where: { clientId: user.id },
    })
  ]);

  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />

      <PageHeader 
        title="Мои заявки" 
        subtitle={`${orders.length} всего`}
      />

      {orders.length === 0 ? (
        <StaggerItem>
          <div className="glass border border-dashed border-white/10 p-8 rounded-[24px] text-center">
            <p className="text-sm font-bold text-slate-400 mb-4">
              У вас пока нет заявок
            </p>
            <Link
              href="/dashboard/create-order"
              className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
            >
              Создать первую →
            </Link>
          </div>
        </StaggerItem>
      ) : (
        <div className="space-y-6">
          {[
            { title: "Активные", color: "orange" as const, items: orders.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS") },
            { title: "Завершенные", color: "green" as const, items: orders.filter(t => t.status === "COMPLETED") },
            { title: "Архив", color: "red" as const, items: orders.filter(t => (t.status as any) === "CANCELED" || (t.status as any) === "EXPIRED") }
          ].filter(group => group.items.length > 0).map((group) => (
            <StaggerItem key={group.title}>
              <StatusAccordion 
                title={group.title} 
                count={group.items.length} 
                color={group.color}
                defaultOpen={group.title === "Активные"}
              >
                {group.items.map((order) => (
                  <OrderListItem
                    key={order.id}
                    title={order.title}
                    description={order.description}
                    category={order.category.name}
                    status={order.status}
                    price={order.budget}
                    address={order.address}
                    responsesCount={order._count.proposals}
                    date={order.createdAt}
                    href={`/dashboard/order/${order.id}`}
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
                  href={`/dashboard/my-orders?page=${Math.max(1, page - 1)}`} 
                  disabled={page <= 1}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    href={`/dashboard/my-orders?page=${i + 1}`}
                    isActive={page === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  href={`/dashboard/my-orders?page=${Math.min(totalPages, page + 1)}`}
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
