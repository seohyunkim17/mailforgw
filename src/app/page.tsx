"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import LoginButton from "@/components/LoginButton";
import SendMailButton, { SendMailHandle } from "@/components/SendMailButton";
import Stats from "@/components/Stats";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();
  const sendRef = useRef<SendMailHandle>(null);
  const [btnState, setBtnState] = useState({ disabled: false, label: "메일 보내기" });

  // Poll ref for button state changes
  const updateBtn = useCallback(() => {
    if (sendRef.current) {
      setBtnState({
        disabled: sendRef.current.isDisabled,
        label: sendRef.current.buttonLabel,
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(updateBtn, 100);
    return () => clearInterval(interval);
  }, [updateBtn]);

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
    <main className="h-screen flex flex-col bg-[#fbfbfd] px-6 overflow-auto">
      {/* Top: Stats */}
      <div className="flex-shrink-0 flex items-center justify-center py-6">
        <Stats />
      </div>

      {/* Center: Title + Preview (vertically centered, title offset above) */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 min-h-0">
        <div className="w-full max-w-[420px] flex flex-col items-center -mt-10 overflow-auto max-h-full">
          <div className="text-center mb-6">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
              mail to wakeone
            </h1>
            <div className="mt-2 flex items-center justify-center gap-2 text-[13px] text-[#86868b]">
              <span>{user.email}</span>
              <span>·</span>
              <LoginButton />
            </div>
          </div>
          <SendMailButton ref={sendRef} />
        </div>
      </div>

      {/* Bottom: Send button (fixed) */}
      <div className="flex-shrink-0 flex items-center justify-center pt-2 pb-6">
        <button
          onClick={() => sendRef.current?.send()}
          disabled={btnState.disabled}
          className={`
            w-full max-w-[420px] py-4 text-[17px] font-semibold rounded-2xl
            transition-all active:scale-[0.97]
            ${btnState.disabled
              ? "bg-[#d2d2d7] text-white cursor-not-allowed"
              : "bg-[#1d1d1f] text-white hover:bg-[#000000]"
            }
          `}
        >
          {btnState.label}
        </button>
      </div>
    </main>
  );
}
