import { db } from "@/shared/lib/db";

export async function getMetrics() {
  const [
    totalTasks,
    completedTasks,
    canceledTasks,
    totalResponses,
    avgCompletionTime,
    topCategories,
    activityByDay,
  ] = await Promise.all([
    db.taskRequest.count(),
    db.taskRequest.count({ where: { status: "COMPLETED" } }),
    db.taskRequest.count({ where: { status: "CANCELED" } }),
    db.taskResponse.count(),

    // Среднее время выполнения (от создания до завершения)
    db.$queryRaw<Array<{ avg_hours: number }>>`
      SELECT AVG(EXTRACT(EPOCH FROM (t2."createdAt" - t1."createdAt")) / 3600) as avg_hours
      FROM "TaskRequest" t1
      JOIN "TaskRequest" t2 ON t1.id = t2.id
      WHERE t1.status = 'COMPLETED'
    `,

    // Топ категорий
    db.category.findMany({
      select: {
        name: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { tasks: { _count: "desc" } },
      take: 10,
    }),

    // Активность по дням недели
    db.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT
        TO_CHAR("createdAt", 'Day') as day,
        COUNT(*)::bigint as count
      FROM "TaskRequest"
      GROUP BY TO_CHAR("createdAt", 'Day'), EXTRACT(DOW FROM "createdAt")
      ORDER BY EXTRACT(DOW FROM "createdAt") ASC
    `,
  ]);

  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : "0";
  const cancelRate = totalTasks > 0 ? ((canceledTasks / totalTasks) * 100).toFixed(1) : "0";
  const avgHours = avgCompletionTime[0]?.avg_hours
    ? Math.round(avgCompletionTime[0].avg_hours)
    : null;

  return {
    totalTasks,
    completedTasks,
    canceledTasks,
    totalResponses,
    completionRate,
    cancelRate,
    avgHours,
    topCategories,
    activityByDay: activityByDay.map((r) => ({
      day: r.day.trim(),
      count: Number(r.count),
    })),
  };
}
