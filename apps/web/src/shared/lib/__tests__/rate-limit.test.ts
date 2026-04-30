import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedis = {
  incr: vi.fn(),
  expire: vi.fn(),
  pttl: vi.fn(),
};

vi.mock("../redis", () => ({
  getRedis: () => mockRedis,
}));

const { checkRateLimit } = await import("../rate-limit");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkRateLimit", () => {
  it("allows request inside the window and sets ttl for a new key", async () => {
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);

    await expect(
      checkRateLimit({ key: "login:user-1", limit: 3, windowSec: 60 }),
    ).resolves.toEqual({ allowed: true, count: 1, retryAfterSec: 0 });

    expect(mockRedis.incr).toHaveBeenCalledWith("rl:login:user-1");
    expect(mockRedis.expire).toHaveBeenCalledWith("rl:login:user-1", 60);
  });

  it("blocks when counter is above the limit", async () => {
    mockRedis.incr.mockResolvedValue(4);
    mockRedis.pttl.mockResolvedValue(12_300);

    await expect(
      checkRateLimit({ key: "login:user-1", limit: 3, windowSec: 60 }),
    ).resolves.toEqual({ allowed: false, count: 4, retryAfterSec: 13 });
  });

  it("fails open when Redis is not available", async () => {
    mockRedis.incr.mockRejectedValue(new Error("redis down"));

    await expect(
      checkRateLimit({ key: "login:user-1", limit: 3, windowSec: 60 }),
    ).resolves.toEqual({ allowed: true, count: 0, retryAfterSec: 0 });
  });
});
