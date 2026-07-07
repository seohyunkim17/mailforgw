"use client";

import { useState, useEffect } from "react";
import { collection, getCountFromServer, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

function formatCount(n: number): string {
  if (n >= 10000) {
    const man = Math.floor(n / 10000);
    const rest = n % 10000;
    return rest > 0 ? `${man}만 ${rest.toLocaleString()}` : `${man}만`;
  }
  return n.toLocaleString();
}

function getTodayMidnightKST(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCHours(0, 0, 0, 0);
  return new Date(kst.getTime() - 9 * 60 * 60 * 1000);
}

export default function Stats() {
  const { user } = useAuth();
  const [myCount, setMyCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    // Count the two independently: a failure of one (e.g. a missing composite
    // index on the per-user query) must not silently zero out the other.
    // Surface errors to the console instead of masking them as 0, so a blocked
    // read (rules / index / wrong project) is diagnosable rather than looking
    // like "no data".
    const fetchMy = async () => {
      try {
        const todayMidnight = getTodayMidnightKST();
        const myQ = query(
          collection(db, "sendLogs"),
          where("userId", "==", user.uid),
          where("sentAt", ">=", Timestamp.fromDate(todayMidnight))
        );
        const snap = await getCountFromServer(myQ);
        setMyCount(snap.data().count);
      } catch (e) {
        console.error("[Stats] failed to count today's sends:", e);
        setMyCount(0);
      }
    };

    const fetchTotal = async () => {
      try {
        const snap = await getCountFromServer(collection(db, "sendLogs"));
        setTotalCount(snap.data().count);
      } catch (e) {
        console.error("[Stats] failed to count total sends:", e);
        // Leave as null (renders "–") rather than a misleading 0.
        setTotalCount(null);
      }
    };

    fetchMy();
    fetchTotal();

    const handler = () => {
      setMyCount((prev) => (prev === null ? 1 : prev + 1));
      setTotalCount((prev) => (prev === null ? prev : prev + 1));
    };
    window.addEventListener("mail-sent", handler);
    return () => window.removeEventListener("mail-sent", handler);
  }, [user]);

  if (!user || myCount === null) return null;

  return (
    <div className="w-full max-w-[420px] h-[72px] flex items-center justify-center">
      <div className="w-full bg-[#f0f0f5] rounded-2xl py-3 flex items-center justify-center gap-8 text-[12px]">
        <div className="flex flex-col items-center">
          <span className="text-[17px] font-semibold text-[#86868b]">{myCount}</span>
          <span className="text-[#aeaeb2]">오늘</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[17px] font-semibold text-[#86868b]">{Math.max(500 - myCount, 0)}</span>
          <span className="text-[#aeaeb2]">내 1일 잔여</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[17px] font-semibold text-[#86868b]">{totalCount === null ? "–" : formatCount(totalCount)}</span>
          <span className="text-[#aeaeb2]">전체</span>
        </div>
      </div>
    </div>
  );
}
