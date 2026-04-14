"use client";

import LoginButton from "@/components/LoginButton";
import SendMailButton from "@/components/SendMailButton";
import Stats from "@/components/Stats";
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

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbfd] px-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] mb-8">
          mail to wakeone
        </h1>
        <LoginButton />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#fbfbfd] px-6">
      <div className="w-full max-w-[420px] mx-auto flex flex-col min-h-screen">
        {/* Top: Stats */}
        <div className="flex items-center justify-center py-6">
          <Stats />
        </div>

        {/* Center: Title + Preview card */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
              mail to wakeone
            </h1>
            <div className="mt-2 flex items-center justify-center gap-2 text-[13px] text-[#86868b]">
              <span>{user.email}</span>
              <span>·</span>
              <LoginButton />
            </div>
          </div>
          <SendMailButton />
        </div>

        {/* Bottom: same height as top */}
        <div className="py-6" />
      </div>
    </main>
  );
}
