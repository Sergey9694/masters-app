"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient, adminActionClient } from "@/shared/lib/safe-action";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { emitToSocket } from "@/shared/lib/socket-emit";
import { trustService } from "@/services/trust.service";
import { blockUserSchema, reportTargetSchema, resolveReportSchema } from "../model/schema";

export const blockUserAction = authActionClient
  .schema(blockUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const block = await trustService.blockUser(ctx.userId, parsedInput.blockedId, {
      conversationId: parsedInput.conversationId,
      reason: parsedInput.reason,
    });

    await Promise.all([
      parsedInput.conversationId
        ? emitToSocket({
            room: `user:${ctx.userId}`,
            event: "conversation:update",
            data: { conversationId: parsedInput.conversationId },
          })
        : Promise.resolve(false),
      parsedInput.conversationId
        ? emitToSocket({
            room: `user:${parsedInput.blockedId}`,
            event: "conversation:update",
            data: { conversationId: parsedInput.conversationId },
          })
        : Promise.resolve(false),
      parsedInput.conversationId
        ? emitToSocket({
            room: `conv:${parsedInput.conversationId}`,
            event: "conversation:update",
            data: { conversationId: parsedInput.conversationId },
          })
        : Promise.resolve(false),
    ]);

    revalidatePath("/chat");
    if (parsedInput.conversationId) revalidatePath(`/chat/${parsedInput.conversationId}`);
    return { blockId: block.id };
  });

export const unblockUserAction = authActionClient
  .schema(z.object({ blockedId: z.string().uuid(), conversationId: z.string().uuid().optional() }))
  .action(async ({ parsedInput, ctx }) => {
    await trustService.unblockUser(ctx.userId, parsedInput.blockedId);

    const payload = {
      blockerId: ctx.userId,
      blockedId: parsedInput.blockedId,
      conversationId: parsedInput.conversationId,
    };
    await Promise.all([
      emitToSocket({ room: `user:${ctx.userId}`, event: "user:blocked", data: payload }),
      emitToSocket({ room: `user:${parsedInput.blockedId}`, event: "user:blocked", data: payload }),
      parsedInput.conversationId
        ? emitToSocket({
            room: `conv:${parsedInput.conversationId}`,
            event: "conversation:update",
            data: { conversationId: parsedInput.conversationId },
          })
        : Promise.resolve(false),
    ]);

    revalidatePath("/chat");
    if (parsedInput.conversationId) revalidatePath(`/chat/${parsedInput.conversationId}`);
    return { success: true };
  });

export const reportTargetAction = authActionClient
  .schema(reportTargetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const rl = await checkRateLimit({
      key: `trust:report:${ctx.userId}`,
      limit: 5,
      windowSec: 3600,
    });
    if (!rl.allowed) {
      throw new Error(`Слишком много жалоб. Попробуйте через ${rl.retryAfterSec} сек.`);
    }

    const report = await trustService.createReport({
      ...parsedInput,
      reporterId: ctx.userId,
    });

    revalidatePath("/admin/reports");
    return { reportId: report.id };
  });

export const resolveReportAction = adminActionClient
  .schema(resolveReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    await trustService.resolveReport(parsedInput.reportId, ctx.userId, {
      status: parsedInput.status,
      adminNotes: parsedInput.adminNotes,
      actionTaken: parsedInput.actionTaken,
    });
    revalidatePath("/admin/reports");
    return { success: true };
  });
