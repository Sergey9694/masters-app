import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Set key before importing module
const TEST_KEY = "a1b2c3d4".repeat(8); // 64 hex chars = 32 bytes

beforeAll(() => { process.env.ENCRYPTION_KEY = TEST_KEY; });
afterAll(() => { delete process.env.ENCRYPTION_KEY; });

// Import AFTER setting env
const { encryptText, decryptText } = await import("../crypto");

describe("crypto", () => {
  it("encrypt → decrypt returns original text", () => {
    const text = "Привет, как дела?";
    expect(decryptText(encryptText(text))).toBe(text);
  });

  it("two encrypt calls give different results (unique IV)", () => {
    const text = "одинаковый текст";
    expect(encryptText(text)).not.toBe(encryptText(text));
  });

  it("encrypted string has format iv:authTag:ciphertext", () => {
    const parts = encryptText("test").split(":");
    expect(parts).toHaveLength(3);
    parts.forEach(p => expect(p).toMatch(/^[0-9a-f]+$/));
  });

  it("decrypt with wrong key throws error", () => {
    const encrypted = encryptText("secret");
    process.env.ENCRYPTION_KEY = "f".repeat(64); // different key
    expect(() => decryptText(encrypted)).toThrow();
    process.env.ENCRYPTION_KEY = TEST_KEY; // restore
  });

  it("decrypt with corrupted string throws error", () => {
    expect(() => decryptText("bad:data:here")).toThrow();
  });
});
