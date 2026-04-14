"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
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
    const fetchCounts = async () => {
      try {
        const todayMidnight = getTodayMidnightKST();
        const myQ = query(
          collection(db, "sendLogs"),
          where("userId", "==", user.uid),
          where("sentAt", ">=", Timestamp.fromDate(todayMidnight))
        );
        const [mySnap, totalSnap] = await Promise.all([
          getDocs(myQ),
          getDocs(collection(db, "sendLogs")),
        ]);
        setMyCount(mySnap.size);
        setTotalCount(totalSnap.size);
      } catch {
        setMyCount(0);
        setTotalCount(0);
      }
    };
    fetchCounts();

    // Listen for custom event from SendMailButton
    const handler = () => {
      setMyCount((prev) => (prev === null ? 1 : prev + 1));
      setTotalCount((prev) => (prev === null ? 1 : prev + 1));
    };
    window.addEventListener("mail-sent", handler);
    return () => window.removeEventListener("mail-sent", handler);
  }, [user]);

  if (!user || myCount === null || totalCount === null) return null;

  return (
    <div className="flex items-center gap-6 text-[12px]">
      <div className="flex flex-col items-center">
        <span className="text-[18px] font-semibold text-[#86868b]">{myCount}</span>
        <span className="text-[#aeaeb2]">오늘</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[18px] font-semibold text-[#86868b]">{Math.max(500 - myCount, 0)}</span>
        <span className="text-[#aeaeb2]">내 잔여</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[18px] font-semibold text-[#86868b]">{formatCount(totalCount)}</span>
        <span className="text-[#aeaeb2]">전체</span>
      </div>
    </div>
  );
}
