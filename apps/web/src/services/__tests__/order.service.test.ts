import { beforeEach, describe, expect, it, vi } from "vitest";

const notifyProvidersInCategories = vi.fn();
const notificationSend = vi.fn();
const notificationNotifyProviders = vi.fn();

const mockDb = {
  order: {
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  user: { findUnique: vi.fn() },
  providerCategory: { findMany: vi.fn() },
  providerProfile: { findUnique: vi.fn() },
  proposal: { findUnique: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
  $transaction: vi.fn(),
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
};

vi.mock("@/shared/lib/db", () => ({ db: mockDb }));
vi.mock("@/shared/lib/telegram/bot-notify", () => ({
  notifyProvidersInCategories,
}));
vi.mock("../notification.service", () => ({
  notificationService: {
    send: notificationSend,
    notifyProviders: notificationNotifyProviders,
  },
}));

const { orderService } = await import("../order.service");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("orderService.create", () => {
  it("creates an open order, generates slug and notifies providers", async () => {
    mockDb.order.create.mockResolvedValue({
      id: "order-1",
      orderNumber: 42,
    });
    mockDb.order.update.mockResolvedValue({
      id: "order-1",
      slug: "remont-krana-42",
      city: { slug: "moscow" },
      category: { slug: "santehnika" },
    });

    const result = await orderService.create(
      {
        categoryId: "category-1",
        cityId: "city-1",
        title: "Ремонт крана",
        description: "Течет кран",
        budget: "2500",
      },
      "client-1",
    );

    expect(mockDb.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: "client-1",
        categoryId: "category-1",
        cityId: "city-1",
        budget: 2500,
        status: "OPEN",
      }),
    });
    expect(mockDb.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-1" },
        data: { slug: "remont-krana-42" },
      }),
    );
    expect(notifyProvidersInCategories).toHaveBeenCalledWith(
      ["category-1"],
      "client-1",
      "Ремонт крана",
      "remont-krana-42",
    );
    expect(result.slug).toBe("remont-krana-42");
  });
});

describe("orderService.list", () => {
  it("counts orders with the same search filters used for the page", async () => {
    const createdAt = new Date("2026-04-30T10:00:00.000Z");
    mockDb.order.count.mockResolvedValue(1);
    mockDb.order.findMany.mockResolvedValue([
      {
        id: "order-1",
        orderNumber: 7,
        slug: "remont-7",
        title: "Ремонт двери",
        description: "Нужно починить дверь",
        images: [],
        budget: 1000,
        address: null,
        createdAt,
        status: "OPEN",
        category: { name: "Ремонт", slug: "remont" },
        client: { firstName: "Иван", avatar: null },
        city: { name: "Москва", slug: "moscow" },
        _count: { proposals: 0 },
      },
    ]);

    const result = await orderService.list({
      search: "дверь",
      pageSize: 10,
    });

    expect(mockDb.order.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: "OPEN",
        OR: [
          { title: { contains: "дверь", mode: "insensitive" } },
          { description: { contains: "дверь", mode: "insensitive" } },
        ],
      }),
    });
    expect(result.totalCount).toBe(1);
    expect(result.orders[0].proposalCount).toBe(0);
  });

  it("limits default provider feed to provider categories", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      providerProfile: { id: "provider-1" },
    });
    mockDb.providerCategory.findMany.mockResolvedValue([
      { categoryId: "cat-1" },
      { categoryId: "cat-2" },
    ]);
    mockDb.order.count.mockResolvedValue(0);
    mockDb.order.findMany.mockResolvedValue([]);
    mockDb.providerProfile.findUnique.mockResolvedValue(null);

    await orderService.list({}, "user-1");

    expect(mockDb.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "OPEN",
          categoryId: { in: ["cat-1", "cat-2"] },
        }),
      }),
    );
  });
});

describe("orderService.update", () => {
  it("rejects updates from a user who is not the order owner", async () => {
    mockDb.order.findUnique.mockResolvedValue({
      clientId: "client-1",
      status: "OPEN",
    });

    await expect(
      orderService.update("order-1", { title: "Новое название" }, "user-2"),
    ).rejects.toThrow("не являетесь автором");
    expect(mockDb.order.update).not.toHaveBeenCalled();
  });
});

describe("orderService.acceptProposal", () => {
  it("moves order to work and notifies selected and rejected providers", async () => {
    mockDb.proposal.findUnique.mockResolvedValue({
      id: "proposal-1",
      orderId: "order-1",
      providerId: "provider-1",
      provider: { userId: "provider-user-1" },
      order: { title: "Ремонт", clientId: "client-1", status: "OPEN" },
    });
    mockDb.order.update.mockResolvedValue({});
    mockDb.proposal.findMany.mockResolvedValue([
      { provider: { userId: "provider-user-2" } },
    ]);
    notificationSend.mockResolvedValue(undefined);

    const result = await orderService.acceptProposal("proposal-1", "client-1");

    expect(mockDb.order.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: {
        status: "IN_PROGRESS",
        assignedProviderId: "provider-1",
      },
    });
    expect(notificationSend).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "provider-user-1",
        type: "PROPOSAL_ACCEPTED",
      }),
    );
    expect(notificationSend).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "provider-user-2",
        type: "ORDER_CANCELED",
      }),
    );
    expect(result).toEqual({ success: true });
  });
});
