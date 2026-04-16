"use client";

import { useCallback } from 'react';

/**
 * Хук для работы с виброоткликом Telegram TWA (Haptic Feedback)
 * Обеспечивает премиальный пользовательский опыт (Native Feel)
 */
export function useHaptics() {
  const triggerImpact = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  }, []);

  const triggerNotification = useCallback((type: 'error' | 'success' | 'warning') => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred(type);
    }
  }, []);

  const triggerSelection = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  }, []);

  return {
    impact: triggerImpact,
    notification: triggerNotification,
    selection: triggerSelection
  };
}
