import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

/**
 * Загрузка и автоматическая конвертация файла в WebP
 * Стандарт 2026: Автоматическая оптимизация "на лету"
 */
export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Конвертируем в WebP используя sharp
  // Это значительно экономит место и ускоряет загрузку в TWA
  let processedBuffer: Buffer = buffer;
  let fileName = `${uuidv4()}.webp`;

  try {
    const sharpInstance = sharp(buffer);
    processedBuffer = await sharpInstance
      .webp({ quality: 80 }) // Сбалансированное качество
      .toBuffer();
  } catch (err) {
    console.error("Image processing error:", err);
    // Если это не изображение, sharp может упасть. 
    throw new Error("Не удалось сконвертировать файл. Убедитесь, что это корректное изображение (JPG, PNG, WebP).");
  }
  
  // Сохраняем в папку uploads в корне проекта
  const uploadsDir = join(process.cwd(), "public", "uploads");
  
  try {
    await mkdir(uploadsDir, { recursive: true });
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, processedBuffer);
    
    // Возвращаем публичный путь
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("Storage error:", error);
    throw new Error("Ошибка при сохранении файла в хранилище. Проверьте права доступа к папке public/uploads");
  }
}
