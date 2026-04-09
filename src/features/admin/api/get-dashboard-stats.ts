import { db } from "@/shared/lib/db";

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    usersTotal,
    usersToday,
    usersWeek,
    tasksOpen,
    tasksInProgress,
    tasksCompleted,
    pendingMasters,
    responsesToday,
    reviewsTotal,
    avgRating,
    tasksByDay,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: todayStart } } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.taskRequest.count({ where: { status: "OPEN" } }),
    db.taskRequest.count({ where: { status: "IN_PROGRESS" } }),
    db.taskRequest.count({ where: { status: "COMPLETED" } }),
    db.masterProfile.count({ where: { isVerified: false } }),
    db.taskResponse.count({ where: { createdAt: { gte: todayStart } } }),
    db.review.count(),
    db.masterProfile.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    }),
    db.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT
        DATE("createdAt")::text as date,
        COUNT(*)::bigint as count
      FROM "TaskRequest"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `,
  ]);

  return {
    users: { total: usersTotal, today: usersToday, week: usersWeek },
    tasks: {
      open: tasksOpen,
      inProgress: tasksInProgress,
      completed: tasksCompleted,
    },
    pendingMasters,
    responsesToday,
    reviews: { total: reviewsTotal },
    avgRating:
      avgRating._count.rating > 0
        ? Number(avgRating._avg.rating?.toFixed(2))
        : 0,
    tasksByDay: tasksByDay.map((r) => ({
      date: r.date,
      count: Number(r.count),
    })),
  };
}
