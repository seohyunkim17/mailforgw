"use client";

import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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
        return;
      }

      const subject = pickRandom(subjects);
      const body = pickRandom(bodies);

      const result = await sendEmail(accessToken, user!.email!, subject, body);

      if (result.success) {
        setStatus("success");
        setMessage("메일 발송 완료!");
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

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleSend}
        disabled={status === "sending"}
        className="px-8 py-4 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "sending" ? "발송 중..." : "메일 보내기"}
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
    </div>
  );
}
