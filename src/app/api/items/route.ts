import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const envSet = !!process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { subjects: [], bodies: [], debug: { envSet, reason: "admin sdk not initialized" } },
        { status: 500 }
      );
    }
    const [sSnap, bSnap] = await Promise.all([
      db.collection("subjects").get(),
      db.collection("bodies").get(),
    ]);
    const subjects = sSnap.docs
      .map((d) => d.data().text as string | undefined)
      .filter((s): s is string => typeof s === "string");
    const bodies = bSnap.docs
      .map((d) => d.data().text as string | undefined)
      .filter((s): s is string => typeof s === "string");
    return NextResponse.json(
      { subjects, bodies },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    const err = e as Error & { code?: number | string };
    return NextResponse.json(
      {
        subjects: [],
        bodies: [],
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
