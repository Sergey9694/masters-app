import { NextRequest, NextResponse } from "next/server";
import { updateSession, decrypt } from "@/shared/lib/auth";

export async function proxy(request: NextRequest) {
  // 0. Всегда пускаем healthcheck Docker'а
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  // 1. Проверяем наличие сессии
  const session = request.cookies.get("session")?.value;

  // 2. Если сессии нет
  if (!session) {
    // Если это API запрос — возвращаем JSON ошибку
    // (аутентификация сейчас идёт через Server Action loginWithTelegram, не через API-route)
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Публичные страницы (лендинг, логин) пускаем
    if (
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname.startsWith("/_next") ||
      request.nextUrl.pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    // Иначе редирект на главную (где лежит лендинг)
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Проверяем валидность токена и извлекаем роль
  let payload: Awaited<ReturnType<typeof decrypt>>;
  try {
    payload = await decrypt(session);
  } catch {
    const res = NextResponse.redirect(new URL("/", request.url));
    res.cookies.set("session", "", { expires: new Date(0) });
    return res;
  }

  // 4. Админ-роуты — только для ADMIN
  if (request.nextUrl.pathname.startsWith("/admin") && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
  }

  // 5. Токен валидный — продлеваем сессию и пропускаем запрос
  return await updateSession(request);
}

// НАСТРОЙКИ (Matcher)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
