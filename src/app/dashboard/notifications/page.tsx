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

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  let notifications: Awaited<ReturnType<typeof db.notification.findMany>> = [];
  try {
    notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    // table may not exist yet
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

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
    </StaggerWrap>
  );
}
