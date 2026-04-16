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
// Глобальный счетчик для отслеживания количества активных компонентов TelegramBackButton
// Это предотвращает скрытие кнопки при переходе между страницами, которые обе используют кнопку
let activeButtonsCount = 0;

export function useBackButton(fallbackPath: string = "/dashboard") {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as unknown as { Telegram?: { WebApp?: TWA } }).Telegram
      ?.WebApp;
    if (!tg) return;

    const handler = () => {
      // Использование replace предотвращает раздувание истории
      router.replace(fallbackPath);
    };

    activeButtonsCount++;
    tg.BackButton.onClick(handler);
    
    // Показываем кнопку, если это первый активный компонент
    if (activeButtonsCount > 0) {
      tg.BackButton.show();
    }

    return () => {
      activeButtonsCount--;
      tg.BackButton.offClick(handler);
      
      // Скрываем кнопку только если больше нет активных компонентов TelegramBackButton на экране
      // Делаем это с небольшой задержкой, чтобы переход между страницами был плавным и кнопка не "прыгала"
      setTimeout(() => {
        if (activeButtonsCount <= 0) {
          tg.BackButton.hide();
        }
      }, 10);
    };
  }, [fallbackPath, router]);
}
