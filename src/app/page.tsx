"use client";

import LoginButton from "@/components/LoginButton";
import SendMailButton from "@/components/SendMailButton";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fbfbfd]">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
            mail to wakeone
          </h1>
          {user && (
            <p className="mt-2 text-[13px] text-[#86868b]">{user.email}</p>
          )}
        </div>

        {user ? (
          <div className="w-full flex flex-col items-center gap-5">
            <SendMailButton />
            <LoginButton />
          </div>
        ) : (
          <LoginButton />
        )}
      </div>

    </main>
  );
}
