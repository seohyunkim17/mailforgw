import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // Request Gmail send scope so the OAuth token can call Gmail API
  provider.addScope("https://www.googleapis.com/auth/gmail.send");
  return provider;
}

// Lazy singletons — only initialised on the client
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_auth) _auth = getFirebaseAuth();
    return (_auth as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_db) _db = getFirebaseDb();
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const googleProvider = new Proxy({} as GoogleAuthProvider, {
  get(_target, prop) {
    if (!_googleProvider) _googleProvider = getGoogleProvider();
    return (_googleProvider as unknown as Record<string | symbol, unknown>)[prop];
  },
});
