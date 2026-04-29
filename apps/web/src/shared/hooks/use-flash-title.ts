"use client";

import { useEffect, useRef } from "react";

/**
 * Хук для мигания заголовка вкладки при получении новых уведомлений.
 * Эффект как на Авито или Facebook.
 */
export function useFlashTitle(count: number, message: string = "Новое сообщение!") {
  const originalTitle = useRef<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Сохраняем оригинальный заголовок один раз при первом запуске
    if (!originalTitle.current && typeof document !== "undefined") {
      originalTitle.current = document.title;
    }

    if (count > 0) {
      // Очищаем старый интервал, если он был
      if (intervalRef.current) clearInterval(intervalRef.current);

      let showMessage = true;
      intervalRef.current = setInterval(() => {
        document.title = showMessage ? `(${count}) ${message}` : originalTitle.current;
        showMessage = !showMessage;
      }, 1500);
    } else {
      // Сбрасываем заголовок
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (originalTitle.current) {
        document.title = originalTitle.current;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [count, message]);
}
