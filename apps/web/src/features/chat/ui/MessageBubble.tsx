"use client";

import { cn } from "@/shared/lib/cn";
import type { MessageDTO } from "@/services/chat.service";

interface Props {
  message: MessageDTO;
  isOwn: boolean;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, isOwn }: Props) {
  const isDeleted = !!message.deletedAt;

  return (
    <div className={cn("flex gap-2 max-w-[75%]", isOwn ? "ml-auto flex-row-reverse" : "")}>
      {!isOwn && (
        <img
          src={message.sender.avatar ?? "/default-avatar.png"}
          alt={message.sender.firstName}
          className="size-7 rounded-full shrink-0 mt-1"
        />
      )}
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isOwn
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-surface text-foreground rounded-tl-sm",
          isDeleted && "opacity-50 italic"
        )}
      >
        {!isOwn && !isDeleted && (
          <p className="text-xs font-medium mb-0.5 text-primary">{message.sender.firstName}</p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <p
          className={cn(
            "text-[10px] mt-0.5",
            isOwn ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
          )}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
