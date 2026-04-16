import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  // 0. Всегда пускаем healthcheck Docker'а
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  // 1. Получаем сессию через Auth.js
  const session = await auth();

  // 2. Если сессии нет
  if (!session) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Публичные страницы (лендинг, логин) пускаем
    if (
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname.startsWith("/auth") || // Новые страницы Auth.js
      request.nextUrl.pathname.startsWith("/_next") ||
      request.nextUrl.pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    // Иначе редирект на главную
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Админ-роуты — только для ADMIN
  // @ts-ignore
  if (request.nextUrl.pathname.startsWith("/admin") && session.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
  }

  // 4. Сессия валидна — пропускаем
  return NextResponse.next();
}

// НАСТРОЙКИ (Matcher)
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/api/:path*",
  ],
};
