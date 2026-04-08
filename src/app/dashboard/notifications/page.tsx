import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { BackButton } from "@/shared/ui/back-button";
import { MarkAllReadButton } from "./MarkAllReadButton";
import { NotificationItem } from "@/features/notifications/ui/NotificationItem";
import { PageHeader } from "@/shared/ui/page-header";

import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/shared/ui/pagination";

import { DEFAULT_PAGE_SIZE } from "@/shared/lib/constants";

interface NotificationsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  let notifications: Awaited<ReturnType<typeof db.notification.findMany>> = [];
  let totalCount = 0;

  try {
    const [notifs, count] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: [
          { read: "asc" },
          { createdAt: "desc" }
        ],
        skip: (page - 1) * DEFAULT_PAGE_SIZE,
        take: DEFAULT_PAGE_SIZE,
      }),
      db.notification.count({
        where: { userId: user.id }
      })
    ]);
    notifications = notifs;
    totalCount = count;
  } catch {
    // table may not exist yet or empty
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);
  const unreadAnywhere = totalCount > 0; // Simplified for UI check

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />

      <PageHeader 
        title="Уведомления"
        subtitle={unreadCount > 0 ? `${unreadCount} непрочитанных` : undefined}
        rightAction={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <StaggerItem>
          <div className="glass border border-dashed border-white/10 p-8 rounded-[24px] text-center">
            <Bell className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400">
              Пока нет уведомлений
            </p>
          </div>
        </StaggerItem>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <StaggerItem key={n.id}>
              <NotificationItem notification={n} />
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
                  href={`/dashboard/notifications?page=${Math.max(1, page - 1)}`} 
                  disabled={page <= 1}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    href={`/dashboard/notifications?page=${i + 1}`}
                    isActive={page === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  href={`/dashboard/notifications?page=${Math.min(totalPages, page + 1)}`}
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
