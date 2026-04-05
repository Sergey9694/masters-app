"use client";

import { useEffect, useState } from "react";
import { loginWithTelegram } from "../model/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MotionToast } from "@/shared/ui/motion-toast";

type TelegramWebApp = {
  ready: () => void;
  initData: string;
};

export function TelegramAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Poll for Telegram WebApp (script may not be ready yet on first tick)
    let attempts = 0;
    const maxAttempts = 20; // 20 * 100ms = 2s

    const tryLogin = async () => {
      const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } })
        .Telegram?.WebApp;

      if (!tg) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(tryLogin, 100);
        }
        return;
      }

      tg.ready();
      const initData = tg.initData;

      if (!initData) {
        // Opened outside Telegram or in web-preview — landing page stays visible
        return;
      }

      setIsLoading(true);
      const result = await loginWithTelegram(initData);

      if (result.success) {
        toast.custom(() => (
          <MotionToast type="success">Добро пожаловать!</MotionToast>
        ));
        // CRITICAL: refresh RSC cache so /dashboard sees the new session cookie
        router.refresh();
        router.push("/dashboard");
        return;
      }

      if (result.error) {
        console.error("[TelegramAuth]", result.error);
        toast.error(result.error);
      }
      setIsLoading(false);
    };

    tryLogin();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium animate-pulse">Синхронизация с Telegram...</p>
      </div>
    );
  }

  // Not in Telegram → landing page stays visible
  return null;
}
