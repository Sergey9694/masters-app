"use server";

import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { chatService } from "@/services/chat.service";

export const markAsReadAction = authActionClient
  .schema(z.object({ conversationId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    await chatService.markAsRead(parsedInput.conversationId, ctx.userId);
  });
