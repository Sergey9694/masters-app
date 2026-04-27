"use server";

import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { chatService } from "@/services/chat.service";
import { emitToSocket } from "@/shared/lib/socket-emit";

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

    await emitToSocket({
      room: `conv:${parsedInput.conversationId}`,
      event: "new:message",
      data: {
        conversationId: parsedInput.conversationId,
        message: {
          ...message,
          createdAt: message.createdAt.toISOString(),
        },
      },
    });

    // Получаем участников диалога для уведомления
    const participants = await chatService.getConversationParticipants(parsedInput.conversationId);
    const otherParticipant = participants.find((p: { userId: string }) => p.userId !== ctx.userId);
    
    if (otherParticipant) {
      await emitToSocket({
        room: `user:${otherParticipant.userId}`,
        event: "new:message",
        data: {
          conversationId: parsedInput.conversationId,
          message: {
            ...message,
            createdAt: message.createdAt.toISOString(),
          },
        },
      });
    }

    return { message };
  });
