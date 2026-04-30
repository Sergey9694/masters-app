"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { startConversationAction } from "../api/start-conversation";

interface Props {
  otherUserId: string;
  orderId?: string;
  listingId?: string;
  className?: string;
}

export function StartChatButton({ otherUserId, orderId, listingId, className }: Props) {
  const router = useRouter();
  const { execute, isPending } = useAction(startConversationAction, {
    onSuccess: ({ data }) => {
      if (data?.conversationId) router.push(`/chat/${data.conversationId}`);
    },
    onError: ({ error }) => toast.error(error.serverError || "Не удалось открыть чат"),
  });

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      disabled={isPending}
      onClick={() => execute({ targetUserId: otherUserId, orderId, listingId })}
    >
      <MessageCircle className="size-4 mr-2" />
      Написать
    </Button>
  );
}
