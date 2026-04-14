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
