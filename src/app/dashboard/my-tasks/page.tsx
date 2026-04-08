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

export default async function MyTasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const tasks = await db.taskRequest.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      budget: true,
      createdAt: true,
      category: { select: { name: true } },
      _count: { select: { responses: true } },
    },
  });

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
        <div className="space-y-3">
          {tasks.map((task) => {
            return (
              <StaggerItem key={task.id}>
                <Link href={`/dashboard/task/${task.id}`}>
                  <Card className="glass border-none p-5 rounded-[24px] hover:bg-white/5 transition-all group">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                          {task.category.name}
                        </p>
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
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
            );
          })}
        </div>
      )}
    </StaggerWrap>
  );
}
