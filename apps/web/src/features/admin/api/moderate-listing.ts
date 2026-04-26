"use server";

import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";
import { adminActionClient } from "@/shared/lib/safe-action";
import { logAudit } from "@/shared/lib/audit";
import { z } from "zod";

export const approveListing = adminActionClient
  .schema(z.string())
  .action(async ({ parsedInput: listingId, ctx }) => {
    const listing = await db.serviceListing.findUnique({
      where: { id: listingId },
      select: { status: true },
    });
    if (!listing) throw new Error("Объявление не найдено");

    await db.serviceListing.update({
      where: { id: listingId },
      data: { status: "ACTIVE" },
    });

    await logAudit({
      userId: ctx.userId,
      action: "UPDATE",
      entity: "ServiceListing",
      entityId: listingId,
      metadata: { status: "ACTIVE" },
    });

    revalidatePath("/admin/listings");
    revalidatePath("/listings");
    return { success: true };
  });

export const rejectListing = adminActionClient
  .schema(z.string())
  .action(async ({ parsedInput: listingId, ctx }) => {
    const listing = await db.serviceListing.findUnique({
      where: { id: listingId },
      select: { status: true },
    });
    if (!listing) throw new Error("Объявление не найдено");

    await db.serviceListing.update({
      where: { id: listingId },
      data: { status: "REJECTED" },
    });

    await logAudit({
      userId: ctx.userId,
      action: "UPDATE",
      entity: "ServiceListing",
      entityId: listingId,
      metadata: { status: "REJECTED" },
    });

    revalidatePath("/admin/listings");
    revalidatePath("/listings");
    return { success: true };
  });

export const deleteListingAdminAction = adminActionClient
  .schema(z.string())
  .action(async ({ parsedInput: listingId, ctx }) => {
    await db.serviceListing.delete({ where: { id: listingId } });

    await logAudit({
      userId: ctx.userId,
      action: "DELETE",
      entity: "ServiceListing",
      entityId: listingId,
    });

    revalidatePath("/admin/listings");
    revalidatePath("/listings");
    return { success: true };
  });
