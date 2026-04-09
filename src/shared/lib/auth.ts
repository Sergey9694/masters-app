import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SessionPayload, Role } from "@/shared/types/auth";
import crypto from "crypto";

/**
 * Получение секретного ключа (Lazy Evaluation по Правилу 6)
 */
function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is not defined in production environment");
    }
    return new TextEncoder().encode("dev_fallback_secret_keep_it_safe");
  }
  return new TextEncoder().encode(secret);
}

const ONE_DAY = 24 * 60 * 60 * 1000;
const INIT_DATA_MAX_AGE_SEC = 24 * 60 * 60; // 24h TTL per Telegram guidelines

export async function encrypt(payload: SessionPayload) {
  const key = getSecretKey();
  // Normalize Date → ISO string so JWT payload round-trips cleanly
  const jwtPayload: Record<string, unknown> = {
    userId: payload.userId,
    role: payload.role,
    expires:
      payload.expires instanceof Date
        ? payload.expires.toISOString()
        : payload.expires,
  };
  return await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1 day")
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
  const key = getSecretKey();
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as unknown as SessionPayload;
}

export async function createSession(userId: string, role: Role) {
  const expires = new Date(Date.now() + ONE_DAY);
  const session = await encrypt({ userId, role, expires });

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expires,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch {
    return null;
  }
}

export async function logout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return NextResponse.next();

  let parsed: SessionPayload;
  try {
    parsed = await decrypt(session);
  } catch {
    const res = NextResponse.next();
    res.cookies.set("session", "", { expires: new Date(0) });
    return res;
  }

  parsed.expires = new Date(Date.now() + ONE_DAY);

  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: parsed.expires as Date,
    sameSite: "lax",
    path: "/",
  });
  return res;
}

/**
 * Валидация данных из Telegram Web App.
 * Возвращает конкретную причину отказа для логирования (вместо простого boolean).
 */
export type TelegramValidationResult =
  | { ok: true }
  | { ok: false; reason: "no_token" | "no_hash" | "bad_signature" | "expired" };

export function validateTelegramWebAppData(
  initData: string,
): TelegramValidationResult {
  if (!process.env.TELEGRAM_BOT_TOKEN) return { ok: false, reason: "no_token" };

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  if (!hash) return { ok: false, reason: "no_hash" };
  urlParams.delete("hash");

  const sortedKeys = Array.from(urlParams.keys()).sort();
  const dataCheckString = sortedKeys
    .map((key) => `${key}=${urlParams.get(key)}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (hmac !== hash) return { ok: false, reason: "bad_signature" };

  // TTL-check: initData не должна быть старше INIT_DATA_MAX_AGE_SEC
  const authDateStr = urlParams.get("auth_date");
  if (authDateStr) {
    const authDate = Number(authDateStr);
    const nowSec = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(authDate) || nowSec - authDate > INIT_DATA_MAX_AGE_SEC) {
      return { ok: false, reason: "expired" };
    }
  }

  return { ok: true };
}
