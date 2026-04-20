"use server";

import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteUser(userId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  if (session.userId === userId) {
    throw new Error("Нельзя удалить свой аккаунт");
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) throw new Error("Пользователь не найден");
  if (target.role === "ADMIN") {
    throw new Error("Нельзя удалить другого администратора");
  }

  await db.$transaction(async (tx) => {
    const provider = await tx.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (provider) {
      await tx.proposal.deleteMany({ where: { providerId: provider.id } });
      await tx.serviceListing.deleteMany({ where: { providerId: provider.id } });
      await tx.providerCategory.deleteMany({ where: { providerId: provider.id } });
      await tx.order.updateMany({
        where: { assignedProviderId: provider.id },
        data: { assignedProviderId: null },
      });
      await tx.review.deleteMany({ where: { providerId: provider.id } });
    }

    const orderIds = (
      await tx.order.findMany({ where: { clientId: userId }, select: { id: true } })
    ).map((o) => o.id);

    if (orderIds.length > 0) {
      await tx.proposal.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.review.deleteMany({ where: { orderId: { in: orderIds } } });
    }

    await tx.review.deleteMany({ where: { authorId: userId } });
    await tx.order.deleteMany({ where: { clientId: userId } });

    if (provider) {
      await tx.providerProfile.delete({ where: { id: provider.id } });
    }

    await tx.notification.deleteMany({ where: { userId } });
    await tx.auditLog.updateMany({ where: { userId }, data: { userId: null } });

    // Account и Session удаляются каскадно через onDelete: Cascade в схеме
    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath("/admin/users");
}
