"use server";

import { uploadFile } from "@/shared/lib/storage/file-storage";
import { getCurrentUser } from "@/shared/lib/get-user";
import { checkRateLimit } from "@/shared/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function uploadImagesAction(formData: FormData) {
  // S3: Auth check
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const rl = checkRateLimit({ key: `upload:${user.id}`, limit: 10, windowSec: 60 });
  if (!rl.allowed) {
    throw new Error(`Слишком часто. Подождите ${rl.retryAfterSec} сек.`);
  }

  const files = formData.getAll("images") as File[];

  if (!files || files.length === 0) {
    return [];
  }

  // S4: Max 5 images per request
  if (files.length > 5) {
    throw new Error("Maximum 5 images allowed");
  }

  const urls = await Promise.all(
    files.map(async (file) => {
      if (file.size === 0) return null;

      // S4: Size limit
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File "${file.name}" exceeds 5MB limit`);
      }

      // S4: MIME type check
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(`File "${file.name}" has unsupported format. Use JPG, PNG, WebP or GIF`);
      }

      return await uploadFile(file);
    })
  );

  return urls.filter((url): url is string => url !== null);
}
