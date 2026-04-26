import { db } from "@/shared/lib/db";
import { ListingStatus } from "@prisma/client";

export async function getAllListings(params: {
  page?: number;
  status?: ListingStatus;
  search?: string;
}) {
  const page = params.page ?? 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" as const } },
      { description: { contains: params.search, mode: "insensitive" as const } },
    ];
  }

  const [listings, total] = await Promise.all([
    db.serviceListing.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        priceFrom: true,
        priceUnit: true,
        createdAt: true,
        provider: {
          select: {
            user: { select: { firstName: true, avatar: true } },
          },
        },
        category: { select: { name: true } },
        city: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.serviceListing.count({ where }),
  ]);

  return { listings, total, page, totalPages: Math.ceil(total / pageSize) };
}
