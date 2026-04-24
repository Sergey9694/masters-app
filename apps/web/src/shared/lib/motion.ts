import type { Variants, Transition } from "framer-motion";

// ---------------------------------------------------------------------------
// Timing tokens
// ---------------------------------------------------------------------------

export const ease = {
  smooth: [0.22, 1, 0.36, 1],      // Expo Out — стандарт для появлений
  out:    [0.19, 1, 0.22, 1],      // Expo Out Premium — модальные/тяжёлые
  spring: [0.34, 1.56, 0.64, 1],   // Упругий — кнопки, пиллы
  standard: [0.4, 0, 0.2, 1],      // Material — фоновые переходы
} as const;

export const duration = {
  fast:   0.15,
  base:   0.2,
  slow:   0.3,
  deluxe: 0.5,
} as const;

export const transition = {
  fast:   { duration: duration.fast, ease: ease.smooth } as Transition,
  base:   { duration: duration.base, ease: ease.smooth } as Transition,
  slow:   { duration: duration.slow, ease: ease.out    } as Transition,
  spring: { type: "spring", stiffness: 300, damping: 30, restDelta: 0.001 } as Transition,
} as const;

// ---------------------------------------------------------------------------
// Появление (initial → animate → exit)
// ---------------------------------------------------------------------------

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transition.base },
  exit:    { opacity: 0, transition: transition.fast },
};

/** Лёгкое появление с масштабом — вместо blur (дешевле на GPU) */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1,    transition: transition.base },
  exit:    { opacity: 0, scale: 0.95, transition: transition.fast },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0,  transition: transition.slow },
  exit:    { opacity: 0, y: 8,  transition: transition.fast },
};

export const slideDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0,   transition: transition.slow },
  exit:    { opacity: 0, y: -8,  transition: transition.fast },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0,  transition: transition.slow },
  exit:    { opacity: 0, x: 20, transition: transition.fast },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0,   transition: transition.slow },
  exit:    { opacity: 0, x: -20, transition: transition.fast },
};

// ---------------------------------------------------------------------------
// Stagger-списки
// ---------------------------------------------------------------------------

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: transition.base },
};

// ---------------------------------------------------------------------------
// Специфичные варианты
// ---------------------------------------------------------------------------

export const toastVariants: Variants = {
  initial: { opacity: 0, y: 32, scale: 0.95 },
  animate: { opacity: 1, y: 0,  scale: 1,    transition: transition.slow },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } },
};

export const modalVariants = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.18 } },
    exit:    { opacity: 0, transition: { duration: 0.12 } },
  },
  content: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1,    y: 0, transition: transition.spring },
    exit:    { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.12 } },
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: transition.base },
  exit:    { opacity: 0,       transition: transition.fast },
};

// ---------------------------------------------------------------------------
// Интерактивные состояния (whileHover / whileTap)
// ---------------------------------------------------------------------------

export const hoverLift = {
  y: -2,
  transition: { duration: duration.fast, ease: ease.smooth },
} as const;

export const tapScale = {
  scale: 0.98,
  transition: { duration: duration.fast },
} as const;
