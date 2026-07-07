import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { LANG_CODES, isLangCode, DEFAULT_LANG, type LangCode } from "@/lib/langs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LangBucket = { subjects: string[]; bodies: string[] };
type ItemsByLang = Record<LangCode, LangBucket>;

function emptyByLang(): ItemsByLang {
  return LANG_CODES.reduce((acc, code) => {
    acc[code] = { subjects: [], bodies: [] };
    return acc;
  }, {} as ItemsByLang);
}

export async function GET() {
  const envSet = !!process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { ...emptyByLang(), debug: { envSet, reason: "admin sdk not initialized" } },
        { status: 500 }
      );
    }
    const [sSnap, bSnap] = await Promise.all([
      db.collection("subjects").get(),
      db.collection("bodies").get(),
    ]);

    const result = emptyByLang();
    // Legacy docs created before the per-language feature have no `lang`
    // field. Treat those as the default language so they don't disappear.
    for (const d of sSnap.docs) {
      const data = d.data();
      const text = data.text as string | undefined;
      if (typeof text !== "string") continue;
      const lang = isLangCode(data.lang) ? data.lang : DEFAULT_LANG;
      result[lang].subjects.push(text);
    }
    for (const d of bSnap.docs) {
      const data = d.data();
      const text = data.text as string | undefined;
      if (typeof text !== "string") continue;
      const lang = isLangCode(data.lang) ? data.lang : DEFAULT_LANG;
      result[lang].bodies.push(text);
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    const err = e as Error & { code?: number | string };
    return NextResponse.json(
      {
        ...emptyByLang(),
        debug: {
          envSet,
          errorName: err.name,
          errorMessage: err.message,
          errorCode: err.code,
        },
      },
      { status: 500 }
    );
  }
}
