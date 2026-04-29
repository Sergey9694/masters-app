import { notify, notifyProvidersInCategories } from "@/shared/lib/telegram/bot-notify";
import { db } from "@/shared/lib/db";

export const notificationService = {
  /**
   * Send notification to a specific user (In-app + Telegram)
   */
  send: notify,

  /**
   * Notify all providers in specific categories about a new order
   */
  notifyProviders: notifyProvidersInCategories,

  /**
   * Get user's notifications with pagination
   */
  async list(userId: string, pageSize = 20, cursor?: string) {
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = notifications.length > pageSize;
    const page = hasMore ? notifications.slice(0, pageSize) : notifications;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { notifications: page, nextCursor };
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    return db.notification.update({
      where: { id, userId },
      data: { read: true },
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    return db.notification.count({
      where: { userId, read: false },
    });
  }
};
