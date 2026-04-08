import { db } from "../db";
import { subHours } from "date-fns";

/**
 * Автоматически переводит устаревшие заявки в статус EXPIRED.
 * Выполняется для заявок со статусом OPEN, созданных более 48 часов назад.
 */
export async function expireOldTasks() {
  const threshold = subHours(new Date(), 48);

  try {
    const expiredCount = await db.taskRequest.updateMany({
      where: {
        status: "OPEN",
        createdAt: {
          lt: threshold,
        },
      },
      data: {
        status: "EXPIRED" as any,
      },
    });

    if (expiredCount.count > 0) {
      console.log(`[JOB: ExpireTasks] Archived ${expiredCount.count} obsolete tasks.`);
    }

    return expiredCount.count;
  } catch (error) {
    console.error("[JOB: ExpireTasks] Error during task expiration:", error);
    throw error;
  }
}
