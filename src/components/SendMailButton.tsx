"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendEmail } from "@/lib/gmail";
import { useAuth } from "./AuthProvider";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SendMailButton() {
  const { user, accessToken, login } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [allBodies, setAllBodies] = useState<string[]>([]);
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewBody, setPreviewBody] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [subjectsSnap, bodiesSnap] = await Promise.all([
        getDocs(collection(db, "subjects")),
        getDocs(collection(db, "bodies")),
      ]);
      const subjects = subjectsSnap.docs.map((d) => d.data().text as string);
      const bodies = bodiesSnap.docs.map((d) => d.data().text as string);
      setAllSubjects(subjects);
      setAllBodies(bodies);
      setDataLoaded(true);
      if (subjects.length > 0 && bodies.length > 0) {
        setPreviewSubject(pickRandom(subjects));
        setPreviewBody(pickRandom(bodies));
      }
    } catch {
      setDataLoaded(true);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const shuffle = () => {
    if (allSubjects.length > 0) setPreviewSubject(pickRandom(allSubjects));
    if (allBodies.length > 0) setPreviewBody(pickRandom(allBodies));
  };

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const startCooldown = () => {
    setCooldown(2);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSend = async () => {
    let token = accessToken;
    if (!token) {
      token = await login();
      if (!token) return;
    }

    if (!previewSubject || !previewBody) {
      setStatus("error");
      setMessage("등록된 제목 또는 내용이 없습니다.");
      setTimeout(() => { setStatus("idle"); setMessage(""); }, 3000);
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const result = await sendEmail(token, user!.email!, previewSubject, previewBody);

      if (result.success) {
        setStatus("success");
        setMessage("발송 완료");

        if (user) {
          try {
            await addDoc(collection(db, "sendLogs"), {
              userId: user.uid,
              email: user.email,
              sentAt: Timestamp.now(),
            });
            window.dispatchEvent(new Event("mail-sent"));
          } catch { /* non-critical */ }
        }

        startCooldown();
        shuffle();
      } else {
        setStatus("error");
        setMessage(result.error || "발송 실패");
      }
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "오류 발생");
    }

    setTimeout(() => { setStatus("idle"); setMessage(""); }, 2500);
  };

  const isDisabled = status === "sending" || cooldown > 0;

  const buttonLabel = () => {
    if (status === "sending") return "발송 중...";
    if (cooldown > 0) return "대기 중";
    return "메일 보내기";
  };

  return (
    <>
      {message && (
        <div className="fixed top-6 inset-x-0 z-50 pointer-events-none flex justify-center animate-[fadeInOut_2.5s_ease-in-out]">
          <div
            className={`px-5 py-3 rounded-2xl text-[14px] font-medium ${
              status === "success"
                ? "bg-[#e8f0fe] text-[#0071e3]"
                : "bg-[#ffeaea] text-[#ff3b30]"
            }`}
          >
            {status === "success" ? `\u2713 ${message}` : message}
          </div>
        </div>
      )}

      <div className="w-full flex flex-col items-center">
        {dataLoaded && previewSubject && previewBody && (
          <div className="w-full bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-[#86868b] uppercase tracking-wide">
                미리보기
              </span>
              <button
                onClick={shuffle}
                className="text-[12px] text-[#0071e3] hover:text-[#0077ED] font-medium transition-colors"
              >
                새로고침
              </button>
            </div>
            <p className="text-[15px] font-semibold text-[#1d1d1f] mb-2">
              {previewSubject}
            </p>
            <p className="text-[13px] text-[#6e6e73] leading-relaxed whitespace-pre-wrap text-justify">
              {previewBody}
            </p>
          </div>
        )}

        {dataLoaded && !previewSubject && !previewBody && (
          <p className="text-[13px] text-[#86868b]">
            등록된 제목/내용이 없습니다.
          </p>
        )}

        {/* Mobile: fixed bottom / PC: inline */}
        <div className="
          fixed bottom-0 inset-x-0 pb-8 pt-4 bg-gradient-to-t from-[#fbfbfd] via-[#fbfbfd] to-transparent
          md:static md:bg-none md:pb-0 md:pt-6
          flex flex-col items-center gap-3
        ">
          <button
            onClick={handleSend}
            disabled={isDisabled}
            className={`
              w-[420px] max-w-[calc(100vw-48px)] py-4 text-[17px] font-semibold rounded-2xl
              transition-all active:scale-[0.97]
              ${isDisabled
                ? "bg-[#d2d2d7] text-white cursor-not-allowed"
                : "bg-[#1d1d1f] text-white hover:bg-[#000000]"
              }
            `}
          >
            {buttonLabel()}
          </button>
        </div>
      </div>
    </>
  );
}
