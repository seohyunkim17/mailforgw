import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export const DEFAULT_IMAGE_URL =
  "https://pbs.twimg.com/media/HF4KLdJawAAun3C?format=jpg&name=4096x4096";
export const DEFAULT_RECIPIENT = "02-371-8496";

export interface FaxConfig {
  imageUrl: string;
  recipientNumber: string;
  updatedAt?: Timestamp;
}

const CONFIG_COLLECTION = "faxConfig";
const CONFIG_DOC = "default";

export async function getFaxConfig(): Promise<FaxConfig> {
  try {
    const snap = await getDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC));
    if (snap.exists()) {
      const data = snap.data();
      return {
        imageUrl: data.imageUrl || DEFAULT_IMAGE_URL,
        recipientNumber: data.recipientNumber || DEFAULT_RECIPIENT,
        updatedAt: data.updatedAt,
      };
    }
  } catch {
    // fallback to defaults
  }
  return {
    imageUrl: DEFAULT_IMAGE_URL,
    recipientNumber: DEFAULT_RECIPIENT,
  };
}

export async function updateFaxConfig(
  next: Pick<FaxConfig, "imageUrl" | "recipientNumber">
): Promise<void> {
  await setDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC), {
    imageUrl: next.imageUrl,
    recipientNumber: next.recipientNumber,
    updatedAt: Timestamp.now(),
  });
}
