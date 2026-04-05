"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type TWA = {
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
};

/**
 * Показывает Telegram BackButton на экране и навешивает обработчик.
 * По умолчанию вызывает router.back().
 *
 * Использование:
 *   useBackButton();                              // router.back()
 *   useBackButton(() => router.push("/dashboard")); // custom handler
 */
export function useBackButton(onBack?: () => void) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as unknown as { Telegram?: { WebApp?: TWA } }).Telegram
      ?.WebApp;
    if (!tg) return;

    const handler = () => {
      if (onBack) onBack();
      else router.back();
    };

    tg.BackButton.onClick(handler);
    tg.BackButton.show();

    return () => {
      tg.BackButton.offClick(handler);
      tg.BackButton.hide();
    };
  }, [onBack, router]);
}
