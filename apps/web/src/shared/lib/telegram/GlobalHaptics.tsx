"use client";

import { useEffect } from "react";

type HapticFeedback = {
  impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
};

type TelegramWindow = Window &
  typeof globalThis & {
    Telegram?: {
      WebApp?: {
        HapticFeedback?: HapticFeedback;
      };
    };
  };

function getHapticFeedback(): HapticFeedback | undefined {
  return (window as unknown as TelegramWindow).Telegram?.WebApp?.HapticFeedback;
}

/**
 * Глобальный слушатель кликов для добавления виброотклика (Haptic Feedback).
 * Добавляет "Native App" ощущение на все интерактивные элементы.
 */
export function GlobalHaptics() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleGlobalClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      
      // Поиск ближайшего родителя, который может быть интерактивным
      const interactive = e.target.closest('button, a, [role="button"], input[type="submit"], input[type="button"], label');
      const haptics = getHapticFeedback();

      if (interactive && haptics) {
        // Мы используем light impact для обычных кликов
        haptics.impactOccurred('light');
      }
    };

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => window.removeEventListener("click", handleGlobalClick, { capture: true });
  }, []);

  return null;
}
