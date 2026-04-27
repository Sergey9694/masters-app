"use server";

import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { chatService } from "@/services/chat.service";

const schema = z.object({
  targetUserId: z.string().uuid(),
  orderId: z.string().optional(),
  listingId: z.string().optional(),
});

export const startConversationAction = authActionClient
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const conversation = await chatService.startConversation(
      ctx.userId,
      parsedInput.targetUserId,
      { orderId: parsedInput.orderId, listingId: parsedInput.listingId }
    );
    return { conversationId: conversation.id };
  });
