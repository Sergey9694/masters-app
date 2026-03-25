"use client";

import { useEffect, useState } from "react";
import { loginWithTelegram } from "../model/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MotionToast } from "@/shared/ui/motion-toast";

export function TelegramAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      
      // Сигнализируем, что мы готовы
      tg.ready();
      setIsReady(true);

      const initData = tg.initData;

      if (initData) {
        const handleLogin = async () => {
          setIsLoading(true);
          const result = await loginWithTelegram(initData);
          if (result.success) {
            toast.custom(() => <MotionToast type="success">Добро пожаловать!</MotionToast>);
            router.push("/dashboard");
          } else if (result.error) {
            toast.error(result.error);
          }
          setIsLoading(false);
        };

        handleLogin();
      }
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium animate-pulse">Синхронизация с Telegram...</p>
      </div>
    );
  }

  if (!isReady && typeof window !== "undefined") {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Пожалуйста, откройте это приложение в Telegram</p>
      </div>
    );
  }

  return null;
}
