"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

function formatCount(n: number): string {
  if (n >= 10000) {
    const man = Math.floor(n / 10000);
    const rest = n % 10000;
    return rest > 0 ? `${man}만 ${rest.toLocaleString()}` : `${man}만`;
  }
  return n.toLocaleString();
}

export default function FaxStats() {
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, "faxLogs"));
        setTotalCount(snap.size);
      } catch {
        setTotalCount(0);
      }
    };
    fetch();

    const handler = () => {
      setTotalCount((prev) => (prev === null ? 1 : prev + 1));
    };
    window.addEventListener("fax-sent", handler);
    return () => window.removeEventListener("fax-sent", handler);
  }, []);

  if (totalCount === null) return null;

  return (
    <div className="w-full max-w-[420px] h-[72px] flex items-center justify-center">
      <div className="w-full bg-[#f0f0f5] rounded-2xl py-3 flex items-center justify-center gap-8 text-[12px]">
        <div className="flex flex-col items-center">
          <span className="text-[17px] font-semibold text-[#86868b]">
            {formatCount(totalCount)}
          </span>
          <span className="text-[#aeaeb2]">전체 발송</span>
        </div>
      </div>
    </div>
  );
}
