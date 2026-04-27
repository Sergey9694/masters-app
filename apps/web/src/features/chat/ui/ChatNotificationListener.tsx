"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSocket } from "@/shared/hooks/use-socket";
import { usePathname, useRouter } from "next/navigation";
import type { MessageDTO } from "@uslugi/shared-types";

interface Props {
  userId?: string;
}

/**
 * Глобальный слушатель новых сообщений для показа Toast-уведомлений.
 * Работает на всех страницах (включая админку), так как находится в RootLayout.
 */
export function ChatNotificationListener({ userId }: Props) {
  const { socket } = useSocket(userId);
  const pathname = usePathname();
  const router = useRouter();
  
  // Используем ref для актуального пути внутри коллбэка сокета
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: { conversationId: string; message: MessageDTO }) => {
      const convId = data.conversationId;
      
      // Не показываем уведомление, если пользователь уже в этом чате
      // Проверяем как обычный чат, так и админский
      const isUserChat = pathnameRef.current === `/chat/${convId}`;
      const isAdminChat = pathnameRef.current === `/admin/chats/${convId}`;
      
      if (isUserChat || isAdminChat) {
        return;
      }

      // Показываем уведомление
      toast.info(`Новое сообщение от ${data.message.sender.firstName}`, {
        description: data.message.text.length > 60 
          ? data.message.text.slice(0, 60) + "..." 
          : data.message.text,
        action: {
          label: "Открыть",
          onClick: () => {
            // Если мы в админке, открываем админский чат, иначе обычный
            const targetPath = pathnameRef.current.startsWith("/admin") 
              ? `/admin/chats/${convId}`
              : `/chat/${convId}`;
            router.push(targetPath);
          },
        },
      });
    };

    socket.on("new:message", handler);
    return () => {
      socket.off("new:message", handler);
    };
  }, [socket, router]);

  return null;
}
