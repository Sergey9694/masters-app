import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  serviceListing: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  providerProfile: { findUnique: vi.fn() },
};

vi.mock("@/shared/lib/db", () => ({ db: mockDb }));

const { listingService } = await import("../listing.service");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listingService.search", () => {
  it("uses active status by default and returns cursor pagination", async () => {
    mockDb.serviceListing.findMany.mockResolvedValue([
      { id: "listing-1", title: "Уборка" },
      { id: "listing-2", title: "Ремонт" },
    ]);

    const result = await listingService.search({ cityId: "city-1", pageSize: 1 });

    expect(mockDb.serviceListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          cityId: "city-1",
          status: "ACTIVE",
        },
        take: 2,
      }),
    );
    expect(result.listings).toEqual([{ id: "listing-1", title: "Уборка" }]);
    expect(result.nextCursor).toBe("listing-1");
  });
});

describe("listingService.getByUser", () => {
  it("returns empty page when user has no provider profile", async () => {
    mockDb.providerProfile.findUnique.mockResolvedValue(null);

    await expect(listingService.getByUser("user-1")).resolves.toEqual({
      listings: [],
      nextCursor: null,
    });
  });
});

describe("listingService.create", () => {
  it("creates active listing and generates slug", async () => {
    mockDb.serviceListing.create.mockResolvedValue({
      id: "abcdef123456",
    });
    mockDb.serviceListing.update.mockResolvedValue({
      id: "abcdef123456",
      slug: "uborka-kvartiry-abcdef12",
    });

    const result = await listingService.create({
      providerId: "provider-1",
      categoryId: "category-1",
      cityId: "city-1",
      title: "Уборка квартиры",
      description: "Генеральная уборка",
    });

    expect(mockDb.serviceListing.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        providerId: "provider-1",
        status: "ACTIVE",
      }),
    });
    expect(mockDb.serviceListing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { slug: "uborka-kvartiry-abcdef12" },
      }),
    );
    expect(result.slug).toBe("uborka-kvartiry-abcdef12");
  });
});

describe("listingService moderation state changes", () => {
  it("toggles ACTIVE listing to PAUSED", async () => {
    mockDb.serviceListing.update.mockResolvedValue({ id: "listing-1", status: "PAUSED" });

    await listingService.toggleStatus("listing-1", "ACTIVE");

    expect(mockDb.serviceListing.update).toHaveBeenCalledWith({
      where: { id: "listing-1" },
      data: { status: "PAUSED" },
    });
  });

  it("soft-deletes listing by archiving it", async () => {
    mockDb.serviceListing.update.mockResolvedValue({ id: "listing-1", status: "ARCHIVED" });

    await listingService.delete("listing-1");

    expect(mockDb.serviceListing.update).toHaveBeenCalledWith({
      where: { id: "listing-1" },
      data: { status: "ARCHIVED" },
    });
  });
});
