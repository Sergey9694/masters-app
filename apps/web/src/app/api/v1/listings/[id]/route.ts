import { NextRequest } from "next/server";
import { listingService } from "@/services/listing.service";
import { providerService } from "@/services/provider.service";
import { apiSuccess, apiUnauthorized, apiError, apiForbidden } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { updateListingSchema } from "@uslugi/validation";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/listings/[id]
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const listing = await listingService.getById(id);
    if (!listing) return apiError("Listing not found", 404);
    return apiSuccess(listing);
  } catch (error) {
    console.error("[API/LISTINGS/:id/GET] Error:", error);
    return apiError("Failed to fetch listing", 500);
  }
}

/**
 * PATCH /api/v1/listings/[id]
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;
  try {
    const listing = await listingService.getById(id);
    if (!listing) return apiError("Listing not found", 404);

    const provider = await providerService.getByUserId(session.userId);
    if (!provider || provider.id !== listing.providerId) return apiForbidden();

    const body = await request.json();
    const parsed = updateListingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const updated = await listingService.update(id, {
      ...parsed.data,
      priceFrom: parsed.data.priceFrom ?? undefined,
      priceTo: parsed.data.priceTo ?? undefined,
    });
    return apiSuccess(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update listing";
    console.error("[API/LISTINGS/:id/PATCH] Error:", error);
    return apiError(message, 400);
  }
}

/**
 * DELETE /api/v1/listings/[id] — soft delete (ARCHIVED)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;
  try {
    const listing = await listingService.getById(id);
    if (!listing) return apiError("Listing not found", 404);

    const provider = await providerService.getByUserId(session.userId);
    if (!provider || provider.id !== listing.providerId) return apiForbidden();

    await listingService.delete(id);
    return apiSuccess({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete listing";
    console.error("[API/LISTINGS/:id/DELETE] Error:", error);
    return apiError(message, 400);
  }
}
