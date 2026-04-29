"use server";

import { adminActionClient } from "@/shared/lib/safe-action";
import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/shared/lib/audit";

const schema = z.object({
  providerId: z.string().cuid(),
});

export const verifyProviderAction = adminActionClient
  .schema(schema)
  .action(async ({ parsedInput: { providerId }, ctx }) => {
    await db.providerProfile.update({
      where: { id: providerId },
      data: { isVerified: true },
    });

    await logAudit({
      userId: ctx.userId,
      action: "VERIFY_PROVIDER",
      entity: "ProviderProfile",
      entityId: providerId,
    });

    revalidatePath("/admin/provider-applications");
    return { success: true };
  });

export const rejectProviderAction = adminActionClient
  .schema(schema)
  .action(async ({ parsedInput: { providerId }, ctx }) => {
    await db.providerProfile.delete({
      where: { id: providerId },
    });

    await logAudit({
      userId: ctx.userId,
      action: "REJECT_PROVIDER",
      entity: "ProviderProfile",
      entityId: providerId,
    });

    revalidatePath("/admin/provider-applications");
    return { success: true };
  });
