"use client";

import AdminPanel from "@/components/AdminPanel";
import { useAuth } from "@/components/AuthProvider";

const ADMIN_EMAILS = [
  "411@comebackgw.cloud",
  "my.westhk@gmail.com",
  "comebackgw411@gmail.com",
];

export default function AdminPage() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">
        <p className="text-[14px] text-[#86868b]">불러오는 중...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fbfbfd] gap-5">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">
          관리자
        </h1>
        <button
          onClick={() => { void login(); }}
          className="w-full max-w-[280px] py-3 bg-[#0071e3] text-white text-[15px] font-medium rounded-xl hover:bg-[#0077ED] active:scale-[0.98] transition-all"
        >
          Google 로그인
        </button>
      </main>
    );
  }

  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fbfbfd] gap-5">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">
          권한 없음
        </h1>
        <p className="text-[14px] text-[#86868b]">
          {user.email} 계정은 관리자가 아닙니다.
        </p>
        <button
          onClick={() => { void logout(); }}
          className="w-full max-w-[280px] py-3 bg-[#0071e3] text-white text-[15px] font-medium rounded-xl hover:bg-[#0077ED] active:scale-[0.98] transition-all"
        >
          로그아웃
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbfd] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">
            관리자
          </h1>
          <button
            onClick={() => { void logout(); }}
            className="text-[13px] text-[#86868b] hover:text-[#1d1d1f] transition-colors"
          >
            로그아웃
          </button>
        </div>
        <AdminPanel />
      </div>
    </main>
  );
}
