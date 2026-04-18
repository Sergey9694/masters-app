import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  // 0. Всегда пускаем healthcheck Docker'а
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  // 1. Получаем сессию через Auth.js (для Web)
  const session = await auth();

  // 1.1. Если сессии нет, проверяем Bearer токен (для Mobile/API)
  let apiSession = null;
  if (!session && request.nextUrl.pathname.startsWith("/api/v1")) {
    const { getSessionFromRequest } = await import("@/shared/lib/auth");
    apiSession = await getSessionFromRequest(request);
  }

  // 2. Если сессии нет (ни Web, ни API) — проверяем публичные роуты
  if (!session && !apiSession) {
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

  const userRole = session?.user?.role || apiSession?.role;

  // 3. Админ-роуты — только для ADMIN
  if (request.nextUrl.pathname.startsWith("/admin") && userRole !== "ADMIN") {
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
