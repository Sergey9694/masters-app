import { SignJWT, jwtVerify } from "jose";
import fs from "fs";
import path from "path";

function getEmailTokenSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET is not set or shorter than 32 bytes");
  }
  return new TextEncoder().encode(s);
}

export async function createEmailToken(payload: { email: string; type: "verify" | "reset" }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(getEmailTokenSecret());
}

export async function verifyEmailToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getEmailTokenSecret());
    return payload as { email: string; type: "verify" | "reset" };
  } catch {
    return null;
  }
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const logContent = `
------------------- EMAIL SENT (${new Date().toISOString()}) -------------------
To: ${to}
Subject: ${subject}
Content: ${html}
--------------------------------------------------
`;

  console.log(logContent);

  try {
    const logDir = path.join(process.cwd(), "logs");
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, "email-debug.log"), logContent);
  } catch (err) {
    console.error("Failed to write email debug log:", err);
  }

  return { success: true };
}
