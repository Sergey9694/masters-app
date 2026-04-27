"use server";

import { z } from "zod";
import { adminActionClient } from "@/shared/lib/safe-action";
import { chatService } from "@/services/chat.service";

export const deleteMessageAdminAction = adminActionClient
  .schema(z.object({ messageId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    await chatService.deleteMessage(parsedInput.messageId, ctx.userId);
    return { success: true };
  });

export const blockUserChatAction = adminActionClient
  .schema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput }) => {
    await chatService.blockUserChat(parsedInput.userId);
    return { success: true };
  });

export const unblockUserChatAction = adminActionClient
  .schema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput }) => {
    await chatService.unblockUserChat(parsedInput.userId);
    return { success: true };
  });

export const exportConversationAction = adminActionClient
  .schema(z.object({ conversationId: z.string() }))
  .action(async ({ parsedInput }) => {
    const buffer = await chatService.exportConversation(parsedInput.conversationId, "csv");
    return { csv: buffer.toString("utf8") };
  });
