import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _db: Firestore | null = null;

function getServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) return null;
  const json = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(json) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
}

export function getAdminDb(): Firestore | null {
  if (_db) return _db;
  const sa = getServiceAccount();
  if (!sa) return null;
  const app: App =
    getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: sa.project_id,
            clientEmail: sa.client_email,
            privateKey: sa.private_key,
          }),
        })
      : getApps()[0];
  _db = getFirestore(app);
  return _db;
}
