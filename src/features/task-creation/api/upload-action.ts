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

export async function uploadImagesAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const rl = checkRateLimit({ key: `upload:${user.id}`, limit: 10, windowSec: 60 });
  if (!rl.allowed) {
    throw new Error(`Слишком часто. Подождите ${rl.retryAfterSec} сек.`);
  }

  const rawImages = formData.getAll("images");
  
  const parsed = uploadImagesSchema.safeParse({ images: rawImages });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    throw new Error(firstIssue?.message || "Ошибка при валидации файлов");
  }

  const files = parsed.data.images;

  if (files.length === 0) {
    return [];
  }

  const urls = await Promise.all(
    files.map(async (file) => {
      if (file.size === 0) return null;
      return await uploadFile(file);
    })
  );

  return urls.filter((url): url is string => url !== null);
}
