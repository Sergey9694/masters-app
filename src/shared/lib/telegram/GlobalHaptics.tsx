"use client";

import { useEffect } from "react";

/**
 * Глобальный слушатель кликов для добавления виброотклика (Haptic Feedback).
 * Добавляет "Native App" ощущение на все интерактивные элементы.
 */
export function GlobalHaptics() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Поиск ближайшего родителя, который может быть интерактивным
      const interactive = target.closest('button, a, [role="button"], input[type="submit"], input[type="button"], label');

      if (interactive && (window as any).Telegram?.WebApp?.HapticFeedback) {
        // Мы используем light impact для обычных кликов
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    };

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => window.removeEventListener("click", handleGlobalClick, { capture: true });
  }, []);

  return null;
}
