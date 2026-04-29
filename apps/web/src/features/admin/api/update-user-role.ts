"use server";

import { adminActionClient } from "@/shared/lib/safe-action";
import { db } from "@/shared/lib/db";
import { Role } from "@/shared/types/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/shared/lib/audit";

const schema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["USER", "PROVIDER", "ADMIN"]),
});

export const updateUserRoleAction = adminActionClient
  .schema(schema)
  .action(async ({ parsedInput: { userId, role }, ctx }) => {
    await db.user.update({
      where: { id: userId },
      data: { role },
    });

    await logAudit({
      userId: ctx.userId,
      action: "UPDATE_USER_ROLE",
      entity: "User",
      entityId: userId,
      metadata: { newRole: role },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
