"use server";

import { revalidatePath } from "next/cache";
import { authActionClient } from "@/shared/lib/safe-action";
import { listingService } from "@/services/listing.service";
import { db } from "@/shared/lib/db";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import {
  createListingSchema,
  updateListingSchema,
  toggleListingSchema,
  deleteListingSchema,
} from "../model/schema";

async function getProviderIdOrThrow(userId: string) {
  const provider = await db.providerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!provider) throw new Error("Необходим профиль исполнителя");
  return provider.id;
}

export const createListingAction = authActionClient
  .schema(createListingSchema)
  .action(async ({ parsedInput, ctx }) => {
    const rl = await checkRateLimit({ key: `listing:create:${ctx.userId}`, limit: 3, windowSec: 3600 });
    if (!rl.allowed) {
      throw new Error(`Лимит создания объявлений (3 в час). Попробуйте через ${Math.ceil(rl.retryAfterSec / 60)} мин.`);
    }

    const providerId = await getProviderIdOrThrow(ctx.userId);

    const listing = await listingService.create({
      ...parsedInput,
      providerId,
      priceFrom: parsedInput.priceFrom,
      priceTo: parsedInput.priceTo,
    });

    revalidatePath("/listings");
    revalidatePath("/my-listings");

    return { id: listing.id, slug: listing.slug };
  });

export const updateListingAction = authActionClient
  .schema(updateListingSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx }) => {
    const providerId = await getProviderIdOrThrow(ctx.userId);

    const listing = await db.serviceListing.findUnique({
      where: { id },
      select: { providerId: true },
    });
    if (!listing) throw new Error("Объявление не найдено");
    if (listing.providerId !== providerId) throw new Error("Нет прав на редактирование");

    await listingService.update(id, data);

    revalidatePath("/listings");
    revalidatePath("/my-listings");
    revalidatePath(`/listings/${id}`);

    return { success: true };
  });

export const toggleListingStatusAction = authActionClient
  .schema(toggleListingSchema)
  .action(async ({ parsedInput: { id, currentStatus }, ctx }) => {
    const providerId = await getProviderIdOrThrow(ctx.userId);

    const listing = await db.serviceListing.findUnique({
      where: { id },
      select: { providerId: true },
    });
    if (!listing) throw new Error("Объявление не найдено");
    if (listing.providerId !== providerId) throw new Error("Нет прав");

    await listingService.toggleStatus(id, currentStatus);

    revalidatePath("/my-listings");
    revalidatePath("/listings");

    return { success: true };
  });

export const deleteListingAction = authActionClient
  .schema(deleteListingSchema)
  .action(async ({ parsedInput: { id }, ctx }) => {
    const providerId = await getProviderIdOrThrow(ctx.userId);

    const listing = await db.serviceListing.findUnique({
      where: { id },
      select: { providerId: true },
    });
    if (!listing) throw new Error("Объявление не найдено");
    if (listing.providerId !== providerId) throw new Error("Нет прав");

    await listingService.delete(id);

    revalidatePath("/my-listings");
    revalidatePath("/listings");

    return { success: true };
  });
