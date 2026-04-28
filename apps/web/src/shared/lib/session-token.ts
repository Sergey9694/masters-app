import { SignJWT, jwtVerify } from "jose";
import { SessionPayload } from "@/shared/types/auth";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is not defined in production environment");
    }
    return new TextEncoder().encode("dev_fallback_secret_keep_it_safe");
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload) {
  const key = getSecretKey();
  const jwtPayload: Record<string, unknown> = {
    userId: payload.userId,
    role: payload.role,
    expires:
      payload.expires instanceof Date
        ? payload.expires.toISOString()
        : payload.expires,
  };

  return new SignJWT(jwtPayload)
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
