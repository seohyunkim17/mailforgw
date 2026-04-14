"use client";

import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const RECIPIENTS = "wakeone@wake-one.com,protect@wake-one.com";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function MailtoFallback() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const [subjectsSnap, bodiesSnap] = await Promise.all([
        getDocs(collection(db, "subjects")),
        getDocs(collection(db, "bodies")),
      ]);
      const subjects = subjectsSnap.docs.map((d) => d.data().text as string);
      const bodies = bodiesSnap.docs.map((d) => d.data().text as string);

      if (subjects.length === 0 || bodies.length === 0) {
        alert("등록된 제목/내용이 없습니다.");
        setLoading(false);
        return;
      }

      const subject = pickRandom(subjects);
      const body = pickRandom(bodies);
      const mailto = `mailto:${RECIPIENTS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    } catch {
      alert("오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-[11px] text-[#aeaeb2] hover:text-[#1d1d1f] underline underline-offset-2 transition-colors disabled:opacity-50"
    >
      {loading ? "불러오는 중..." : "로그인 불가 시 클릭"}
    </button>
  );
}
