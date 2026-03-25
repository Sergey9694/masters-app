"use server";

import { uploadFile } from "@/shared/lib/storage/file-storage";

export async function uploadImagesAction(formData: FormData) {
  const files = formData.getAll("images") as File[];
  
  if (!files || files.length === 0) {
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
