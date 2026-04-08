import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Banknote, ChevronRight, CheckCircle2 } from "lucide-react";
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
            category: { select: { name: true } },
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
              title: "Отмененные",
              color: "red" as const,
              items: responses.filter(r => 
                r.task.status === "CANCELED" || 
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
                {group.items.map((r) => {
                  const isChosen = r.task.assignedMasterId === user.masterProfile!.id;
                  return (
                    <StaggerItem key={r.id}>
                      <Link href={`/dashboard/task/${r.task.id}`}>
                        <Card className="glass border-none p-5 rounded-[24px] hover:bg-white/5 transition-all group">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <Badge variant="category" className="mb-2">
                                {r.task.category.name}
                              </Badge>
                              <h3 className="text-lg font-black text-white leading-tight truncate mb-1">
                                {r.task.title}
                              </h3>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge status={r.task.status} />
                            {isChosen && (
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 flex items-center gap-1 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Вы выбраны
                              </span>
                            )}
                            {r.price && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                                <Banknote className="w-3 h-3 text-emerald-400" />
                                {r.price.toLocaleString()} ₽
                              </span>
                            )}
                            <span className="ml-auto text-[10px] text-slate-500">
                              {formatDistanceToNow(r.createdAt, { addSuffix: true, locale: ru })}
                            </span>
                          </div>
                        </Card>
                      </Link>
                    </StaggerItem>
                  );
                })}
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
