"use client";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { useSocket } from "@/shared/hooks/use-socket";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ConversationPreview } from "@/services/chat.service";

interface Props {
  conversations: ConversationPreview[];
  activeId?: string;
  currentUserId: string;
}

function formatDate(date: Date) {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function ConversationList({ conversations, activeId, currentUserId }: Props) {
  const { socket } = useSocket();
  const router = useRouter();

  useEffect(() => {
    const handler = () => router.refresh();
    socket.on("new:message", handler);
    return () => { socket.off("new:message", handler); };
  }, [socket, router]);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">Нет диалогов</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border/50">
      {conversations.map((conv) => (
        <li key={conv.id}>
          <Link
            href={`/chat/${conv.id}`}
            className={cn(
              "flex items-start gap-3 px-4 py-3 transition hover:bg-muted",
              activeId === conv.id && "bg-muted"
            )}
          >
            <img
              src={conv.otherUser.avatar ?? "/default-avatar.png"}
              alt={conv.otherUser.firstName}
              className="size-10 rounded-full shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">{conv.otherUser.firstName}</span>
                {conv.lastMessage && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(conv.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">
                  {conv.lastMessage
                    ? (conv.lastMessage.senderId === currentUserId ? "Вы: " : "") + conv.lastMessage.text
                    : "Нет сообщений"}
                </p>
                {conv.unreadCount > 0 && (
                  <span className="shrink-0 size-5 flex items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
