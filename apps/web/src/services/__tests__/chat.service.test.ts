import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.ENCRYPTION_KEY = "a1b2c3d4".repeat(8);

// Mock Prisma
const mockDb = {
  conversation: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  message: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  },
  user: { findUnique: vi.fn(), update: vi.fn() },
  userBlock: { findMany: vi.fn() },
  report: { create: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  auditLog: { create: vi.fn() },
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
    mockDb.conversation.findUnique.mockResolvedValue({
      participants: [
        { userId: "user1", user: { chatBlockedAt: null } },
        { userId: "user2", user: { chatBlockedAt: null } },
      ],
    });
    mockDb.userBlock.findMany.mockResolvedValue([]);
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
    mockDb.conversation.findUnique.mockResolvedValue({
      participants: [
        { userId: "blocked-user", user: { chatBlockedAt: new Date() } },
        { userId: "user2", user: { chatBlockedAt: null } },
      ],
    });

    await expect(
      chatService.sendMessage("conv1", "blocked-user", "текст")
    ).rejects.toThrow("заблокирован");
  });
});

describe("chatService.getMessages", () => {
  it("decrypts text on read", async () => {
    const { encryptText } = await import("@/shared/lib/crypto");
    const encrypted = encryptText("читаемый текст");

    mockDb.user.findUnique.mockResolvedValue({ chatBlockedAt: null });
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
    mockDb.userBlock.findMany.mockResolvedValue([]);
    mockDb.conversation.findFirst.mockResolvedValue(existing);

    const result = await chatService.startConversation("u1", "u2", { orderId: "ord1" });

    expect(result).toBe(existing);
    expect(mockDb.conversation.create).not.toHaveBeenCalled();
  });
});

describe("chatService.getUnreadCount", () => {
  it("sums unread messages across all conversations", async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 1000);
    
    // Два диалога
    mockDb.conversationParticipant.findMany.mockResolvedValue([
      { conversationId: "c1", lastReadAt: past },
      { conversationId: "c2", lastReadAt: now },
    ]);

    // Для первого диалога - 5 непрочитанных, для второго - 0
    mockDb.message.count.mockResolvedValueOnce(5);
    mockDb.message.count.mockResolvedValueOnce(0);

    const count = await chatService.getUnreadCount("user1");
    expect(count).toBe(5);
    
    expect(mockDb.message.count).toHaveBeenCalledTimes(2);
    expect(mockDb.message.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ conversationId: "c1" })
    }));
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
