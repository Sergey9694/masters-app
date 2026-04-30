"use client";

import { useCallback } from 'react';

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'error' | 'success' | 'warning';

type HapticFeedback = {
  impactOccurred: (style: ImpactStyle) => void;
  notificationOccurred: (type: NotificationType) => void;
  selectionChanged: () => void;
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
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as TelegramWindow).Telegram?.WebApp?.HapticFeedback;
}

/**
 * Хук для работы с виброоткликом Telegram TWA (Haptic Feedback)
 * Обеспечивает премиальный пользовательский опыт (Native Feel)
 */
export function useHaptics() {
  const triggerImpact = useCallback((style: ImpactStyle = 'light') => {
    getHapticFeedback()?.impactOccurred(style);
  }, []);

  const triggerNotification = useCallback((type: NotificationType) => {
    getHapticFeedback()?.notificationOccurred(type);
  }, []);

  const triggerSelection = useCallback(() => {
    getHapticFeedback()?.selectionChanged();
  }, []);

  return {
    impact: triggerImpact,
    notification: triggerNotification,
    selection: triggerSelection
  };
}
