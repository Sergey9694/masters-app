import { db } from "@/shared/lib/db";
import type { NotificationType } from "@prisma/client";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  taskId?: string;
}

/**
 * Create in-app notification + send Telegram push via Bot API.
 * Fire-and-forget — never throws.
 */
export async function notify(params: NotifyParams) {
  try {
    // 1. Save to DB
    await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        taskId: params.taskId ?? null,
      },
    });

    // 2. Send Telegram message if bot token is configured
    if (!BOT_TOKEN) return;

    const user = await db.user.findUnique({
      where: { id: params.userId },
      select: { telegramId: true },
    });

    if (!user?.telegramId) return;

    const taskUrl = params.taskId
      ? `${WEBAPP_URL}/dashboard/task/${params.taskId}`
      : `${WEBAPP_URL}/dashboard/notifications`;

    const text = `<b>${escapeHtml(params.title)}</b>\n${escapeHtml(params.body)}`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: user.telegramId.toString(),
        text,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Открыть", web_app: { url: taskUrl } }],
          ],
        },
      }),
    });
  } catch {
    // Notification failure should never break the main flow
  }
}

/**
 * Notify all masters in given categories about a new task.
 */
export async function notifyMastersInCategories(
  categoryIds: string[],
  excludeUserId: string,
  taskTitle: string,
  taskId: string,
) {
  try {
    const masters = await db.masterCategory.findMany({
      where: { categoryId: { in: categoryIds } },
      select: {
        master: {
          select: {
            userId: true,
          },
        },
      },
      distinct: ["masterId"],
    });

    const userIds = masters
      .map((m) => m.master.userId)
      .filter((id) => id !== excludeUserId);

    // Batch create notifications
    if (userIds.length > 0) {
      await db.notification.createMany({
        data: userIds.map((uid) => ({
          userId: uid,
          type: "NEW_TASK" as const,
          title: "Новая заявка",
          body: taskTitle,
          taskId,
        })),
      });
    }

    // Send Telegram pushes (non-blocking)
    if (!BOT_TOKEN) return;

    const users = await db.user.findMany({
      where: { id: { in: userIds }, telegramId: { not: null } },
      select: { telegramId: true },
    });

    const taskUrl = `${WEBAPP_URL}/dashboard/task/${taskId}`;

    await Promise.allSettled(
      users.map((u) =>
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: u.telegramId!.toString(),
            text: `<b>Новая заявка в вашей категории</b>\n${escapeHtml(taskTitle)}`,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "Откликнуться", web_app: { url: taskUrl } }],
              ],
            },
          }),
        }),
      ),
    );
  } catch {
    // silent
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
