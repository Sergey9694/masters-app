import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/v1/auth/logout — очистить cookie-сессию; JWT клиент обязан удалить сам
 */
export async function POST(_request: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.set("session", "", { expires: new Date(0), path: "/" });
  return res;
}
