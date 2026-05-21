import { NextResponse } from "next/server";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const dynamic = "force-dynamic";

type FirestoreDoc = {
  fields?: { text?: { stringValue?: string } };
};

async function fetchCollection(name: string): Promise<string[]> {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/(default)/documents/${name}` +
    `?pageSize=1000&key=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { documents?: FirestoreDoc[] };
  return (json.documents || [])
    .map((d) => d.fields?.text?.stringValue)
    .filter((s): s is string => typeof s === "string");
}

export async function GET() {
  if (!PROJECT_ID || !API_KEY) {
    return NextResponse.json({ subjects: [], bodies: [] }, { status: 500 });
  }
  const [subjects, bodies] = await Promise.all([
    fetchCollection("subjects"),
    fetchCollection("bodies"),
  ]);
  return NextResponse.json({ subjects, bodies });
}
