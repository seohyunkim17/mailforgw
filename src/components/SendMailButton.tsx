"use client";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs, addDoc, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendEmail } from "@/lib/gmail";
import { useAuth } from "./AuthProvider";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTodayMidnightKST(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  kst.setUTCHours(0, 0, 0, 0); // midnight KST in UTC representation
  return new Date(kst.getTime() - 9 * 60 * 60 * 1000); // back to UTC
}

export default function SendMailButton() {
  const { user, accessToken, login } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch today's send count on mount (and when user changes)
  useEffect(() => {
    if (!user) {
      setTodayCount(null);
      return;
    }

    const fetchCount = async () => {
      try {
        const todayMidnight = getTodayMidnightKST();
        const q = query(
          collection(db, "sendLogs"),
          where("userId", "==", user.uid),
          where("sentAt", ">=", Timestamp.fromDate(todayMidnight))
        );
        const snap = await getDocs(q);
        setTodayCount(snap.size);
      } catch {
        setTodayCount(0);
      }
    };

    fetchCount();
  }, [user]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(5);
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
    if (!accessToken) {
      await login();
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const [subjectsSnap, bodiesSnap] = await Promise.all([
        getDocs(collection(db, "subjects")),
        getDocs(collection(db, "bodies")),
      ]);

      const subjects = subjectsSnap.docs.map((d) => d.data().text as string);
      const bodies = bodiesSnap.docs.map((d) => d.data().text as string);

      if (subjects.length === 0 || bodies.length === 0) {
        setStatus("error");
        setMessage("등록된 제목 또는 내용이 없습니다. 관리자에게 문의하세요.");
        setTimeout(() => { setStatus("idle"); setMessage(""); }, 3000);
        return;
      }

      const subject = pickRandom(subjects);
      const body = pickRandom(bodies);

      const result = await sendEmail(accessToken, user!.email!, subject, body);

      if (result.success) {
        setStatus("success");
        setMessage("메일 발송 완료!");

        // Log to Firestore and update local count
        if (user) {
          try {
            await addDoc(collection(db, "sendLogs"), {
              userId: user.uid,
              email: user.email,
              sentAt: Timestamp.now(),
            });
            setTodayCount((prev) => (prev === null ? 1 : prev + 1));
          } catch {
            // Non-critical: count logging failure should not affect UX
          }
        }

        startCooldown();
      } else {
        setStatus("error");
        setMessage(result.error || "발송 실패");
      }
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "오류 발생");
    }

    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 3000);
  };

  const isDisabled = status === "sending" || cooldown > 0;

  const buttonLabel = () => {
    if (status === "sending") return "발송 중...";
    if (cooldown > 0) return `${cooldown}초 후 재발송 가능`;
    return "메일 보내기";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleSend}
        disabled={isDisabled}
        className="px-8 py-4 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {buttonLabel()}
      </button>
      {message && (
        <p
          className={`text-sm font-medium ${
            status === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
      {user && todayCount !== null && (
        <p className="text-sm text-gray-500">
          오늘 발송: {todayCount} / 500건
        </p>
      )}
    </div>
  );
}
