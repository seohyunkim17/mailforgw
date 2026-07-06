import { LANG_CODES, type LangCode } from "@/lib/langs";

export type LangBucket = { subjects: string[]; bodies: string[] };
export type ItemsByLang = Record<LangCode, LangBucket>;

export function emptyItemsByLang(): ItemsByLang {
  return LANG_CODES.reduce((acc, code) => {
    acc[code] = { subjects: [], bodies: [] };
    return acc;
  }, {} as ItemsByLang);
}

export async function fetchItems(): Promise<ItemsByLang> {
  try {
    const res = await fetch("/api/items");
    if (!res.ok) return emptyItemsByLang();
    const raw = (await res.json()) as Partial<ItemsByLang>;
    const out = emptyItemsByLang();
    for (const code of LANG_CODES) {
      const bucket = raw[code];
      if (bucket && Array.isArray(bucket.subjects) && Array.isArray(bucket.bodies)) {
        out[code] = { subjects: bucket.subjects, bodies: bucket.bodies };
      }
    }
    return out;
  } catch {
    return emptyItemsByLang();
  }
}
