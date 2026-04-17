"use server";

import { revalidatePath } from "next/cache";
import { masterProfileSchema } from "../model/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { providerService } from "@/services/provider.service";

export const saveProviderProfileAction = authActionClient
  .schema(masterProfileSchema)
  .action(async ({ parsedInput: data, ctx: { userId } }) => {
    try {
      const provider = await providerService.saveProfile(data, userId);

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/become-provider");
      revalidatePath(`/dashboard/providers/${provider.id}`);
      
      return { success: true, redirect: "/dashboard" };
    } catch (error) {
      console.error("[saveProviderProfileAction] error:", error);
      throw error instanceof Error ? error : new Error("Не удалось сохранить профиль");
    }
  });
