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

  const handleLogin = async () => {
    try {
      await login();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // User cancelled - no alert
        return;
      }
      alert("이 계정은 로그인이 제한되어 있습니다.\n아래 '메일 앱으로 바로 열기'를 이용해주세요.");
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full max-w-[280px] px-6 py-3 bg-[#0071e3] text-white text-[15px] font-medium rounded-xl hover:bg-[#0077ED] active:scale-[0.98] transition-all"
    >
      Google로 로그인
    </button>
  );
}
