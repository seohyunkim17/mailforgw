import { auth } from "./firebase";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

type FirestoreDoc = {
  fields?: { text?: { stringValue?: string } };
};

async function fetchCollection(
  name: "subjects" | "bodies",
  idToken: string | null
): Promise<string[]> {
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${name}?pageSize=1000`;
  const url = idToken ? base : `${base}&key=${API_KEY}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { documents?: FirestoreDoc[] };
  return (json.documents || [])
    .map((d) => d.fields?.text?.stringValue)
    .filter((s): s is string => typeof s === "string");
}

export async function fetchItems(): Promise<{ subjects: string[]; bodies: string[] }> {
  const idToken = (await auth.currentUser?.getIdToken()) ?? null;
  const [subjects, bodies] = await Promise.all([
    fetchCollection("subjects", idToken),
    fetchCollection("bodies", idToken),
  ]);
  return { subjects, bodies };
}
