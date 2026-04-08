"use server";

import { z } from "zod";
import { uploadFile } from "@/shared/lib/storage/file-storage";
import { getCurrentUser } from "@/shared/lib/get-user";
import { checkRateLimit } from "@/shared/lib/rate-limit";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

const uploadImagesSchema = z.object({
  images: z.array(
    z.any()
      .refine((file): file is File => file instanceof File, "Ожидается загрузка файлов")
      .refine((file) => file.size <= MAX_FILE_SIZE, "Размер файла не должен превышать 25MB")
      .refine((file) => ALLOWED_MIME_TYPES.includes(file.type) || file.type.startsWith("image/"), "Недопустимый формат файла")
  ).max(5, "Maximum 5 images allowed").optional().default([]),
});

export async function uploadImagesAction(formData: FormData): Promise<{ urls?: string[]; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Вы должны быть авторизованы" };
    }

    const rl = checkRateLimit({ key: `upload:${user.id}`, limit: 15, windowSec: 60 });
    if (!rl.allowed) {
      return { error: `Слишком часто. Подожтите ${rl.retryAfterSec} сек.` };
    }

    const rawImages = formData.getAll("images");
    console.log(`[uploadAction] User ${user.id} uploading ${rawImages.length} files`);
    
    const parsed = uploadImagesSchema.safeParse({ images: rawImages });
    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0];
      return { error: firstIssue?.message || "Ошибка при валидации файлов" };
    }

    const files = parsed.data.images;
    if (files.length === 0) {
      return { urls: [] };
    }

    const urls: string[] = [];
    for (const file of files) {
      if (file.size === 0) continue;
      console.log(`[uploadAction] Processing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB, type: ${file.type})`);
      
      try {
        const url = await uploadFile(file);
        urls.push(url);
      } catch (uploadError) {
        console.error(`[uploadAction] Failed to upload ${file.name}:`, uploadError);
        // Не валим весь процесс, если один файл не загрузился
      }
    }

    return { urls };
  } catch (globalError: unknown) {
    console.error("[uploadAction] Fatal global error:", globalError);
    return { error: "Внутренняя ошибка сервера при загрузке" };
  }
}
