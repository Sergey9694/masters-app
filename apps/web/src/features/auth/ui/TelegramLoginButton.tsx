"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

declare global {
  interface Window {
    onTelegramWidgetAuth?: (user: Record<string, unknown>) => void;
  }
}

interface Props {
  disabled?: boolean;
}

export function TelegramLoginButton({ disabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const botName = process.env.NEXT_PUBLIC_BOT_NAME;

  useEffect(() => {
    if (!botName || !containerRef.current) return;

    window.onTelegramWidgetAuth = async (user) => {
      await signIn("telegram-widget", {
        ...user,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      window.location.href = "/dashboard";
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramWidgetAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");

    containerRef.current.appendChild(script);

    return () => {
      delete window.onTelegramWidgetAuth;
    };
  }, [botName]);

  if (!botName) return null;

  return (
    <div
      ref={containerRef}
      className={`flex justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`}
      style={{ minHeight: 54 }}
    />
  );
}
