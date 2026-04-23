/**
 * Единая функция нормализации телефонов.
 * "+7 (999) 123-45-67" → "79991234567"
 * "8 (999) 123-45-67"  → "79991234567" (замена 8→7, стандарт РФ)
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  
  // Если номер начинается с 8 и имеет 11 цифр, меняем на 7 (стандарт РФ)
  if (cleaned.length === 11 && cleaned.startsWith("8")) {
    return "7" + cleaned.slice(1);
  }
  
  // Если номер 10 цифр (без кода страны), добавляем 7
  if (cleaned.length === 10) {
    return "7" + cleaned;
  }

  return cleaned;
}

/**
 * Форматирование для вывода: 79991112233 -> +7 (999) 111-22-33
 */
export function formatPhoneNumber(phoneStr: string | null | undefined): string {
  if (!phoneStr) return "—";

  const cleaned = phoneStr.replace(/\D/g, "");

  if (cleaned.length === 11) {
    return cleaned.replace(
      /^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/,
      "+7 ($2) $3-$4-$5",
    );
  }

  return phoneStr;
}
