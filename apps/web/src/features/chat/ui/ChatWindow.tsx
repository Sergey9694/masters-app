"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/shared/hooks/use-socket";
import { sendMessageAction, getMessagesAction, markAsReadAction } from "@/features/chat";
import type { MessageDTO } from "@/services/chat.service";
import type { MessageDTO as SocketMessageDTO } from "@/shared/lib/socket-events";
import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { TypingIndicator } from "./TypingIndicator";
import { MessageInput } from "./MessageInput";
import { ConversationHeader } from "./ConversationHeader";
import { Loader2 } from "lucide-react";

interface Props {
  conversationId: string;
  currentUserId: string;
  otherUser: { id: string; firstName: string; avatar: string | null };
  context: { orderId: string | null; listingId: string | null };
  initialMessages: MessageDTO[];
  showBack?: boolean;
}

function groupByDate(messages: MessageDTO[]) {
  const groups: { date: Date; messages: MessageDTO[] }[] = [];
  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt);
    const last = groups[groups.length - 1];
    if (!last || last.date.toDateString() !== msgDate.toDateString()) {
      groups.push({ date: msgDate, messages: [msg] });
    } else {
      last.messages.push(msg);
    }
  }
  return groups;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  otherUser,
  context,
  initialMessages,
  showBack,
}: Props) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length === 30);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.emit("join:conversation", conversationId);
    markAsReadAction({ conversationId });
    return () => {
      socket.emit("leave:conversation", conversationId);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    const onMessage = ({
      conversationId: cId,
      message,
    }: {
      conversationId: string;
      message: SocketMessageDTO; // createdAt: string (ISO) from socket event
    }) => {
      if (cId !== conversationId) return;
      const mapped: MessageDTO = {
        id: message.id,
        text: message.text,
        attachments: message.attachments,
        senderId: message.senderId,
        sender: message.sender,
        createdAt: new Date(message.createdAt),
        deletedAt: null,
        deletedBy: null,
      };
      setMessages((prev) => [...prev, mapped]);
      markAsReadAction({ conversationId });
    };

    const onTypingStart = ({
      userId,
      userName,
    }: {
      conversationId: string;
      userId: string;
      userName: string;
    }) => {
      if (userId !== currentUserId) setTypingUser(userName);
    };

    const onTypingStop = ({
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (userId !== currentUserId) setTypingUser(null);
    };

    const onDeleted = ({
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, deletedAt: new Date(), text: "[сообщение удалено]" }
            : m
        )
      );
    };

    socket.on("new:message", onMessage);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("message:deleted", onDeleted);

    return () => {
      socket.off("new:message", onMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("message:deleted", onDeleted);
    };
  }, [socket, conversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const result = await getMessagesAction({
        conversationId,
        cursor: messages[0].id,
      });
      const older = result?.data ?? [];
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === 30);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, messages, conversationId]);

  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleSend = async (text: string) => {
    const optimistic: MessageDTO = {
      id: `opt-${Date.now()}`,
      text,
      attachments: [],
      senderId: currentUserId,
      sender: { id: currentUserId, firstName: "Вы", avatar: null },
      createdAt: new Date(),
      deletedAt: null,
      deletedBy: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await sendMessageAction({ conversationId, text });
    if (result?.data?.message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? result.data!.message : m))
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  const groups = groupByDate(messages);

  return (
    <div className="flex flex-col h-full">
      <ConversationHeader
        otherUser={otherUser}
        context={context}
        showBack={showBack}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
        <div ref={topRef} className="h-1" />
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {groups.map(({ date, messages: groupMsgs }) => (
          <div key={date.toISOString()} className="flex flex-col gap-1">
            <DateSeparator date={date} />
            {groupMsgs.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
              />
            ))}
          </div>
        ))}

        {typingUser && <TypingIndicator userName={typingUser} />}
        <div ref={bottomRef} />
      </div>

      <MessageInput conversationId={conversationId} onSend={handleSend} />
    </div>
  );
}
