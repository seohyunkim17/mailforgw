"use client";

import { useAuth } from "./AuthProvider";

export default function LoginButton() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <button
        onClick={logout}
        className="text-[13px] text-[#86868b] hover:text-[#1d1d1f] transition-colors"
      >
        logout
      </button>
    );
  }

  return (
    <button
      onClick={login}
      className="w-full max-w-[280px] px-6 py-3 bg-[#0071e3] text-white text-[15px] font-medium rounded-xl hover:bg-[#0077ED] active:scale-[0.98] transition-all"
    >
      Google로 로그인
    </button>
  );
}
