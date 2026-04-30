import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  userBlock: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    findMany: vi.fn(),
  },
  conversation: {
    findUnique: vi.fn(),
  },
  message: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  report: {
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

const logAudit = vi.fn();

vi.mock("@/shared/lib/db", () => ({ db: mockDb }));
vi.mock("@/shared/lib/audit", () => ({ logAudit }));

const { trustService } = await import("../trust.service");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("trustService.getBlockState", () => {
  it("returns directional state for personal blocks", async () => {
    mockDb.userBlock.findMany.mockResolvedValue([{ blockerId: "u1" }]);

    const state = await trustService.getBlockState("u1", "u2");

    expect(state).toEqual({
      blockedByMe: true,
      blockedMe: false,
      isBlocked: true,
    });
  });
});

describe("trustService.assertCanMessage", () => {
  it("blocks messages when either participant has a personal block", async () => {
    mockDb.conversation.findUnique.mockResolvedValue({
      participants: [
        { userId: "u1", user: { chatBlockedAt: null } },
        { userId: "u2", user: { chatBlockedAt: null } },
      ],
    });
    mockDb.userBlock.findMany.mockResolvedValue([{ blockerId: "u2" }]);

    await expect(trustService.assertCanMessage("c1", "u1")).rejects.toThrow("ограничил");
  });
});

describe("trustService.createReport", () => {
  it("creates message report evidence without plaintext", async () => {
    mockDb.message.findUnique.mockResolvedValue({
      id: "m1",
      senderId: "u2",
      conversationId: "c1",
      conversation: { participants: [{ userId: "u1" }, { userId: "u2" }] },
    });
    mockDb.conversation.findUnique.mockResolvedValue({
      id: "c1",
      orderId: "o1",
      listingId: null,
    });
    mockDb.message.findMany.mockResolvedValue([
      {
        id: "m1",
        senderId: "u2",
        createdAt: new Date("2026-04-29T10:00:00.000Z"),
        text: "encrypted-value",
        attachments: [],
        deletedAt: null,
      },
    ]);
    mockDb.report.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      id: "r1",
      ...data,
    }));

    const report = await trustService.createReport({
      reporterId: "u1",
      targetType: "MESSAGE",
      targetId: "m1",
      reason: "HARASSMENT",
    });

    const evidence = report.evidence as { messages: Array<{ encryptedText: string; textHash: string }> };
    expect(evidence.messages[0].encryptedText).toBe("encrypted-value");
    expect(evidence.messages[0].textHash).toHaveLength(64);
    expect(JSON.stringify(evidence)).not.toContain("читаемый текст");
  });
});
