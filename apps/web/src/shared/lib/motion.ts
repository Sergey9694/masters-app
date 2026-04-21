 import { Variants, Transition } from "framer-motion";

/**
 * Глобальный конфиг анимаций District Provider 2026.
 * Используется для обеспечения консистентности (Single Source of Truth) и премиального UX.
 * Все анимации базируются исключительно на Framer Motion (Motion).
 */

export const ANIMATION_DURATION = {
  INSTANT: 0.08,
  FAST: 0.15,
  NORMAL: 0.25,
  SLOW: 0.4,
  DELUXE: 0.7,
} as const;

export const ANIMATION_EASING = {
  // Ease Out Expo - Стандарт роскошных интерфейсов
  PREMIUM: [0.19, 1, 0.22, 1],
  // Стандартный Smooth
  SMOOTH: [0.4, 0, 0.2, 1],
  // Прыгучий эффект для кнопок и поп-апов
  BOUNCE: [0.175, 0.885, 0.32, 1.275],
  // Мягкое появление
  SOFT: [0.25, 0.1, 0.25, 1],
} as const;

/**
 * БАЗОВЫЕ ПРЕСЕТЫ ПЕРЕХОДОВ (Transitions)
 */
export const TRANSITIONS = {
  PREMIUM: {
    duration: ANIMATION_DURATION.SLOW,
    ease: ANIMATION_EASING.PREMIUM,
  } as Transition,
  FAST: {
    duration: ANIMATION_DURATION.FAST,
    ease: "easeOut",
  } as Transition,
  SPRING: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    restDelta: 0.001
  } as Transition,
  MOLASSES: {
    duration: ANIMATION_DURATION.DELUXE,
    ease: ANIMATION_EASING.PREMIUM,
  } as Transition,
};

/**
 * ВАРИАНТЫ АНИМАЦИЙ (Variants)
 */

export const FADE_IN: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: TRANSITIONS.PREMIUM },
  exit: { opacity: 0, transition: { duration: ANIMATION_DURATION.FAST } },
};

// Removed CSS filter: blur() — слишком дорого на мобильном GPU.
// Используем opacity + scale, выглядит ~так же, рендерится в 10x дешевле.
export const BLUR_IN: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: TRANSITIONS.PREMIUM },
  exit: { opacity: 0, scale: 0.95, transition: { duration: ANIMATION_DURATION.FAST } },
};

export const SLIDE_UP: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: TRANSITIONS.PREMIUM },
  exit: { opacity: 0, y: 10, transition: { duration: ANIMATION_DURATION.FAST } },
};

export const SLIDE_DOWN: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: TRANSITIONS.PREMIUM },
  exit: { opacity: 0, y: -10, transition: { duration: ANIMATION_DURATION.FAST } },
};

export const SLIDE_IN_RIGHT: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: TRANSITIONS.PREMIUM },
  exit: { opacity: 0, x: 20, transition: { duration: ANIMATION_DURATION.FAST } },
};

export const SLIDE_IN_LEFT: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: TRANSITIONS.PREMIUM },
  exit: { opacity: 0, x: -20, transition: { duration: ANIMATION_DURATION.FAST } },
};

/**
 * СЛОЖНЫЕ ПРЕСЕТЫ (Layout & Logic)
 */

// Для списков карточек
export const STAGGER_CONTAINER: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const STAGGER_ITEM: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: ANIMATION_EASING.PREMIUM },
  },
};

// Для Toaster / Notifications (Sonner Custom)
export const TOAST_VARIANTS: Variants = {
  initial: { opacity: 0, y: 40, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: TRANSITIONS.PREMIUM,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

// Для модальных окон (Dialogs)
export const MODAL_VARIANTS = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.18 } },
    exit: { opacity: 0, transition: { duration: 0.12 } },
  },
  content: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: TRANSITIONS.SPRING,
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: 8,
      transition: { duration: 0.12 },
    },
  },
};

/**
 * ИНТЕРАКТИВНЫЕ СОСТОЯНИЯ (States)
 */

export const HOVER_GLOW = {
  scale: 1.015,
  y: -2,
  filter: "brightness(1.08)",
  transition: { duration: 0.2, ease: ANIMATION_EASING.PREMIUM },
} as const;

export const CLICK_SCALE = {
  scale: 0.965,
  transition: { duration: 0.1, ease: "easeInOut" },
} as const;

/**
 * PAGE TRANSITIONS
 */
export const PAGE_TRANSITION: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: ANIMATION_EASING.PREMIUM } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

/* ===========================================================================
   Phase 5 — современные лёгкие пресеты (camelCase API).
   Используются новым UI. Старые SCREAMING_SNAKE оставлены для обратной
   совместимости и будут удалены после рефакторинга существующих страниц.
   =========================================================================== */

export const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const;
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

export const DURATION = {
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
} as const;

const defaultTransition: Transition = {
  duration: DURATION.base,
  ease: EASE_SMOOTH,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: defaultTransition },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: defaultTransition },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: defaultTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: defaultTransition },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_SMOOTH },
  },
};

export const hoverLift = {
  y: -2,
  transition: { duration: DURATION.fast, ease: EASE_SMOOTH },
} as const;

export const tapScale = {
  scale: 0.98,
  transition: { duration: DURATION.fast },
} as const;

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_SMOOTH },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASE_SMOOTH },
  },
};
