"use server";

export interface DadataSuggestion {
  value: string;
  unrestricted_value: string;
}

export async function suggestAddressAction(query: string): Promise<DadataSuggestion[]> {
  const token = process.env.DADATA_API_KEY;
  if (!token || !query.trim() || query.length < 3) return [];

  try {
    const res = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ query, count: 5, language: "ru" }),
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { suggestions?: DadataSuggestion[] };
    return data.suggestions ?? [];
  } catch {
    return [];
  }
}
