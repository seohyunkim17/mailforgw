"use client";

export const dynamic = "force-dynamic";

import LoginButton from "@/components/LoginButton";
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
          <p className="mt-4 text-gray-500 text-sm">로그인 완료. 메일 발송 준비됨.</p>
        </>
      ) : (
        <LoginButton />
      )}
    </main>
  );
}
