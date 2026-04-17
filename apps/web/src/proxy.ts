import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  // 0. Всегда пускаем healthcheck Docker'а
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  // 1. Получаем сессию через Auth.js
  const session = await auth();

  // 2. Если сессии нет — проверяем публичные роуты
  if (!session) {
    const isPublic = 
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname.startsWith("/auth") || 
      request.nextUrl.pathname.startsWith("/api/auth") ||
      request.nextUrl.pathname.startsWith("/_next") ||
      request.nextUrl.pathname === "/favicon.ico";

    if (isPublic) {
      return NextResponse.next();
    }

    // Если это API, но не Auth — блокируем
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Иначе редирект на главную
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Админ-роуты — только для ADMIN
  if (request.nextUrl.pathname.startsWith("/admin") && session.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
  }

  // 4. Сессия валидна — пропускаем
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/api/:path*",
  ],
};
