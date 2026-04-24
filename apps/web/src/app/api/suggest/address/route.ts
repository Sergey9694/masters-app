import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/shared/lib/get-user";
import { suggestAddress } from "@/shared/lib/dadata";

const querySchema = z.object({
  q: z.string().trim().min(3).max(200),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ suggestions: [] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ q: searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const data = await suggestAddress(parsed.data.q);
    return NextResponse.json({ suggestions: data });
  } catch (e) {
    console.error("[API_SUGGEST] error:", e);
    return NextResponse.json({ suggestions: [] });
  }
}
