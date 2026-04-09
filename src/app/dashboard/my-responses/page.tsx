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
import { TaskListItem } from "@/entities/task";

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
  if (!user.masterProfile) {
    return (
      <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
        <TelegramBackButton />
        <PageHeader title="Мои отклики" />
        <StaggerItem>
          <Link href="/dashboard/become-master">
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

  const [responses, totalCount] = await Promise.all([
    db.taskResponse.findMany({
      where: { masterId: user.masterProfile.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
      select: {
        id: true,
        price: true,
        createdAt: true,
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            assignedMasterId: true,
            description: true,
            category: { select: { name: true } },
            address: true,
          },
        },
      },
    }),
    db.taskResponse.count({
      where: { masterId: user.masterProfile.id },
    })
  ]);

  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />

      <PageHeader 
        title="Мои отклики" 
        subtitle={`${responses.length} всего`}
      />

      {responses.length === 0 ? (
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
              items: responses.filter(r => 
                r.task.status === "OPEN" || 
                (r.task.status === "IN_PROGRESS" && r.task.assignedMasterId === user.masterProfile!.id)
              )
            },
            {
              title: "Завершенные",
              color: "green" as const,
              items: responses.filter(r => r.task.status === "COMPLETED")
            },
            {
              title: "Архив",
              color: "red" as const,
              items: responses.filter(r => 
                (r.task.status as any) === "CANCELED" || 
                (r.task.status as any) === "EXPIRED" ||
                (r.task.status === "IN_PROGRESS" && r.task.assignedMasterId !== user.masterProfile!.id)
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
                  <TaskListItem
                    key={r.id}
                    title={r.task.title}
                    description={r.task.description}
                    category={r.task.category.name}
                    status={r.task.status}
                    price={r.price}
                    address={r.task.address}
                    isChosen={r.task.assignedMasterId === user.masterProfile!.id}
                    date={r.createdAt}
                    href={`/dashboard/task/${r.task.id}`}
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
                  href={`/dashboard/my-responses?page=${Math.max(1, page - 1)}`} 
                  disabled={page <= 1}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    href={`/dashboard/my-responses?page=${i + 1}`}
                    isActive={page === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  href={`/dashboard/my-responses?page=${Math.min(totalPages, page + 1)}`}
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
