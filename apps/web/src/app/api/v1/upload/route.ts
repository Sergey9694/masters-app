import { NextRequest } from "next/server";
import { uploadService } from "@/services/upload.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";

/**
 * POST /api/v1/upload — загрузить одно или несколько изображений (multipart/form-data)
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((v): v is File => v instanceof File);

    if (files.length === 0) {
      const single = form.get("file");
      if (single instanceof File) files.push(single);
    }

    if (files.length === 0) {
      return apiError("Файлы не переданы", 400);
    }

    const urls = await uploadService.uploadImages(files);
    return apiSuccess({ urls }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[API/UPLOAD] Error:", error);
    return apiError(message, 400);
  }
}
