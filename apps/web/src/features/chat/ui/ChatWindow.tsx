"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/shared/hooks/use-socket";
import { sendMessageAction, getMessagesAction, markAsReadAction } from "@/features/chat";
import type { ConversationPreview, MessageDTO } from "@uslugi/shared-types";
import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { TypingIndicator } from "./TypingIndicator";
import { MessageInput } from "./MessageInput";
import { ConversationHeader } from "./ConversationHeader";
import { BlockedState } from "@/features/trust/ui/BlockedState";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

interface Props {
  conversationId: string;
  currentUserId: string;
  otherUser: { 
    id: string; 
    firstName: string; 
    lastName: string | null; 
    avatar: string | null; 
    lastSeenAt?: string | null; 
    status?: "online" | "offline" 
  };
  context: { 
    orderId: string | null; 
    orderSlug?: string | null;
    categorySlug?: string | null;
    citySlug?: string | null;
    listingId: string | null; 
    listingSlug?: string | null;
  };
  initialMessages: MessageDTO[];
  initialBlockState: ConversationPreview["blockState"];
  showBack?: boolean;
}

type TypingMessage = MessageDTO & { isTyping: true };
type DisplayMessage = MessageDTO | TypingMessage;

export function ChatWindow({
  conversationId,
  currentUserId,
  otherUser,
  context,
  initialMessages,
  initialBlockState,
  showBack,
}: Props) {
  const router = useRouter();
  const { socket } = useSocket(currentUserId);
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<"online" | "offline">(otherUser.status || "offline");
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(otherUser.lastSeenAt || null);
  const [blockState, setBlockState] = useState(initialBlockState);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length === 30);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    setBlockState(initialBlockState);
  }, [initialBlockState]);

  // Автоматический скролл вниз при изменении количества сообщений или статуса печати
  const displayMessages: DisplayMessage[] = typingUser 
    ? [...messages, { 
        id: 'typing-indicator', 
        isTyping: true, 
        text: '', 
        senderId: 'typing', 
        createdAt: new Date().toISOString(),
        attachments: [],
        sender: { id: 'typing', firstName: typingUser, avatar: null }
      }] 
    : messages;

  useEffect(() => {
    if (virtuosoRef.current && displayMessages.length > 0) {
      virtuosoRef.current.scrollToIndex({
        index: displayMessages.length - 1,
        behavior: "smooth",
        align: "end"
      });
    }
  }, [displayMessages.length]);

  useEffect(() => {
    const join = () => {
      socket.emit("join:conversation", conversationId);
      markAsReadAction({ conversationId });
    };

    if (socket.connected) {
      join();
    }

    socket.on("connect", join);
    
    return () => {
      socket.off("connect", join);
      socket.emit("leave:conversation", conversationId);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    const onMessage = ({
      conversationId: cId,
      message,
    }: {
      conversationId: string;
      message: MessageDTO;
    }) => {
      if (cId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        markAsReadAction({ conversationId });
        
        // Сбрасываем "печатает", если сообщение пришло от того же пользователя
        if (message.senderId === otherUser.id) {
          setTypingUser(null);
        }

        // Virtuoso с followOutput="smooth" сам прокрутит вниз при добавлении сообщения
      }
    };

    const onUserStatus = ({
      userId,
      status,
      lastSeenAt: lastSeen,
    }: {
      userId: string;
      status: "online" | "offline";
      lastSeenAt: string;
    }) => {
      if (userId === otherUser.id) {
        setOnlineStatus(status);
        setLastSeenAt(lastSeen);
      }
    };

    const onTypingStart = ({
      userId,
      userName,
      conversationId: cId,
    }: {
      conversationId: string;
      userId: string;
      userName: string;
    }) => {
      if (cId === conversationId && userId !== currentUserId) {
        setTypingUser(userName);
      }
    };

    const onTypingStop = ({
      userId,
      conversationId: cId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (cId === conversationId && userId !== currentUserId) {
        setTypingUser(null);
      }
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
            ? { ...m, deletedAt: new Date().toISOString(), text: "[сообщение удалено]" }
            : m
        )
      );
    };

    const onUserBlocked = ({
      blockerId,
      blockedId,
      conversationId: blockedConversationId,
    }: {
      blockerId: string;
      blockedId: string;
      conversationId?: string;
    }) => {
      const affectsCurrentUser = blockerId === currentUserId || blockedId === currentUserId;
      const affectsOtherUser = blockerId === otherUser.id || blockedId === otherUser.id;
      const affectsConversation = !blockedConversationId || blockedConversationId === conversationId;
      if (!affectsCurrentUser || !affectsOtherUser || !affectsConversation) return;

      setBlockState({
        blockedByMe: blockerId === currentUserId,
        blockedMe: blockerId === otherUser.id,
        isBlocked: true,
      });
      router.refresh();
    };

    const onConversationUpdate = ({ conversationId: updatedConversationId }: { conversationId: string }) => {
      if (updatedConversationId === conversationId) router.refresh();
    };

    socket.on("new:message", onMessage);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("message:deleted", onDeleted);
    socket.on("user:status", onUserStatus);
    socket.on("user:blocked", onUserBlocked);
    socket.on("conversation:update", onConversationUpdate);

    return () => {
      socket.off("new:message", onMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("message:deleted", onDeleted);
      socket.off("user:status", onUserStatus);
      socket.off("user:blocked", onUserBlocked);
      socket.off("conversation:update", onConversationUpdate);
    };
  }, [socket, conversationId, currentUserId, otherUser.id, router]);


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
      createdAt: new Date().toISOString(),
      deletedAt: null,
      deletedBy: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await sendMessageAction({ conversationId, text });
    if (result?.data?.message) {
      const realMessage = result.data.message;
      setMessages((prev) => {
        // 1. Убираем оптимистичное сообщение
        const filtered = prev.filter((m) => m.id !== optimistic.id);
        // 2. Проверяем, не пришло ли оно уже через сокет
        if (filtered.some((m) => m.id === realMessage.id)) {
          return filtered;
        }
        // 3. Если нет, добавляем реальное
        return [...filtered, realMessage];
      });
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(result?.serverError || "Не удалось отправить сообщение");
    }
  };

  // const groups = groupByDate(messages);

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
      <ConversationHeader
        otherUser={otherUser}
        context={context}
        showBack={showBack}
        status={onlineStatus}
        lastSeenAt={lastSeenAt}
        conversationId={conversationId}
        blockState={blockState}
        onBlockStateChange={setBlockState}
      />

      <div className="flex-1 overflow-hidden relative">
        <Virtuoso
          ref={virtuosoRef}
          data={displayMessages}
          initialTopMostItemIndex={displayMessages.length - 1}
          followOutput={(isAtBottom) => (isAtBottom ? "smooth" : false)}
          alignToBottom
          className="scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-primary/30 transition-colors"
          style={{ height: '100%' }}
          components={{
            Header: () => (
              <div className="flex flex-col">
                <div ref={topRef} className="h-1 shrink-0" />
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-5 animate-spin text-primary/60" />
                  </div>
                )}
              </div>
            ),
            Footer: () => (
              <div ref={bottomRef} className="h-4 shrink-0" />
            )
          }}
          itemContent={(index, msg) => {
            if ("isTyping" in msg) {
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-2"
                >
                  <TypingIndicator userName={typingUser!} />
                </motion.div>
              );
            }

            const prevMsg = displayMessages[index - 1];
            const showDate = !prevMsg || 
              new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
            
            return (
              <div className="px-4 py-1 flex flex-col gap-4">
                {showDate && <DateSeparator date={new Date(msg.createdAt)} />}
                <MessageBubble
                  message={msg}
                  isOwn={msg.senderId === currentUserId}
                  conversationId={conversationId}
                  orderId={context.orderId}
                />
              </div>
            );
          }}
        />
      </div>

      {blockState.isBlocked ? (
        <BlockedState
          conversationId={conversationId}
          blockedUserId={otherUser.id}
          blockedByMe={blockState.blockedByMe}
          onUnblocked={() => {
            setBlockState({ blockedByMe: false, blockedMe: false, isBlocked: false });
            router.refresh();
          }}
        />
      ) : (
        <div className="p-4 border-t border-border/40 bg-surface/50 backdrop-blur-md">
          <MessageInput
            conversationId={conversationId}
            userId={currentUserId}
            onSend={handleSend}
            onFocus={() => {
              markAsReadAction({ conversationId });
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
