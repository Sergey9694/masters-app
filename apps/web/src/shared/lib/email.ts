import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_token_secret_2026";

/**
 * Создает временный токен для Email (верификация или сброс пароля)
 */
export async function createEmailToken(payload: { email: string; type: "verify" | "reset" }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(new TextEncoder().encode(JWT_SECRET));
}

/**
 * Проверяет токен из Email
 */
export async function verifyEmailToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return payload as { email: string; type: "verify" | "reset" };
  } catch (error) {
    return null;
  }
}

/**
 * Утилита для "отправки" Email. 
 * В режиме разработки просто выводит ссылку в консоль.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  console.log("------------------- EMAIL SENT -------------------");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content: ${html}`);
  console.log("--------------------------------------------------");
  
  // Здесь в будущем будет nodemailer или Resend/Postmark
  return { success: true };
}
