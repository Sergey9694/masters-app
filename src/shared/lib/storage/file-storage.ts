import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Генерируем уникальное имя (стандарт 2026 года - UUID-v4)
  const extension = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${extension}`;
  
  // Сохраняем в папку uploads в корне проекта (в Docker это будет Volume)
  const uploadsDir = join(process.cwd(), "public", "uploads");
  
  try {
    await mkdir(uploadsDir, { recursive: true });
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);
    
    // Возвращаем публичный путь
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("Storage error:", error);
    throw new Error("Failed to save file to storage");
  }
}
