"use client";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { useSocket } from "@/shared/hooks/use-socket";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ConversationPreview, MessageDTO } from "@uslugi/shared-types";

import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";

interface Props {
  conversations: ConversationPreview[];
  activeId?: string;
  currentUserId: string;
}

function formatDate(date: string | Date) {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function ConversationList({ conversations, activeId, currentUserId }: Props) {
  const { socket } = useSocket(currentUserId);
  const [list, setList] = useState(conversations);
  const router = useRouter();

  // Sync with props if they change (e.g. on manual refresh)
  useEffect(() => {
    setList(conversations);
  }, [conversations]);

  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  // Initialize online status from conversations
  useEffect(() => {
    const initialStatuses: Record<string, boolean> = {};
    conversations.forEach(c => {
      if (c.otherUser.id) {
        initialStatuses[c.otherUser.id] = !!c.otherUser.isOnline;
      }
    });
    setOnlineUsers(initialStatuses);
  }, [conversations]);

  useEffect(() => {
    if (!socket) return;
    
    const onMessage = (data: { conversationId: string; message: MessageDTO }) => {
      if (data.conversationId !== activeId) {
        router.refresh();
      }
    };

    const onUserStatus = (data: { userId: string; isOnline: boolean }) => {
      setOnlineUsers(prev => ({ ...prev, [data.userId]: data.isOnline }));
    };

    socket.on("new:message", onMessage);
    socket.on("user:status", onUserStatus);
    socket.on("conversation:update", () => router.refresh());

    return () => { 
      socket.off("new:message", onMessage); 
      socket.off("user:status", onUserStatus);
      socket.off("conversation:update");
    };
  }, [socket, router, activeId]);

  const sortedList = [...list].sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <p className="text-xl">💬</p>
        </div>
        <p className="text-sm font-medium text-foreground">Нет диалогов</p>
        <p className="text-xs text-muted-foreground mt-1">
          Откликнитесь на заказ, чтобы начать общение
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1 p-2">
      {sortedList.map((conv) => (
        <li key={conv.id}>
          <Link
            href={`/chat/${conv.id}`}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
              activeId === conv.id 
                ? "bg-primary/10 ring-1 ring-primary/20" 
                : "hover:bg-surface/80 hover:shadow-sm"
            )}
          >
            <div className="relative shrink-0">
              <Avatar size="lg" className="ring-2 ring-background">
                {conv.otherUser.avatar && (
                  <AvatarImage 
                    src={conv.otherUser.avatar} 
                    alt={conv.otherUser.firstName} 
                    className="transition group-hover:scale-105"
                  />
                )}
                <AvatarFallback>{conv.otherUser.firstName[0]}</AvatarFallback>
              </Avatar>
              {/* Индикатор онлайна */}
              {onlineUsers[conv.otherUser.id] && (
                <div className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-background animate-in zoom-in duration-300" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "font-semibold text-sm truncate",
                  conv.unreadCount > 0 ? "text-foreground" : "text-foreground/80"
                )}>
                  {conv.otherUser.firstName}
                </span>
                {conv.lastMessage && (
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                    {formatDate(conv.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={cn(
                  "text-xs truncate max-w-[160px]",
                  conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {conv.lastMessage
                    ? (conv.lastMessage.senderId === currentUserId ? "Вы: " : "") + conv.lastMessage.text
                    : "Начните общение"}
                </p>
                
                {conv.unreadCount > 0 && (
                  <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-1 shadow-sm">
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
