/**
 * Утилита для создания SEO-дружелюбных ссылок (slug) из кириллических строк.
 */
export function slugify(text: string): string {
  const ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ы': 'y', 'э': 'e', 'ю': 'u', 'я': 'ya',
    ' ': '-', '.': '', ',': '', ':': '', ';': '', '(': '', ')': '', '[': '', ']': '', '!': '', '?': ''
  };

  let result = '';
  const str = text.toLowerCase();

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    // @ts-ignore
    const translated = ru[char];
    if (translated !== undefined) {
      result += translated;
    } else if (/[a-z0-9-]/.test(char)) {
      result += char;
    }
  }

  return result
    .replace(/-+/g, '-')       // убираем двойные дефисы
    .replace(/^-+|-+$/g, '');  // убираем дефисы по краям
}
