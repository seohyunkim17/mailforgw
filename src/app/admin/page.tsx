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
