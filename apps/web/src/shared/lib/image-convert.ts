/**
 * Конвертация HEIC/HEIF изображений в JPEG на клиенте через Canvas API.
 * iPhone по умолчанию снимает в HEIF — браузеры не всегда рендерят HEIC,
 * поэтому конвертируем через canvas перед отправкой на сервер.
 */

const HEIC_MIME_TYPES = ["image/heic", "image/heif"];

/**
 * Проверяет, является ли файл HEIC/HEIF.
 */
export function isHeicFile(file: File): boolean {
  return (
    HEIC_MIME_TYPES.includes(file.type) ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name)
  );
}

/**
 * Конвертирует HEIC File в JPEG blob через heic2any.
 * Возвращает новый File с MIME type image/jpeg.
 */
export async function heicToJpeg(file: File, quality = 0.85): Promise<File> {
  try {
    const { default: heic2any } = await import("heic2any");
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality,
    });
    
    // heic2any может вернуть массив блобов для мульти-фреймовых HEIC
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    const name = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    
    return new File([blob], name, { type: "image/jpeg" });
  } catch (err) {
    throw new Error("Не удалось конвертировать HEIC изображение: " + (err as Error).message);
  }
}

/**
 * Пакетная конвертация HEIC файлов в JPEG.
 * Не-HEIC файлы пропускает без изменений.
 */
export async function convertHeicFiles(files: File[]): Promise<File[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      if (isHeicFile(file)) {
        try {
          const jpeg = await heicToJpeg(file);
          console.log(`[convertHeicFiles] ${file.name} -> ${jpeg.name}`);
          return jpeg;
        } catch (err) {
          console.error(`[convertHeicFiles] Failed to convert ${file.name}:`, err);
          // Если конвертация провалилась — отдаём оригинал
          return file;
        }
      }
      return file;
    }),
  );
  return results;
}
