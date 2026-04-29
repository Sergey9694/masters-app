"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSocket } from "@/shared/hooks/use-socket";
import { useFlashTitle } from "@/shared/hooks/use-flash-title";
import { cn } from "@/shared/lib/cn";
import type { MessageDTO } from "@uslugi/shared-types";

interface Props {
  initialUnread: number;
  userId?: string;
}

export function MessageNotificationClient({ initialUnread, userId }: Props) {
  const [count, setCount] = useState(initialUnread);
  const { socket } = useSocket(userId);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // Мигание заголовка вкладки
  useFlashTitle(count, "Новое сообщение");

  useEffect(() => {
    pathnameRef.current = pathname;
    // Сбрасываем счетчик, если зашли в чат
    if (pathname.startsWith("/chat")) {
      setCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data: { conversationId: string; message: MessageDTO }) => {
      console.log("[Socket Debug] Client received new:message:", data);
      // Инкрементируем счетчик только если мы НЕ в этом чате
      const isCurrentChat = pathnameRef.current === `/chat/${data.conversationId}`;
      const isSender = data.message.senderId === userId;
      
      console.log(`[Socket Debug] isCurrentChat: ${isCurrentChat}, isSender: ${isSender}`);
      
      if (!isCurrentChat && !isSender) {
        setCount((c) => c + 1);
      }
    };

    socket.on("new:message", handleMessage);
    return () => {
      socket.off("new:message", handleMessage);
    };
  }, [socket, userId]);

  return (
    <button
      onClick={() => {
        setCount(0);
        router.push("/chat");
      }}
      className="relative inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm"
      aria-label="Сообщения"
    >
      <MessageSquare className="size-3.5" />
      {count > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center",
            "rounded-full bg-primary text-[8px] font-bold text-primary-foreground"
          )}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
