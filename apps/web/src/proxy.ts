import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 0. Всегда пускаем healthcheck Docker'а
  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  // 1. Получаем сессию через Auth.js (для Web)
  const session = await auth();

  // 1.1. Если сессии нет, проверяем кастомный JWT (Mobile/API + Admin)
  let apiSession = null;
  if (!session) {
    const isCustomJwtRoute =
      pathname.startsWith("/api/v1") ||
      pathname.startsWith("/admin");
    if (isCustomJwtRoute) {
      const { getSessionFromRequest } = await import("@/shared/lib/auth");
      apiSession = await getSessionFromRequest(request);
    }
  }

  // 2. Если сессии нет (ни Web, ни API) — проверяем публичные роуты
  if (!session && !apiSession) {
    const isPublicV1AuthRoute =
      pathname === "/api/v1/auth/login" ||
      pathname === "/api/v1/auth/login/telegram" ||
      pathname === "/api/v1/auth/register";

    const isPublic =
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/admin/login" ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/api/auth") ||
      isPublicV1AuthRoute ||
      pathname === "/api/v1/orders/map-points" ||
      pathname.startsWith("/api/uploads") ||
      pathname.startsWith("/orders/v") ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico";

    if (isPublic) {
      return NextResponse.next();
    }

    // Если это API, но не Auth — блокируем
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Иначе редирект на логин
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = session?.user?.role || apiSession?.role;

  // 3. Админ-роуты — только для ADMIN
  const isAdminPath = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

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
    "/my-reviews",
    "/notifications",
    "/notifications/:path*",
    "/chat",
    "/chat/:path*",
    "/my-listings",
    "/my-listings/:path*",
    "/become-provider",
    "/providers/:path*",
    "/admin",
    "/admin/:path*",
    "/api/:path*",
  ],
};
