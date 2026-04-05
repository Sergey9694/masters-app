"use client";

import { useBackButton } from "@/shared/lib/telegram/use-back-button";

/**
 * Монтируемый в RSC-страницы компонент, показывающий нативный
 * Telegram BackButton. Сам ничего не рендерит.
 */
export function TelegramBackButton() {
  useBackButton();
  return null;
}
