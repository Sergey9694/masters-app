import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { cn } from "@/shared/lib/cn";
import { NotificationItemLight } from "@/features/notifications/ui/NotificationItemLight";
import { DEFAULT_PAGE_SIZE } from "@/shared/lib/constants";
import { MarkAllReadButton } from "./MarkAllReadButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Уведомления — УслугиРядом",
};

interface NotificationsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const { page: pageParam } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const page = Math.max(1, Number(pageParam) || 1);

  let notifications: Awaited<ReturnType<typeof db.notification.findMany>> = [];
  let totalCount = 0;
  let unreadCount = 0;

  try {
    const [notifs, count, unread] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: [{ read: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * DEFAULT_PAGE_SIZE,
        take: DEFAULT_PAGE_SIZE,
      }),
      db.notification.count({ where: { userId: user.id } }),
      db.notification.count({ where: { userId: user.id, read: false } }),
    ]);
    notifications = notifs;
    totalCount = count;
    unreadCount = unread;
  } catch {
    // Таблица может быть ещё не готова — показываем пустое состояние
  }

  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Уведомления
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} непрочитан${pluralUnread(unreadCount)}`
              : "Все уведомления прочитаны"}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Bell className="size-6" />
          </span>
          <div>
            <p className="text-base font-semibold">Пока нет уведомлений</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Здесь будут появляться отклики, обновления заказов и отзывы
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {notifications.map((n) => (
            <NotificationItemLight key={n.id} notification={n} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const active = p === page;
            return (
              <Link
                key={p}
                href={`/notifications?page=${p}`}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/60 hover:text-primary"
                )}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function pluralUnread(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "о";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "ых";
  return "ых";
}
