"use server";

import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { chatService } from "@/services/chat.service";
import { emitToSocket } from "@/shared/lib/socket-emit";

export const markAsReadAction = authActionClient
  .schema(z.object({ conversationId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    await chatService.markAsRead(parsedInput.conversationId, ctx.userId);
    
    // Notify client to refresh (sidebar, etc.)
    await emitToSocket({
      room: `user:${ctx.userId}`,
      event: "conversation:update",
      data: { conversationId: parsedInput.conversationId }
    });
  });
