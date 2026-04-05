import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/lib/get-user";

// Серверный прокси к DaData. Токен хранится в DADATA_API_KEY (server-only).
// Клиент дёргает /api/suggest/address?q=..., CORS и утечки токена исключены.

const DADATA_URL =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";

export async function GET(req: Request) {
  // Только для авторизованных — чтобы не расходовать квоту DaData анонимами
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ suggestions: [] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();

  if (query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const token = process.env.DADATA_API_KEY;
  if (!token) {
    console.warn("[suggest/address] DADATA_API_KEY не задан");
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const resp = await fetch(DADATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ query, count: 7 }),
      cache: "no-store",
    });

    if (!resp.ok) {
      console.warn("[suggest/address] DaData status:", resp.status);
      return NextResponse.json({ suggestions: [] });
    }

    const data = (await resp.json()) as {
      suggestions?: Array<{ value: string }>;
    };

    const suggestions = (data.suggestions ?? []).map((s) => s.value);
    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("[suggest/address] fetch error:", e);
    return NextResponse.json({ suggestions: [] });
  }
}
