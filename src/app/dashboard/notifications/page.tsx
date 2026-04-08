import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Bell, CheckCheck, MessageSquare, Star, Briefcase, XCircle, PlusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { Card } from "@/shared/ui/card";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { MarkAllReadButton } from "./MarkAllReadButton";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  NEW_RESPONSE: {
    icon: <MessageSquare className="w-4 h-4" />,
    color: "text-blue-400 bg-blue-500/10",
  },
  RESPONSE_ACCEPTED: {
    icon: <CheckCheck className="w-4 h-4" />,
    color: "text-emerald-400 bg-emerald-500/10",
  },
  TASK_COMPLETED: {
    icon: <Briefcase className="w-4 h-4" />,
    color: "text-emerald-400 bg-emerald-500/10",
  },
  TASK_CANCELED: {
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-400 bg-red-500/10",
  },
  NEW_REVIEW: {
    icon: <Star className="w-4 h-4" />,
    color: "text-amber-400 bg-amber-500/10",
  },
  NEW_TASK: {
    icon: <PlusCircle className="w-4 h-4" />,
    color: "text-indigo-400 bg-indigo-500/10",
  },
};

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
        <Link
          href="/dashboard"
          replace
          className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
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
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.NEW_TASK;
            const inner = (
              <Card
                className={`glass border-none p-4 rounded-[20px] transition-all ${
                  n.read
                    ? "opacity-60"
                    : "border-l-2 border-l-blue-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${config.color} flex-shrink-0 mt-0.5`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white leading-tight mb-0.5">
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-400 leading-snug">{n.body}</p>
                    <p className="text-[10px] text-slate-600 mt-1.5">
                      {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: ru })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              </Card>
            );

            return (
              <StaggerItem key={n.id}>
                {n.taskId ? (
                  <Link href={`/dashboard/task/${n.taskId}`} className="block hover:opacity-90 transition-opacity">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </StaggerItem>
            );
          })}
        </div>
      )}
    </StaggerWrap>
  );
}
