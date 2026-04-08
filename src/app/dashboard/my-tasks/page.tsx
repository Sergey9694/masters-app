import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Banknote, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { Card } from "@/shared/ui/card";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusBadge } from "@/shared/ui/status-badge";
import { SectionHeader } from "@/shared/ui/section-header";
import { Badge } from "@/shared/ui/badge";
import { StatusAccordion } from "@/shared/ui/status-accordion";

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

  const [tasks, totalCount] = await Promise.all([
    db.taskRequest.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        createdAt: true,
        category: { select: { name: true } },
        _count: { select: { responses: true } },
      },
    }),
    db.taskRequest.count({
      where: { customerId: user.id },
    })
  ]);

  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />

      <PageHeader 
        title="Мои заявки" 
        subtitle={`${tasks.length} всего`}
      />

      {tasks.length === 0 ? (
        <StaggerItem>
          <div className="glass border border-dashed border-white/10 p-8 rounded-[24px] text-center">
            <p className="text-sm font-bold text-slate-400 mb-4">
              У вас пока нет заявок
            </p>
            <Link
              href="/dashboard/create-task"
              className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
            >
              Создать первую →
            </Link>
          </div>
        </StaggerItem>
      ) : (
        <div className="space-y-6">
          {[
            { title: "Активные", color: "orange" as const, items: tasks.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS") },
            { title: "Завершенные", color: "green" as const, items: tasks.filter(t => t.status === "COMPLETED") },
            { title: "Отмененные", color: "red" as const, items: tasks.filter(t => t.status === "CANCELED") }
          ].filter(group => group.items.length > 0).map((group) => (
            <StaggerItem key={group.title}>
              <StatusAccordion 
                title={group.title} 
                count={group.items.length} 
                color={group.color}
                defaultOpen={group.title === "Активные"}
              >
                {group.items.map((task) => (
                  <StaggerItem key={task.id}>
                    <Link href={`/dashboard/task/${task.id}`}>
                      <Card className="glass border-none p-5 rounded-[24px] hover:bg-white/5 transition-all group">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <Badge variant="category" className="mb-2">
                              {task.category.name}
                            </Badge>
                            <h3 className="text-lg font-black text-white leading-tight truncate mb-1">
                              {task.title}
                            </h3>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusBadge status={task.status} />
                          {task.budget && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                              <Banknote className="w-3 h-3 text-emerald-400" />
                              {task.budget.toLocaleString()} ₽
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/5 text-[10px] font-bold text-indigo-400/80 uppercase tracking-wider flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                            {task._count.responses} откликов
                          </span>
                          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(task.createdAt, { addSuffix: true, locale: ru })}
                          </span>
                        </div>
                      </Card>
                    </Link>
                  </StaggerItem>
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
                  href={`/dashboard/my-tasks?page=${Math.max(1, page - 1)}`} 
                  disabled={page <= 1}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    href={`/dashboard/my-tasks?page=${i + 1}`}
                    isActive={page === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  href={`/dashboard/my-tasks?page=${Math.min(totalPages, page + 1)}`}
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
