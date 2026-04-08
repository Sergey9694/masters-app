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

      <StaggerItem className="flex items-center gap-4 mb-8">
        <BackButton />
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight">Уведомления</h1>
          {unreadCount > 0 && (
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">
              {unreadCount} непрочитанных
            </p>
          )}
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </StaggerItem>

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
