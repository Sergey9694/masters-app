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

export async function uploadImagesAction(formData: FormData): Promise<{ urls?: string[]; avatarUrl?: string; error?: string }> {
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
    const rawAvatar = formData.get("avatar");
    console.log(`[uploadAction] User ${user.id} uploading ${rawImages.length} images and avatar: ${!!rawAvatar}`);
    
    const parsed = uploadImagesSchema.safeParse({ images: rawImages });
    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0];
      return { error: firstIssue?.message || "Ошибка при валидации файлов" };
    }

    const files = parsed.data.images;
    const urls: string[] = [];
    for (const file of files) {
      if (file.size === 0) continue;
      try {
        const url = await uploadFile(file);
        urls.push(url);
      } catch (err) { console.error(err); }
    }

    let avatarUrl: string | undefined = undefined;
    if (rawAvatar instanceof File && rawAvatar.size > 0) {
      try {
        avatarUrl = await uploadFile(rawAvatar);
      } catch (err) { console.error(err); }
    }

    return { urls, avatarUrl };
  } catch (globalError: unknown) {
    console.error("[uploadAction] Fatal global error:", globalError);
    return { error: "Внутренняя ошибка сервера при загрузке" };
  }
}
