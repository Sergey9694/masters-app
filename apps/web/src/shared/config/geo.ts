/**
 * Глобальная конфигурация географии проекта (SSOT)
 */

export const SUPPORTED_REGIONS = [
  "Адыгея",
  "Калмыкия",
  "Крым",
  "Краснодарский",
  "Астраханская",
  "Волгоградская",
  "Ростовская",
  "Севастополь",
  "Донецкая",
  "Луганская",
  "Херсонская",
  "Запорожская",
  "Ставропольский",
  "Дагестан",
  "Чеченская",
  "Ингушетия",
  "Северная Осетия",
  "Кабардино-Балкарская",
  "Карачаево-Черкесия"
];

// Ключевые слова для серверной валидации (нижний регистр)
export const SUPPORTED_REGION_KEYWORDS = SUPPORTED_REGIONS.map(r => r.toLowerCase());

// Единое сообщение об ограничении географии
export const GEO_LIMIT_MESSAGE = "На данный момент сервис работает только в ЮФО, СКФО и новых регионах РФ.";

/**
 * Хелпер для проверки региона
 */
export function isRegionSupported(regionName: string | null | undefined): boolean {
  if (!regionName) return false;
  const lower = regionName.toLowerCase();
  return SUPPORTED_REGION_KEYWORDS.some(keyword => lower.includes(keyword));
}
