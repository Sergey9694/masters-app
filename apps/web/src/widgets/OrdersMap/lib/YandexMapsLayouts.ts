/**
 * Yandex Maps v2.1 CSS & Helpers
 */

export const formatMapBudget = (value: number | null) => {
  if (!value) return "дог.";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
};

export const YANDEX_MAP_CSS = `
  /* Исправление для скругления углов */
  [class*="ymaps-2-1"][class*="-map"] {
    border-radius: 1rem !important;
    overflow: hidden !important;
  }
`;
