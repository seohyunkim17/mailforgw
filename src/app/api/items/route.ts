import { NextResponse } from "next/server";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const dynamic = "force-dynamic";

type FirestoreDoc = {
  fields?: { text?: { stringValue?: string } };
};

async function fetchCollection(name: string): Promise<{ items: string[]; debug?: unknown }> {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/(default)/documents/${name}` +
    `?pageSize=1000&key=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    return { items: [], debug: { status: res.status, body: body.slice(0, 400) } };
  }
  const json = (await res.json()) as { documents?: FirestoreDoc[] };
  const items = (json.documents || [])
    .map((d) => d.fields?.text?.stringValue)
    .filter((s): s is string => typeof s === "string");
  return { items };
}

export async function GET() {
  if (!PROJECT_ID || !API_KEY) {
    return NextResponse.json(
      { subjects: [], bodies: [], debug: { missing: { PROJECT_ID: !PROJECT_ID, API_KEY: !API_KEY } } },
      { status: 500 }
    );
  }
  const [s, b] = await Promise.all([
    fetchCollection("subjects"),
    fetchCollection("bodies"),
  ]);
  return NextResponse.json({
    subjects: s.items,
    bodies: b.items,
    debug: { subjects: s.debug, bodies: b.debug },
  });
}
