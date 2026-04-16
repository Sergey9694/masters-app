import { db } from "@/shared/lib/db";
import type { NotificationType } from "@prisma/client";

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function getWebAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "";
}

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
    const botToken = getBotToken();
    const webAppUrl = getWebAppUrl();
    if (!botToken) return;

    const user = await db.user.findUnique({
      where: { id: params.userId },
      select: { telegramId: true },
    });

    if (!user?.telegramId) return;

    const taskUrl = params.taskId
      ? `${webAppUrl}/dashboard/task/${params.taskId}`
      : `${webAppUrl}/dashboard/notifications`;

    const text = `<b>${escapeHtml(params.title)}</b>\n${escapeHtml(params.body)}`;

    const isHttps = webAppUrl.startsWith("https://");
    const reply_markup = {
      inline_keyboard: [
        [
          isHttps
            ? { text: "Открыть", web_app: { url: taskUrl } }
            : { text: "Открыть", url: taskUrl.startsWith("http") ? taskUrl : `${webAppUrl}${taskUrl}` },
        ],
      ],
    };

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: user.telegramId.toString(),
        text,
        parse_mode: "HTML",
        reply_markup,
      }),
    });

    if (!telegramRes.ok) {
      const errorText = await telegramRes.text();
      console.error(`[notify] Telegram API error: ${telegramRes.status} ${errorText}`);
    }
  } catch (error) {
    console.error("[notify] Error sending notification:", error);
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
    const botToken2 = getBotToken();
    const webAppUrl2 = getWebAppUrl();
    if (!botToken2) return;

    const users = await db.user.findMany({
      where: { id: { in: userIds }, telegramId: { not: null } },
      select: { telegramId: true },
    });

    const isHttps = webAppUrl2.startsWith("https://");
    const taskUrl = `${webAppUrl2}/dashboard/task/${taskId}`;

    await Promise.allSettled(
      users.map(async (u) => {
        const reply_markup = {
          inline_keyboard: [
            [
              isHttps
                ? { text: "Откликнуться", web_app: { url: taskUrl } }
                : { text: "Откликнуться", url: taskUrl },
            ],
          ],
        };

        const res = await fetch(`https://api.telegram.org/bot${botToken2}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: u.telegramId!.toString(),
            text: `<b>Новая заявка в вашей категории</b>\n${escapeHtml(taskTitle)}`,
            parse_mode: "HTML",
            reply_markup,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[notifyMastersInCategories] Telegram error for ${u.telegramId}: ${res.status} ${errorText}`);
        }
      }),
    );
  } catch (error) {
    console.error("[notifyMastersInCategories] Error:", error);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
