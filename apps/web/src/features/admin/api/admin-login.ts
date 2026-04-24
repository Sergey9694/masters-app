"use server";

import { createSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

export async function adminLogin(_prev: unknown, formData: FormData) {
  const result = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: "Заполните все поля" };
  }

  const { username, password } = result.data;

  const user = await db.user.findFirst({
    where: {
      email: { equals: username, mode: "insensitive" },
      role: "ADMIN",
    },
    select: { id: true, role: true, passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    return { error: "Неверный логин или пароль" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Неверный логин или пароль" };
  }

  await createSession(user.id, user.role);
  redirect("/admin");
}
