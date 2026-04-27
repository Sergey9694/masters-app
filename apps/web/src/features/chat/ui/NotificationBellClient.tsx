"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/shared/hooks/use-socket";
import { cn } from "@/shared/lib/cn";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import type { MessageDTO } from "@/shared/lib/socket-events";

interface Props {
  initialUnread: number;
  userId?: string;
}

export function NotificationBellClient({ initialUnread, userId }: Props) {
  const [count, setCount] = useState(initialUnread);
  const { socket } = useSocket(userId);
  const router = useRouter();

  const pathname = usePathname();

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: { conversationId: string; message: MessageDTO }) => {
      console.log("[NotificationBell] Received new:message", data);
      
      const convId = data.conversationId || (data.message as any).conversationId;
      if (!convId) {
        console.warn("[NotificationBell] No conversationId found in event data", data);
        return;
      }

      // Инкрементируем счетчик только если мы НЕ в этом чате
      const isCurrentChat = pathnameRef.current === `/chat/${convId}`;
      
      if (!isCurrentChat) {
        setCount((c) => c + 1);
        
        toast.info(`Новое сообщение от ${data.message.sender.firstName}`, {
          description: data.message.text.length > 60 
            ? data.message.text.slice(0, 60) + "..." 
            : data.message.text,
          action: {
            label: "Открыть",
            onClick: () => {
              console.log("[NotificationBell] Redirecting to chat:", convId);
              router.push(`/chat/${convId}`);
            },
          },
        });
      }
    };

    socket.on("new:message", handler);
    return () => {
      socket.off("new:message", handler);
    };
  }, [socket, router]);

  return (
    <button
      onClick={() => {
        setCount(0);
        router.push("/chat");
      }}
      className="relative inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm"
      aria-label="Сообщения"
    >
      <Bell className="size-3.5" />
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
