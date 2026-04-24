"use server";

import { db } from "@/shared/lib/db";
import { z } from "zod";

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
  const sfoRegions = [
    "ростовская", "краснодарский", "волгоградская", 
    "астраханская", "адыгея", "калмыкия", "крым", "севастополь",
    "донецкая", "луганская", "херсонская", "запорожская"
  ];

  const regionLower = data.region?.toLowerCase() || "";
  const isSfoRegion = sfoRegions.some(reg => regionLower.includes(reg));

  if (!isSfoRegion) {
    throw new Error("На данный момент сервис работает только в ЮФО и новых регионах РФ");
  }

  const slug = generateSlug(data.name);

  // Ищем по fiasId или по имени в этом регионе
  const existingCity = await db.city.findFirst({
    where: {
      OR: [
        { fiasId: data.fiasId ?? undefined },
        { name: data.name, region: data.region }
      ]
    }
  });

  if (existingCity) {
    return { id: existingCity.id };
  }

  // Создаем новый населенный пункт
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

  // Универсальная привязка: привязываем все активные категории к новому городу
  const categories = await db.category.findMany({
    where: { isActive: true, parentId: null } // Только корневые или все? Привяжем все активные.
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
