import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  decrypt,
  encrypt,
  validateTelegramWebAppData,
  validateTelegramWidgetData,
} = await import("../auth");

function createSignedTelegramWebAppData(
  fields: Record<string, string | number>,
  botToken: string,
): string {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");
  const initData = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => {
    initData.set(key, String(value));
  });
  initData.set("hash", hash);
  return initData.toString();
}

function signTelegramWidgetData(
  fields: Record<string, string | number>,
  botToken: string,
): string {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  return crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");
}

beforeEach(() => {
  vi.useRealTimers();
  process.env.AUTH_SECRET = "test_auth_secret_32_chars_minimum";
  process.env.TELEGRAM_BOT_TOKEN = "123456:telegram-token";
});

describe("JWT session helpers", () => {
  it("encrypts and decrypts session payload", async () => {
    const expires = new Date(Date.now() + 60_000);

    const token = await encrypt({ userId: "user-1", role: "USER", expires });
    const payload = await decrypt(token);

    expect(payload.userId).toBe("user-1");
    expect(payload.role).toBe("USER");
    expect(new Date(payload.expires).toISOString()).toBe(expires.toISOString());
  });
});

describe("Telegram WebApp validation", () => {
  it("accepts valid signed initData", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-30T12:00:00.000Z"));
    const authDate = Math.floor(Date.now() / 1000);
    const initData = createSignedTelegramWebAppData(
      {
        auth_date: authDate,
        query_id: "query-1",
        user: '{"id":1,"first_name":"Ivan"}',
      },
      process.env.TELEGRAM_BOT_TOKEN ?? "",
    );

    expect(validateTelegramWebAppData(initData)).toEqual({ ok: true });
  });

  it("rejects expired signed initData", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-30T12:00:00.000Z"));
    const expiredAuthDate = Math.floor(Date.now() / 1000) - 90_000;
    const initData = createSignedTelegramWebAppData(
      {
        auth_date: expiredAuthDate,
        query_id: "query-1",
      },
      process.env.TELEGRAM_BOT_TOKEN ?? "",
    );

    expect(validateTelegramWebAppData(initData)).toEqual({
      ok: false,
      reason: "expired",
    });
  });
});

describe("Telegram Login Widget validation", () => {
  it("rejects missing bot token", () => {
    delete process.env.TELEGRAM_BOT_TOKEN;

    expect(
      validateTelegramWidgetData({
        id: 1,
        first_name: "Ivan",
        auth_date: Math.floor(Date.now() / 1000),
        hash: "hash",
      }),
    ).toEqual({ ok: false, reason: "no_token" });
  });

  it("accepts valid widget payload", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-30T12:00:00.000Z"));
    const fields = {
      id: 1,
      first_name: "Ivan",
      auth_date: Math.floor(Date.now() / 1000),
    };
    const hash = signTelegramWidgetData(fields, process.env.TELEGRAM_BOT_TOKEN ?? "");

    expect(validateTelegramWidgetData({ ...fields, hash })).toEqual({ ok: true });
  });
});
