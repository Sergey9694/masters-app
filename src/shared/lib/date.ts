import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

/**
 * Форматирует дату в стиле "Сегодня в 12:00" или "15 мая в 16:30"
 */
export function formatSmartDate(date: Date | string | number) {
  const d = new Date(date);
  
  if (isToday(d)) {
    return `Сегодня в ${format(d, "HH:mm")}`;
  }
  
  if (isYesterday(d)) {
    return `Вчера в ${format(d, "HH:mm")}`;
  }
  
  return format(d, "d MMMM в HH:mm", { locale: ru });
}

/**
 * Обертка над formatDistanceToNow с русской локалью
 */
export function formatRelativeTime(date: Date | string | number) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
}
