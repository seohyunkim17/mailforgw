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
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fbfbfd] gap-5">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">
          관리자
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="비밀번호"
          className="w-full max-w-[280px] px-4 py-3 text-[16px] bg-[#f5f5f7] rounded-xl border-none outline-none focus:ring-2 focus:ring-[#0071e3] placeholder:text-[#86868b]"
        />
        <button
          onClick={handleLogin}
          className="w-full max-w-[280px] py-3 bg-[#0071e3] text-white text-[15px] font-medium rounded-xl hover:bg-[#0077ED] active:scale-[0.98] transition-all"
        >
          확인
        </button>
        {error && (
          <p className="text-[13px] text-[#ff3b30]">{error}</p>
        )}
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
            onClick={() => {
              localStorage.removeItem("admin_auth");
              setAuthenticated(false);
            }}
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
