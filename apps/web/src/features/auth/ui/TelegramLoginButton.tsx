"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";

interface Props {
  disabled?: boolean;
  botId?: string;
}

const isDev = process.env.NODE_ENV === "development";

export function TelegramLoginButton({ disabled, botId }: Props) {
  const [loading, setLoading] = useState(false);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (isDev || scriptLoaded.current) return;
    scriptLoaded.current = true;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      if (isDev) {
        // В dev-режиме: bypass виджета, sign in с тестовым Telegram-пользователем
        const result = await signIn("telegram-widget", {
          __dev__: "true",
          redirect: false,
          callbackUrl: "/dashboard",
        });
        if (result?.ok) window.location.href = "/dashboard";
        return;
      }

      if (!botId) {
        toast.error("NEXT_PUBLIC_BOT_ID не задан");
        setLoading(false);
        return;
      }

      window.onTelegramWidgetAuth = async (user) => {
        try {
          const result = await signIn("telegram-widget", {
            ...user,
            redirect: false,
            callbackUrl: "/dashboard",
          });
          if (result?.ok) window.location.href = "/dashboard";
        } finally {
          setLoading(false);
        }
      };

      window.Telegram?.Login?.auth(
        { bot_id: botId, request_access: true, lang: "ru" },
        (user: Record<string, unknown> | false) => {
          if (!user) { setLoading(false); return; }
          window.onTelegramWidgetAuth?.(user);
        }
      );
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full h-14 rounded-2xl bg-[#229ED9]/10 border-[#229ED9]/30 hover:bg-[#229ED9]/20 hover:border-[#229ED9]/60 text-white gap-3 group transition-all"
      onClick={handleClick}
      disabled={!!loading || !!disabled}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.947l-2.95-.924c-.64-.204-.657-.64.135-.954l11.57-4.461c.537-.194 1.006.131.98.613z" />
        </svg>
      )}
      Войти через Telegram
    </Button>
  );
}
