import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

const MAX_WIDTH = 1920;
const WEBP_QUALITY = 85;

/**
 * Загрузка, resize и конвертация в WebP.
 * Файлы сохраняются в <cwd>/uploads/ (Docker volume).
 * Отдаются через /api/uploads/[filename].
 */
export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let processedBuffer: Buffer;
  const fileName = `${uuidv4()}.webp`;

  try {
    processedBuffer = await sharp(buffer)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (err) {
    console.error("[uploadFile] sharp error:", err);
    throw new Error("Не удалось обработать изображение. Убедитесь, что это JPG, PNG или WebP.");
  }

  const uploadsDir = process.env.UPLOADS_DIR ?? join(process.cwd(), "uploads");

  try {
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, fileName), processedBuffer);
    return `/api/uploads/${fileName}`;
  } catch (error) {
    console.error("[uploadFile] write error:", error);
    throw new Error("Ошибка сохранения файла");
  }
}
