"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import LoginButton from "@/components/LoginButton";
import SendMailButton, { SendMailHandle } from "@/components/SendMailButton";
import Stats from "@/components/Stats";
import MailtoFallback from "@/components/MailtoFallback";
import { useAuth } from "@/components/AuthProvider";

function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line|DaumApps|everytimeApp/i.test(ua);
}

export default function Home() {
  const { user, loading } = useAuth();
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);
  const sendRef = useRef<SendMailHandle>(null);
  const [btnState, setBtnState] = useState({ disabled: false, label: "메일 보내기" });

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
        <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
          to wakeone
        </h1>
        {inApp ? (
          <div className="mt-6 text-center">
            <p className="text-[13px] text-[#86868b] mb-1">
              인앱 브라우저에서는 Google 로그인이 지원되지 않습니다.
            </p>
            <p className="text-[13px] text-[#86868b] mb-5">
              링크 복사 후 Chrome 혹은 Safari로 접속해주세요.
            </p>
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                alert("링크가 복사되었습니다. Chrome 또는 Safari에 붙여넣기 해주세요.");
              }}
              className="w-full max-w-[280px] px-6 py-3 bg-[#1d1d1f] text-white text-[15px] font-medium rounded-xl active:scale-[0.98] transition-all"
            >
              링크 복사
            </button>
          </div>
        ) : (
          <div className="mt-8 w-full max-w-[280px] flex flex-col items-center">
            <LoginButton />
            <div className="mt-3 w-full">
              <MailtoFallback />
            </div>
            <p className="mt-4 text-[11px] text-[#4b4b4b] text-center underline underline-offset-2">
              반드시 Safari, Chrome 등으로 접속해주세요 (트위터 X)
            </p>
            <p className="mt-2 text-[11px] text-[#aeaeb2] text-center leading-relaxed">
              본 서비스는 개인 의견 전달을 위한 메일 간편 발송 서비스입니다.<br />로그인 시 이에 동의하며, 악의적으로 사용하지 않을 것을<br />약속하는 것으로 간주됩니다.
            </p>
          </div>
        )}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd] relative">
      {/* Top fixed: Stats + fade gradient */}
      <div className="fixed top-0 inset-x-0 z-10">
        <div className="bg-[#fbfbfd] pt-6 pb-2 flex items-center justify-center px-6">
          <Stats />
        </div>
        <div className="h-6 bg-gradient-to-b from-[#fbfbfd] to-transparent" />
      </div>

      {/* Scrollable content */}
      <main className="px-6 pt-28 pb-24">
        <div className="w-full max-w-[420px] mx-auto flex flex-col items-center">
          <div className="text-center mb-6">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
              to wakeone
            </h1>
            <div className="flex items-center justify-center gap-2 text-[13px] text-[#86868b]">
              <span>{user.email}</span>
              <span>·</span>
              <LoginButton />
            </div>
          </div>
          <SendMailButton ref={sendRef} />
        </div>
      </main>

      {/* Bottom fixed: Button + fade gradient */}
      <div className="fixed bottom-0 inset-x-0 z-10">
        <div className="h-6 bg-gradient-to-t from-[#fbfbfd] to-transparent" />
        <div className="bg-[#fbfbfd] pb-6 pt-1 px-6 flex justify-center">
          <div className="w-full max-w-[420px] flex items-center gap-3">
            <button
              onClick={() => sendRef.current?.shuffle()}
              className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-[#f0f0f5] text-[#86868b] hover:bg-[#e8e8ed] active:scale-[0.95] transition-all"
              aria-label="새로고침"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6" />
                <path d="M2.5 22v-6h6" />
                <path d="M2.5 11.5a10 10 0 0 1 18.8-4.3L21.5 8" />
                <path d="M21.5 12.5a10 10 0 0 1-18.8 4.2L2.5 16" />
              </svg>
            </button>
            <button
              onClick={() => sendRef.current?.send()}
              disabled={btnState.disabled}
              className={`
                flex-1 py-4 text-[17px] font-semibold rounded-2xl
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
        </div>
      </div>
    </div>
  );
}
