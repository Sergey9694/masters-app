import { getCurrentUser } from "@/shared/lib/get-user";
import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import { DashboardContent } from "./DashboardContent";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  // Load stats in parallel
  const isMaster = !!user.masterProfile;

  let unreadNotificationsCount = 0;
  try {
    unreadNotificationsCount = await db.notification.count({
      where: { userId: user.id, read: false },
    });
  } catch {
    // table may not exist yet before migration
  }

  const [myTasksCount, openResponsesCount, activeTasksCount] =
    await Promise.all([
      db.taskRequest.count({ where: { customerId: user.id } }),
      db.taskRequest.count({
        where: {
          customerId: user.id,
          status: "OPEN",
          responses: { some: {} },
        },
      }),
      isMaster
        ? db.taskRequest.count({
            where: {
              assignedMasterId: user.masterProfile!.id,
              status: "IN_PROGRESS",
            },
          })
        : 0,
    ]);

  // Master-specific stats
  const masterStats = isMaster
    ? {
        responsesCount: await db.taskResponse.count({
          where: { masterId: user.masterProfile!.id },
        }),
        activeTasksCount,
        rating: user.masterProfile!.rating,
        reviewsCount: await db.review.count({
          where: { masterId: user.masterProfile!.id },
        }),
      }
    : null;

  return (
    <div className="relative overflow-hidden min-h-screen">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

      <DashboardContent
        user={user}
        categories={categories}
        stats={{
          myTasksCount,
          openResponsesCount,
          unreadNotificationsCount,
          masterStats,
        }}
      />
    </div>
  );
}
