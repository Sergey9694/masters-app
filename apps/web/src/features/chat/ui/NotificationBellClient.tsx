"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/shared/hooks/use-socket";
import { cn } from "@/shared/lib/cn";
import { toast } from "sonner";
import type { MessageDTO } from "@/shared/lib/socket-events";

interface Props {
  initialUnread: number;
}

export function NotificationBellClient({ initialUnread }: Props) {
  const [count, setCount] = useState(initialUnread);
  const { socket } = useSocket();
  const router = useRouter();

  useEffect(() => {
    const handler = (data: { conversationId: string; message: MessageDTO }) => {
      setCount((c) => c + 1);
      
      // Показываем тост, если это не наше собственное сообщение
      // (хотя сервер шлет его в user:ID комнату только получателю, так что это безопасно)
      toast.info(`Новое сообщение от ${data.message.sender.firstName}`, {
        description: data.message.text.length > 60 
          ? data.message.text.slice(0, 60) + "..." 
          : data.message.text,
        action: {
          label: "Открыть",
          onClick: () => router.push(`/chat/${data.conversationId}`),
        },
      });
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
