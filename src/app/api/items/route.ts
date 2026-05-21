import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const revalidate = 60;

async function fetchCollection(name: "subjects" | "bodies"): Promise<string[]> {
  const db = getAdminDb();
  if (!db) return [];
  const snap = await db.collection(name).get();
  return snap.docs
    .map((d) => d.data().text as string | undefined)
    .filter((s): s is string => typeof s === "string");
}

export async function GET() {
  if (!getAdminDb()) {
    return NextResponse.json(
      { subjects: [], bodies: [], error: "admin sdk not configured" },
      { status: 500 }
    );
  }
  const [subjects, bodies] = await Promise.all([
    fetchCollection("subjects"),
    fetchCollection("bodies"),
  ]);
  return NextResponse.json(
    { subjects, bodies },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
