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

/**
 * Хук для управления главной кнопкой Telegram (MainButton).
 * Позволяет динамически менять состояние кнопки из любого компонента.
 * @version 2026.1
 */
export function useMainButton(options: MainButtonOptions, deps: any[] = []) {
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).Telegram?.WebApp) return;

    const tg = (window as any).Telegram.WebApp;
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
    ...deps
  ]);

  return {
    show: () => (window as any).Telegram?.WebApp?.MainButton.show(),
    hide: () => (window as any).Telegram?.WebApp?.MainButton.hide(),
    enable: () => (window as any).Telegram?.WebApp?.MainButton.enable(),
    disable: () => (window as any).Telegram?.WebApp?.MainButton.disable(),
  };
}
