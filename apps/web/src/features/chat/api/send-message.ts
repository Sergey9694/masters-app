"use server";

import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { chatService } from "@/services/chat.service";
import { getIO } from "@/shared/lib/get-io";

const schema = z.object({
  conversationId: z.string().uuid(),
  text: z.string().min(1).max(4000),
  attachments: z.array(z.string().url()).max(10).default([]),
});

export const sendMessageAction = authActionClient
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const message = await chatService.sendMessage(
      parsedInput.conversationId,
      ctx.userId,
      parsedInput.text,
      parsedInput.attachments
    );

    const io = getIO();
    if (io) {
      io.to(`conv:${parsedInput.conversationId}`).emit("new:message", {
        conversationId: parsedInput.conversationId,
        message: {
          ...message,
          createdAt: message.createdAt.toISOString(),
        },
      });
    }

    return { message };
  });
