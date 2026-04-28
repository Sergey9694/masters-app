import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY is not defined");
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  return buf;
}

// Format: "iv:authTag:ciphertext" (all in hex)
export function encryptText(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptText(stored: string): string {
  try {
    const parts = stored.split(":");
    if (parts.length !== 3) return stored; // Return as is if not in expected encrypted format

    const [ivHex, authTagHex, encryptedHex] = parts;
    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    
    let decrypted = decipher.update(Buffer.from(encryptedHex, "hex"), undefined, "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("❌ Decryption failed:", error);
    return "[Ошибка расшифровки: сообщение зашифровано другим ключом]";
  }
}
