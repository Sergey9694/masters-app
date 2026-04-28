"use server";

import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { chatService } from "@/services/chat.service";

export const getConversationsAction = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    return chatService.getConversations(ctx.userId);
  });
