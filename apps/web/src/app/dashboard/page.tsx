export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/shared/lib/get-user";
import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import { DashboardContent } from "./DashboardContent";
import type { OrderCardData } from "@/shared/types/domain";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  // Load stats in parallel
  const isProvider = !!user.providerProfile;

  let unreadNotificationsCount = 0;
  try {
    unreadNotificationsCount = await db.notification.count({
      where: { userId: user.id, read: false },
    });
  } catch {
    // table may not exist yet before migration
  }

  const [myOrdersCount, openOrdersCount, customerActiveOrdersCount, openProposalsCount, recentOrdersRaw] =
    await Promise.all([
      db.order.count({ where: { clientId: user.id } }),
      db.order.count({ where: { clientId: user.id, status: "OPEN" } }),
      db.order.count({
        where: {
          clientId: user.id,
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      }),
      db.order.count({
        where: {
          clientId: user.id,
          status: "OPEN",
          proposals: { some: {} },
        },
      }),
      db.order.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          description: true,
          images: true,
          budget: true,
          address: true,
          createdAt: true,
          category: { select: { name: true } },
          client: { select: { firstName: true, avatar: true } },
          status: true,
          city: { select: { name: true } },
          _count: { select: { proposals: true } },
        },
      }),
    ]);

  const recentOrders: OrderCardData[] = recentOrdersRaw.map(o => ({
    ...o,
    proposalCount: o._count.proposals,
    city: o.city || { name: 'Неизвестно' }
  }));

  // Provider-specific stats
  const providerStats = isProvider
    ? {
        proposalsCount: await db.proposal.count({
          where: { providerId: user.providerProfile!.id },
        }),
        pendingProposalsCount: await db.proposal.count({
          where: { 
            providerId: user.providerProfile!.id,
            order: { status: "OPEN" }
          },
        }),
        activeOrdersCount: await db.order.count({
          where: {
            assignedProviderId: user.providerProfile!.id,
            status: "IN_PROGRESS",
          },
        }),
        rating: user.providerProfile!.rating,
        reviewsCount: await db.review.count({
          where: { providerId: user.providerProfile!.id },
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
          myOrdersCount,
          activeOrdersCount: customerActiveOrdersCount,
          openProposalsCount,
          unreadNotificationsCount,
          providerStats,
        }}
        recentOrders={recentOrders}
      />
    </div>
  );
}