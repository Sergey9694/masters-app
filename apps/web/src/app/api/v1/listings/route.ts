import { NextRequest } from "next/server";
import { listingService } from "@/services/listing.service";
import { providerService } from "@/services/provider.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { createListingSchema } from "@uslugi/validation";
import { ListingStatus } from "@prisma/client";

/**
 * GET /api/v1/listings?cityId=...&categoryId=...&status=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pageSize = searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 20;
    const cursor = searchParams.get("cursor") || undefined;
    const statusParam = searchParams.get("status") as ListingStatus | null;

    const result = await listingService.search({
      cityId: searchParams.get("cityId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      status: statusParam || undefined,
      pageSize,
      cursor,
    });

    return apiSuccess(result);
  } catch (error) {
    console.error("[API/LISTINGS/GET] Error:", error);
    return apiError("Failed to fetch listings", 500);
  }
}

/**
 * POST /api/v1/listings — создать объявление (только для исполнителей)
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  try {
    const body = await request.json();
    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const provider = await providerService.getByUserId(session.userId);
    if (!provider) {
      return apiError("Сначала зарегистрируйтесь как исполнитель", 403);
    }

    const listing = await listingService.create({
      providerId: provider.id,
      categoryId: parsed.data.categoryId,
      cityId: parsed.data.cityId,
      title: parsed.data.title,
      description: parsed.data.description,
      priceFrom: parsed.data.priceFrom ?? undefined,
      priceTo: parsed.data.priceTo ?? undefined,
      priceUnit: parsed.data.priceUnit,
      images: parsed.data.images,
      address: parsed.data.address,
    });

    return apiSuccess(listing, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create listing";
    console.error("[API/LISTINGS/POST] Error:", error);
    return apiError(message, 400);
  }
}
