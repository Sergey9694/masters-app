"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSocket } from "@/shared/hooks/use-socket";
import { cn } from "@/shared/lib/cn";

interface Props {
  initialUnread: number;
  userId?: string;
}

export function NotificationBellClient({ initialUnread, userId }: Props) {
  const [count, setCount] = useState(initialUnread);
  const { socket } = useSocket(userId);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/notifications") {
      setCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: unknown) => {
      console.log("[Socket Debug] Client received new:notification:", data);
      // Инкрементируем счетчик, если мы не на странице уведомлений
      if (pathname !== "/notifications") {
        setCount((c) => c + 1);
      }
    };

    socket.on("new:notification", handleNotification);
    return () => {
      socket.off("new:notification", handleNotification);
    };
  }, [socket, pathname]);

  return (
    <button
      onClick={() => {
        setCount(0);
        router.push("/notifications");
      }}
      className="relative inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm"
      aria-label="Уведомления"
    >
      <Bell className="size-3.5" />
      {count > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center",
            "rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground"
          )}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
