# mailforgw Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app where Google-authenticated users click one button to send a randomly composed email (from pre-registered subjects/bodies) to two fixed recipients via Gmail API.

**Architecture:** Next.js 14 App Router with Firebase Auth (Google login + Gmail API OAuth token) and Firestore (subject/body storage). Client-side Gmail API calls using the OAuth access token. Admin page with simple password gate for managing email templates.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Firebase Auth, Firestore, Gmail API (REST)

---

## File Structure

```
mailforgw/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Main page: login + send button
│   │   ├── globals.css           # Tailwind imports + minimal global styles
│   │   └── admin/
│   │       └── page.tsx          # Admin: password gate + subject/body CRUD
│   ├── lib/
│   │   ├── firebase.ts           # Firebase app init, auth, firestore exports
│   │   └── gmail.ts              # sendEmail() using Gmail API REST
│   └── components/
│       ├── AuthProvider.tsx       # Context provider for Firebase auth state
│       ├── LoginButton.tsx        # Google sign-in button
│       ├── SendMailButton.tsx     # Random email compose + send
│       └── AdminPanel.tsx         # Subject/body list management
├── public/
│   └── favicon.ico
├── .env.local.example            # Template for Firebase config values
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.js`, `tsconfig.json`, `.gitignore`, `.env.local.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Initialize Next.js project**

Run inside `C:/Users/user/Desktop/claude project/`:
```bash
npx create-next-app@14 mailforgw --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

- [ ] **Step 2: Create .env.local.example**

Create `mailforgw/.env.local.example`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

- [ ] **Step 3: Update .gitignore to include .env.local**

Verify `.gitignore` contains `.env.local` (create-next-app should include it). If not, add it.

- [ ] **Step 4: Initialize git repo and create GitHub remote**

```bash
cd mailforgw
git init
git add -A
git commit -m "chore: initial Next.js scaffold"
```

Then create GitHub repo:
```bash
gh repo create seohyunkim17/mailforgw --public --source=. --push
```

If `gh` is not available, the user will need to create the repo manually on GitHub and push.

- [ ] **Step 5: Verify dev server runs**

```bash
npm run dev
```
Expected: Server starts on http://localhost:3000, default Next.js page renders.

---

### Task 2: Firebase Setup (Auth + Firestore)

**Files:**
- Create: `src/lib/firebase.ts`
- Install: `firebase` package

- [ ] **Step 1: Install Firebase SDK**

```bash
npm install firebase
```

- [ ] **Step 2: Create Firebase initialization module**

Create `src/lib/firebase.ts`:
```typescript
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Request Gmail send scope so the OAuth token can call Gmail API
googleProvider.addScope("https://www.googleapis.com/auth/gmail.send");
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/firebase.ts package.json package-lock.json
git commit -m "feat: add Firebase initialization with Auth and Firestore"
```

---

### Task 3: Auth Provider + Login Button

**Files:**
- Create: `src/components/AuthProvider.tsx`
- Create: `src/components/LoginButton.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create AuthProvider context**

Create `src/components/AuthProvider.tsx`:
```typescript
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessToken: null,
  login: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = (await import("firebase/auth")).GoogleAuthProvider.credentialFromResult(result);
    // The OAuth access token from Google, needed for Gmail API
    if (credential?.accessToken) {
      setAccessToken(credential.accessToken);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 2: Create LoginButton component**

Create `src/components/LoginButton.tsx`:
```typescript
"use client";

import { useAuth } from "./AuthProvider";

export default function LoginButton() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{user.email}</span>
        <button
          onClick={logout}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
    >
      구글로 로그인
    </button>
  );
}
```

- [ ] **Step 3: Wrap layout with AuthProvider**

Replace `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mail for GW",
  description: "랜덤 메일 발송기",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create main page with login**

Replace `src/app/page.tsx`:
```typescript
"use client";

import LoginButton from "@/components/LoginButton";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8">Mail for GW</h1>
      <LoginButton />
      {user && (
        <p className="mt-4 text-gray-500 text-sm">로그인 완료. 메일 발송 준비됨.</p>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Verify login flow works**

Run `npm run dev`, open http://localhost:3000.
Expected: "구글로 로그인" button renders. (Actual Google login requires `.env.local` Firebase config.)

- [ ] **Step 6: Commit**

```bash
git add src/components/AuthProvider.tsx src/components/LoginButton.tsx src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add Google auth with Firebase and login UI"
```

---

### Task 4: Gmail API Send Function

**Files:**
- Create: `src/lib/gmail.ts`

- [ ] **Step 1: Create Gmail send helper**

Create `src/lib/gmail.ts`:
```typescript
const RECIPIENTS = [
  "wakeione@wake-one.com",
  "protect@wake-one.com",
];

function buildRawEmail(from: string, subject: string, body: string): string {
  const to = RECIPIENTS.join(", ");
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    btoa(unescape(encodeURIComponent(body))),
  ].join("\r\n");

  // Gmail API expects URL-safe base64
  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmail(
  accessToken: string,
  fromEmail: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const raw = buildRawEmail(fromEmail, subject, body);

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.error?.message || "발송 실패" };
  }

  return { success: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/gmail.ts
git commit -m "feat: add Gmail API send helper with RFC 2822 encoding"
```

---

### Task 5: Send Mail Button (Firestore random pick + send)

**Files:**
- Create: `src/components/SendMailButton.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create SendMailButton component**

Create `src/components/SendMailButton.tsx`:
```typescript
"use client";

import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendEmail } from "@/lib/gmail";
import { useAuth } from "./AuthProvider";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SendMailButton() {
  const { user, accessToken, login } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!accessToken) {
      // Token expired or not available, re-login to get fresh token
      await login();
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      // Fetch all subjects and bodies from Firestore
      const [subjectsSnap, bodiesSnap] = await Promise.all([
        getDocs(collection(db, "subjects")),
        getDocs(collection(db, "bodies")),
      ]);

      const subjects = subjectsSnap.docs.map((d) => d.data().text as string);
      const bodies = bodiesSnap.docs.map((d) => d.data().text as string);

      if (subjects.length === 0 || bodies.length === 0) {
        setStatus("error");
        setMessage("등록된 제목 또는 내용이 없습니다. 관리자에게 문의하세요.");
        return;
      }

      const subject = pickRandom(subjects);
      const body = pickRandom(bodies);

      const result = await sendEmail(accessToken, user!.email!, subject, body);

      if (result.success) {
        setStatus("success");
        setMessage("메일 발송 완료!");
      } else {
        setStatus("error");
        setMessage(result.error || "발송 실패");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "오류 발생");
    }

    // Reset status after 3 seconds
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleSend}
        disabled={status === "sending"}
        className="px-8 py-4 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "sending" ? "발송 중..." : "메일 보내기"}
      </button>
      {message && (
        <p
          className={`text-sm font-medium ${
            status === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update main page to show SendMailButton when logged in**

Replace `src/app/page.tsx`:
```typescript
"use client";

import LoginButton from "@/components/LoginButton";
import SendMailButton from "@/components/SendMailButton";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-2xl font-bold">Mail for GW</h1>
      {user ? (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.email}</span>
            <LoginButton />
          </div>
          <SendMailButton />
        </>
      ) : (
        <LoginButton />
      )}
    </main>
  );
}
```

- [ ] **Step 3: Verify UI renders correctly**

Run `npm run dev`. Expected: Login button on load. After login, send button and email displayed.

- [ ] **Step 4: Commit**

```bash
git add src/components/SendMailButton.tsx src/app/page.tsx
git commit -m "feat: add random email compose and send button"
```

---

### Task 6: Admin Page (Password Gate + Subject/Body CRUD)

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/AdminPanel.tsx`

- [ ] **Step 1: Create AdminPanel component**

Create `src/components/AdminPanel.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Item {
  id: string;
  text: string;
}

function ItemManager({
  title,
  collectionName,
  isTextarea,
}: {
  title: string;
  collectionName: string;
  isTextarea?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, text: d.data().text })));
    });
    return unsubscribe;
  }, [collectionName]);

  const handleAdd = async () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    await addDoc(collection(db, collectionName), {
      text: trimmed,
      createdAt: serverTimestamp(),
    });
    setNewText("");
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, collectionName, id));
  };

  const InputComponent = isTextarea ? "textarea" : "input";

  return (
    <div className="flex-1 min-w-0">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="flex gap-2 mb-4">
        <InputComponent
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={`새 ${title} 입력...`}
          className="flex-1 border rounded px-3 py-2 text-sm min-w-0"
          rows={isTextarea ? 3 : undefined}
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
        >
          추가
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded text-sm"
          >
            <span className="break-all">{item.text}</span>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-red-500 hover:text-red-700 text-xs whitespace-nowrap"
            >
              삭제
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-gray-400 text-sm">등록된 항목이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <ItemManager title="제목" collectionName="subjects" />
      <ItemManager title="내용" collectionName="bodies" isTextarea />
    </div>
  );
}
```

- [ ] **Step 2: Create admin page with password gate**

Create `src/app/admin/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import AdminPanel from "@/components/AdminPanel";

const ADMIN_PASSWORD = "Forgw03!";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_auth");
      if (stored === "true") setAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      localStorage.setItem("admin_auth", "true");
      setError("");
    } else {
      setError("비밀번호가 틀렸습니다.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <h1 className="text-xl font-bold">관리자 로그인</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="비밀번호 입력"
          className="border rounded px-4 py-2"
        />
        <button
          onClick={handleLogin}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          확인
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">관리자 페이지</h1>
        <button
          onClick={() => {
            localStorage.removeItem("admin_auth");
            setAuthenticated(false);
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          로그아웃
        </button>
      </div>
      <AdminPanel />
    </main>
  );
}
```

- [ ] **Step 3: Verify admin page works**

Run `npm run dev`, go to http://localhost:3000/admin.
Expected: Password prompt. Enter "Forgw03!" → shows subject/body management UI.

- [ ] **Step 4: Commit**

```bash
git add src/components/AdminPanel.tsx src/app/admin/page.tsx
git commit -m "feat: add admin page with password gate and subject/body CRUD"
```

---

### Task 7: Final Polish + Build Verification

**Files:**
- Modify: `src/app/globals.css` (cleanup if needed)
- Modify: `src/app/page.tsx` (add link to admin)

- [ ] **Step 1: Add admin link to main page footer**

Add to the bottom of `src/app/page.tsx`, inside the `<main>` tag before the closing tag:
```typescript
      <footer className="fixed bottom-4 right-4">
        <a href="/admin" className="text-xs text-gray-400 hover:text-gray-600">
          관리자
        </a>
      </footer>
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add admin link and finalize UI"
```

- [ ] **Step 4: Ask user for push permission, then push**

```bash
git push origin main
```

---

### Task 8: Setup Guide for User (Google Cloud + Firebase Console)

This is documentation the user follows manually — not code.

- [ ] **Step 1: Create setup guide**

Create `SETUP.md` in project root with these instructions:

1. **Google Cloud Console** (https://console.cloud.google.com)
   - 새 프로젝트 생성
   - APIs & Services → Library → "Gmail API" 검색 → 활성화
   - APIs & Services → OAuth consent screen → External → 앱 이름/이메일 입력 → 스코프에 `gmail.send` 추가
   - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID → Web application
     - Authorized JavaScript origins: `http://localhost:3000`, `https://your-domain.vercel.app`
     - Authorized redirect URIs: (Firebase Auth에서 자동 관리됨)

2. **Firebase Console** (https://console.firebase.google.com)
   - 새 프로젝트 생성 (위에서 만든 Google Cloud 프로젝트와 연결)
   - Authentication → Sign-in method → Google 활성화
   - Firestore Database → 데이터베이스 만들기 → 테스트 모드로 시작
   - 프로젝트 설정 → 웹 앱 추가 → Firebase config 값 복사

3. **`.env.local` 작성** — `.env.local.example`을 복사하여 Firebase config 값 입력

4. **Vercel 배포**
   - Vercel에서 GitHub 레포 연결
   - Environment Variables에 `.env.local` 값들 입력
   - Deploy

- [ ] **Step 2: Commit**

```bash
git add SETUP.md
git commit -m "docs: add setup guide for Google Cloud and Firebase"
```
