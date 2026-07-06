export type LangCode = "ko" | "zh" | "en" | "id";

export interface LangDef {
  code: LangCode;
  label: string; // 세그먼트 탭에 표기할 원어 라벨
}

export const LANGS: LangDef[] = [
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
  { code: "id", label: "Bahasa" },
];

export const LANG_CODES: LangCode[] = LANGS.map((l) => l.code);

export const DEFAULT_LANG: LangCode = "ko";

export function isLangCode(v: unknown): v is LangCode {
  return typeof v === "string" && (LANG_CODES as string[]).includes(v);
}
