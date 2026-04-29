"use server";

import { z } from "zod";
import { uploadFile } from "@/shared/lib/storage/file-storage";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { authActionClient } from "@/shared/lib/safe-action";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export const uploadImagesAction = authActionClient
  .schema(z.instanceof(FormData))
  .action(async ({ parsedInput: formData, ctx: { userId } }) => {
    try {
      const rl = await checkRateLimit({ key: `upload:${userId}`, limit: 15, windowSec: 60 });
      if (!rl.allowed) {
        throw new Error(`Слишком часто. Подожтите ${rl.retryAfterSec} сек.`);
      }

      const rawImages = formData.getAll("images");
      const rawAvatar = formData.get("avatar");
      
      console.log(`[uploadAction] User ${userId} uploading ${rawImages.length} images and avatar: ${!!rawAvatar}`);

      if (rawImages.length > 5) {
        throw new Error("Максимум 5 изображений");
      }
      
      const urls: string[] = [];
      let uploadError: string | null = null;
      
      const validateFile = (file: unknown) => {
        if (!(file instanceof File)) return "Ожидается файл";
        if (file.size === 0) return null; // Пропускаем пустые
        if (file.size > MAX_FILE_SIZE) return "Размер файла превышает 25MB";
        if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
          return "Недопустимый формат файла";
        }
        return null;
      };

      for (const item of rawImages) {
        const error = validateFile(item);
        if (error) throw new Error(error);

        if (item instanceof File && item.size > 0) {
          try {
            const url = await uploadFile(item);
            urls.push(url);
          } catch (err) {
            console.error(err);
            uploadError = "Ошибка при загрузке изображения";
            break;
          }
        }
      }

      if (uploadError) {
        throw new Error(uploadError);
      }

      let avatarUrl: string | undefined = undefined;
      if (rawAvatar) {
        const error = validateFile(rawAvatar);
        if (error) throw new Error(error);

        if (rawAvatar instanceof File && rawAvatar.size > 0) {
          try {
            avatarUrl = await uploadFile(rawAvatar);
          } catch (err) {
            console.error(err);
            throw new Error("Ошибка при загрузке аватара");
          }
        }
      }

      return { urls, avatarUrl };
    } catch (globalError: unknown) {
      console.error("[uploadAction] Fatal error:", globalError);
      throw globalError instanceof Error ? globalError : new Error("Внутренняя ошибка сервера");
    }
  });
