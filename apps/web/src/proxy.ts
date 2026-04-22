import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  // 0. Всегда пускаем healthcheck Docker'а
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  // 1. Получаем сессию через Auth.js (для Web)
  const session = await auth();

  // 1.1. Если сессии нет, проверяем кастомный JWT (Mobile/API + Admin)
  let apiSession = null;
  if (!session) {
    const isCustomJwtRoute =
      request.nextUrl.pathname.startsWith("/api/v1") ||
      request.nextUrl.pathname.startsWith("/admin");
    if (isCustomJwtRoute) {
      const { getSessionFromRequest } = await import("@/shared/lib/auth");
      apiSession = await getSessionFromRequest(request);
    }
  }

  // 2. Если сессии нет (ни Web, ни API) — проверяем публичные роуты
  if (!session && !apiSession) {
    const isPublic =
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/admin/login" ||
      request.nextUrl.pathname.startsWith("/auth") ||
      request.nextUrl.pathname.startsWith("/api/auth") ||
      request.nextUrl.pathname.startsWith("/api/uploads") ||
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
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (isAdminPath && !isLoginPage && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
  }

  // 4. Сессия валидна — пропускаем
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/orders",
    "/orders/:path*",
    "/profile",
    "/profile/:path*",
    "/settings",
    "/settings/:path*",
    "/my-orders",
    "/my-orders/:path*",
    "/my-proposals",
    "/my-proposals/:path*",
    "/notifications",
    "/notifications/:path*",
    "/admin",
    "/admin/:path*",
    "/api/:path*",
  ],
};
