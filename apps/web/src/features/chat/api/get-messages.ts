"use server";

import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { chatService } from "@/services/chat.service";

const schema = z.object({
  conversationId: z.string().uuid(),
  cursor: z.string().optional(),
});

export const getMessagesAction = authActionClient
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    return chatService.getMessages(
      parsedInput.conversationId,
      ctx.userId,
      parsedInput.cursor
    );
  });
