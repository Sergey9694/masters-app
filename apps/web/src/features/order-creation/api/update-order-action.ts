"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { orderService } from "@/services/order.service";

const updateOrderSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(5, "Заголовок должен быть не менее 5 символов").max(100),
  description: z.string().min(10, "Описание слишком короткое").max(1000),
  categoryId: z.string().min(1, "Выберите категорию"),
  cityId: z.string().min(1, "Выберите город"),
  budget: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      message: "Бюджет не может быть отрицательным",
    }),
  address: z.string().min(5, "Адрес слишком короткий").optional().or(z.literal("")),
});

export const updateOrderAction = authActionClient
  .schema(updateOrderSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx }) => {
    const order = await orderService.update(id, data, ctx.userId);
    const orderUrl = `/orders/${order.category.slug}/${order.slug || order.id}`;

    revalidatePath(`/orders`);
    revalidatePath(`/my-orders`);
    revalidatePath(orderUrl);

    return { success: true, redirect: orderUrl };
  });
