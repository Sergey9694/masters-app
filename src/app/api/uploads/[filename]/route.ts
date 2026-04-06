import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";

interface Ctx {
  params: Promise<{ filename: string }>;
}

export async function GET(_req: Request, ctx: Ctx) {
  const { filename } = await ctx.params;

  // Только .webp файлы, без path traversal
  if (!filename.match(/^[a-f0-9-]+\.webp$/)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const filePath = join(process.cwd(), "uploads", filename);

  try {
    const fileStat = await stat(filePath);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(fileStat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
