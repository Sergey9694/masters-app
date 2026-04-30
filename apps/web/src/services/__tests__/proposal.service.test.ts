import { beforeEach, describe, expect, it, vi } from "vitest";

const notificationSend = vi.fn();

const mockDb = {
  user: { findUnique: vi.fn() },
  order: { findUnique: vi.fn() },
  proposal: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  providerProfile: { findUnique: vi.fn() },
};

vi.mock("@/shared/lib/db", () => ({ db: mockDb }));
vi.mock("../notification.service", () => ({
  notificationService: { send: notificationSend },
}));

const { proposalService } = await import("../proposal.service");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proposalService.create", () => {
  it("requires provider profile", async () => {
    mockDb.user.findUnique.mockResolvedValue({ firstName: "Иван", providerProfile: null });

    await expect(
      proposalService.create({ orderId: "order-1" }, "user-1"),
    ).rejects.toThrow("зарегистрируйтесь как мастер");
  });

  it("prevents provider from responding to own order", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      firstName: "Иван",
      providerProfile: { id: "provider-1" },
    });
    mockDb.order.findUnique.mockResolvedValue({
      id: "order-1",
      title: "Ремонт",
      status: "OPEN",
      clientId: "user-1",
    });

    await expect(
      proposalService.create({ orderId: "order-1" }, "user-1"),
    ).rejects.toThrow("свою заявку");
  });

  it("creates proposal and notifies order owner", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      firstName: "Иван",
      providerProfile: { id: "provider-1" },
    });
    mockDb.order.findUnique.mockResolvedValue({
      id: "order-1",
      title: "Ремонт",
      status: "OPEN",
      clientId: "client-1",
    });
    mockDb.proposal.findFirst.mockResolvedValue(null);
    mockDb.proposal.create.mockResolvedValue({ id: "proposal-1" });
    notificationSend.mockResolvedValue(undefined);

    const proposal = await proposalService.create(
      { orderId: "order-1", price: 1500, message: "Готов" },
      "provider-user-1",
    );

    expect(mockDb.proposal.create).toHaveBeenCalledWith({
      data: {
        orderId: "order-1",
        providerId: "provider-1",
        price: 1500,
        message: "Готов",
      },
    });
    expect(notificationSend).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "client-1",
        type: "NEW_PROPOSAL",
      }),
    );
    expect(proposal.id).toBe("proposal-1");
  });
});

describe("proposalService.listByOrder", () => {
  it("allows only order client to view proposals", async () => {
    mockDb.order.findUnique.mockResolvedValue({ clientId: "client-1" });

    await expect(
      proposalService.listByOrder("order-1", "user-2"),
    ).rejects.toThrow("Доступ запрещён");
    expect(mockDb.proposal.findMany).not.toHaveBeenCalled();
  });
});

describe("proposalService.withdraw", () => {
  it("allows provider to withdraw own proposal while order is open", async () => {
    mockDb.proposal.findUnique.mockResolvedValue({
      id: "proposal-1",
      orderId: "order-1",
      providerId: "provider-1",
      order: { status: "OPEN" },
      provider: { userId: "provider-user-1" },
    });
    mockDb.proposal.delete.mockResolvedValue({});

    await expect(
      proposalService.withdraw("proposal-1", "provider-user-1"),
    ).resolves.toEqual({ success: true });
    expect(mockDb.proposal.delete).toHaveBeenCalledWith({
      where: { id: "proposal-1" },
    });
  });
});
