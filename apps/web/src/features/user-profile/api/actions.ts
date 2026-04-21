"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/shared/lib/db";
import { authActionClient } from "@/shared/lib/safe-action";
import { userService } from "@/services/user.service";

import {
  updateBasicProfileSchema,
  changePasswordSchema,
} from "../model/schema";

export const updateBasicProfileAction = authActionClient
  .schema(updateBasicProfileSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const city = await db.city.findUnique({
      where: { id: parsedInput.cityId },
      select: { id: true },
    });
    if (!city) throw new Error("Город не найден");

    await userService.update(userId, {
      firstName: parsedInput.firstName,
      lastName: parsedInput.lastName || undefined,
      displayName: parsedInput.displayName || undefined,
      cityId: parsedInput.cityId,
    });

    if (parsedInput.phone !== undefined) {
      await db.user.update({
        where: { id: userId },
        data: { phone: parsedInput.phone || null },
      });
    }

    revalidatePath("/profile");
    revalidatePath("/settings");
    return { success: true };
  });

export const changePasswordAction = authActionClient
  .schema(changePasswordSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, authProvider: true },
    });

    if (!user) throw new Error("Пользователь не найден");
    if (!user.passwordHash) {
      throw new Error("У вашего аккаунта не установлен пароль");
    }

    const bcrypt = await import("bcryptjs");

    const isValid = await bcrypt.compare(
      parsedInput.currentPassword,
      user.passwordHash
    );
    if (!isValid) throw new Error("Текущий пароль неверный");

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(parsedInput.newPassword, salt);

    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  });
