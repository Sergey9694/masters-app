"use client";

import { useEffect } from 'react';

interface MainButtonOptions {
  text: string;
  color?: string;
  textColor?: string;
  isVisible?: boolean;
  isActive?: boolean;
  isProgressVisible?: boolean;
  onClick?: () => void;
}

type MainButtonParams = {
  text: string;
  color: string;
  text_color: string;
  is_visible: boolean;
  is_active: boolean;
};

type TelegramMainButton = {
  setParams: (params: MainButtonParams) => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  onClick: (handler: () => void) => void;
  offClick: (handler: () => void) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
};

type TelegramWebApp = {
  MainButton: TelegramMainButton;
  themeParams: {
    button_color?: string;
    button_text_color?: string;
  };
};

type TelegramWindow = Window &
  typeof globalThis & {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  };

function getTelegramWebApp(): TelegramWebApp | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as TelegramWindow).Telegram?.WebApp;
}

/**
 * Хук для управления главной кнопкой Telegram (MainButton).
 * Позволяет динамически менять состояние кнопки из любого компонента.
 * @version 2026.1
 */
export function useMainButton(options: MainButtonOptions, deps: unknown[] = []) {
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;

    const mb = tg.MainButton;

    // Установка параметров
    mb.setParams({
      text: options.text,
      color: options.color || tg.themeParams.button_color || '#2481cc',
      text_color: options.textColor || tg.themeParams.button_text_color || '#ffffff',
      is_visible: options.isVisible !== undefined ? options.isVisible : false,
      is_active: options.isActive !== undefined ? options.isActive : true,
    });

    // Индикатор загрузки
    if (options.isProgressVisible) {
      mb.showProgress(false);
    } else {
      mb.hideProgress();
    }

    // Обработчик клика
    const handleClick = () => {
      if (options.onClick) {
        options.onClick();
      }
    };

    mb.onClick(handleClick);

    // Очистка при размонтировании
    return () => {
      mb.offClick(handleClick);
      // Скрываем кнопку при уходе с экрана, если не указано иное
      if (options.isVisible) {
        mb.hide();
      }
    };
  }, [
    options.text, 
    options.color, 
    options.textColor, 
    options.isVisible, 
    options.isActive, 
    options.isProgressVisible, 
    options.onClick,
    ...deps
  ]);

  return {
    show: () => getTelegramWebApp()?.MainButton.show(),
    hide: () => getTelegramWebApp()?.MainButton.hide(),
    enable: () => getTelegramWebApp()?.MainButton.enable(),
    disable: () => getTelegramWebApp()?.MainButton.disable(),
  };
}
