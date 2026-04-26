"use server";

import { db } from "@/shared/lib/db";
import { z } from "zod";
import { isRegionSupported, GEO_LIMIT_MESSAGE } from "@/shared/config/geo";

const citySchema = z.object({
  name: z.string(),
  fiasId: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

/**
 * Гарантирует наличие города или населенного пункта в базе данных.
 * Если населенного пункта нет, создает его (только для регионов ЮФО).
 * Автоматически привязывает все активные категории к новому пункту.
 */
export async function ensureCityAction(data: z.infer<typeof citySchema>) {
  if (!isRegionSupported(data.region)) {
    throw new Error(GEO_LIMIT_MESSAGE);
  }

  const slug = generateSlug(data.name);

  const existingCity = await db.city.findFirst({
    where: {
      OR: [
        ...(data.fiasId ? [{ fiasId: data.fiasId }] : []),
        { name: data.name },
      ]
    }
  });

  if (existingCity) {
    if ((!existingCity.fiasId && data.fiasId) || (!existingCity.lat && data.lat)) {
      await db.city.update({
        where: { id: existingCity.id },
        data: {
          fiasId: existingCity.fiasId || data.fiasId,
          lat: existingCity.lat || data.lat,
          lng: existingCity.lng || data.lng,
        }
      });
    }
    return { id: existingCity.id };
  }

  const newCity = await db.city.create({
    data: {
      name: data.name,
      slug: `${slug}-${Math.random().toString(36).slice(2, 5)}`,
      fiasId: data.fiasId,
      region: data.region,
      lat: data.lat,
      lng: data.lng,
      isActive: true,
    }
  });

  const categories = await db.category.findMany({
    where: { isActive: true }
  });

  if (categories.length > 0) {
    await db.cityCategory.createMany({
      data: categories.map(cat => ({
        cityId: newCity.id,
        categoryId: cat.id,
        sortOrder: cat.sortOrder
      })),
      skipDuplicates: true
    });
  }

  return { id: newCity.id };
}

function generateSlug(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => map[char] || char)
    .join('')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
