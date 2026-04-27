import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.ENCRYPTION_KEY = "a1b2c3d4".repeat(8);

// Mock Prisma
const mockDb = {
  conversation: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  message: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  user: { findUnique: vi.fn(), update: vi.fn() },
  conversationParticipant: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/shared/lib/db", () => ({ db: mockDb }));

const { chatService } = await import("../chat.service");

beforeEach(() => { vi.clearAllMocks(); });

describe("chatService.sendMessage", () => {
  it("encrypts text before saving to DB", async () => {
    mockDb.conversationParticipant.findFirst.mockResolvedValue({ userId: "user1" });
    mockDb.user.findUnique.mockResolvedValue({ chatBlockedAt: null });
    mockDb.message.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      id: "msg1",
      ...data,
      sender: { id: "user1", firstName: "Иван", avatar: null },
      createdAt: new Date(),
      deletedAt: null,
      deletedBy: null,
    }));
    mockDb.conversation.update.mockResolvedValue({});

    await chatService.sendMessage("conv1", "user1", "секретный текст");

    const savedText = mockDb.message.create.mock.calls[0][0].data.text;
    expect(savedText).not.toBe("секретный текст");
    expect(savedText.split(":")).toHaveLength(3);
  });

  it("throws if user is blocked", async () => {
    mockDb.user.findUnique.mockResolvedValue({ chatBlockedAt: new Date() });

    await expect(
      chatService.sendMessage("conv1", "blocked-user", "текст")
    ).rejects.toThrow("заблокирован");
  });
});

describe("chatService.getMessages", () => {
  it("decrypts text on read", async () => {
    const { encryptText } = await import("@/shared/lib/crypto");
    const encrypted = encryptText("читаемый текст");

    mockDb.conversationParticipant.findFirst.mockResolvedValue({ userId: "user1" });
    mockDb.message.findUnique.mockResolvedValue(null);
    mockDb.message.findMany.mockResolvedValue([
      {
        id: "msg1",
        text: encrypted,
        deletedAt: null,
        deletedBy: null,
        senderId: "user1",
        sender: { id: "user1", firstName: "Иван", avatar: null },
        createdAt: new Date(),
        attachments: [],
      },
    ]);

    const messages = await chatService.getMessages("conv1", "user1");
    expect(messages[0].text).toBe("читаемый текст");
  });
});

describe("chatService.deleteMessage", () => {
  it("sets deletedAt (soft-delete), does not delete the record", async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: "admin1", role: "ADMIN" });
    mockDb.message.findUnique.mockResolvedValue({
      id: "msg1", conversationId: "conv1",
    });
    mockDb.message.update.mockResolvedValue({});

    await chatService.deleteMessage("msg1", "admin1");

    expect(mockDb.message.update).toHaveBeenCalledWith({
      where: { id: "msg1" },
      data: expect.objectContaining({ deletedAt: expect.any(Date), deletedBy: "admin1" }),
    });
  });
});

describe("chatService.startConversation", () => {
  it("returns existing conversation if found (no duplicates)", async () => {
    const existing = { id: "conv-existing" };
    mockDb.conversation.findFirst.mockResolvedValue(existing);

    const result = await chatService.startConversation("u1", "u2", { orderId: "ord1" });

    expect(result).toBe(existing);
    expect(mockDb.conversation.create).not.toHaveBeenCalled();
  });
});

describe("chatService.getUnreadCount", () => {
  it("returns count of conversations with new messages", async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 1000);
    
    mockDb.conversationParticipant.findMany.mockResolvedValue([
      { 
        lastReadAt: past, 
        conversation: { messages: [{ createdAt: now }] } 
      },
      { 
        lastReadAt: now, 
        conversation: { messages: [{ createdAt: past }] } 
      },
    ]);

    const count = await chatService.getUnreadCount("user1");
    expect(count).toBe(1); // Only the first one is unread
  });
});

describe("chatService.deleteMessage Security", () => {
  it("throws error if user is not an admin", async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: "user1", role: "USER" });
    
    await expect(
      chatService.deleteMessage("msg1", "user1")
    ).rejects.toThrow("Только администратор");
  });

  it("throws error if admin not found", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    
    await expect(
      chatService.deleteMessage("msg1", "unknown")
    ).rejects.toThrow("Только администратор");
  });
});
