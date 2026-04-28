import { describe, it, expect } from "vitest";
import { encryptText, decryptText } from "../crypto";

// ENCRYPTION_KEY is set via vitest.config.ts env

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
    const original = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = "f".repeat(64);
    try {
      expect(() => decryptText(encrypted)).toThrow();
    } finally {
      process.env.ENCRYPTION_KEY = original;
    }
  });

  it("decrypt with wrong segment count throws error", () => {
    expect(() => decryptText("onlytwoparts:here")).toThrow("Invalid encrypted format");
  });

  it("decrypt with corrupted ciphertext throws error", () => {
    expect(() => decryptText("aabb:ccdd:eeff")).toThrow();
  });
});
