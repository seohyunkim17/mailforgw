"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendEmail } from "@/lib/gmail";
import { useAuth } from "./AuthProvider";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface SendMailHandle {
  send: () => void;
  shuffle: () => void;
  isDisabled: boolean;
  buttonLabel: string;
}

const SendMailButton = forwardRef<SendMailHandle>(function SendMailButton(_, ref) {
  const { user, accessToken, login } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
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
      setErrorMsg("등록된 제목 또는 내용이 없습니다.");
      setTimeout(() => { setStatus("idle"); setErrorMsg(""); }, 3000);
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const result = await sendEmail(token, user!.email!, previewSubject, previewBody);

      if (result.success) {
        setStatus("success");

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
        setTimeout(() => { setStatus("idle"); }, 2500);
      } else {
        setStatus("error");
        setErrorMsg(result.error || "발송 실패");
        setTimeout(() => { setStatus("idle"); setErrorMsg(""); }, 3000);
      }
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "오류 발생");
      setTimeout(() => { setStatus("idle"); setErrorMsg(""); }, 3000);
    }
  };

  const isDisabled = status === "sending" || cooldown > 0;

  const buttonLabel = (() => {
    if (status === "sending") return "발송 중...";
    if (cooldown > 0) return "대기 중";
    return "메일 보내기";
  })();

  useImperativeHandle(ref, () => ({
    send: handleSend,
    shuffle,
    isDisabled,
    buttonLabel,
  }));

  return (
    <div className="w-full">
      {dataLoaded && previewSubject && previewBody && (
        <div className="w-full bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-[12px] font-bold text-[#1d1d1f] mb-2 text-center">
            {previewSubject}
          </p>
          <p className="text-[13px] text-[#6e6e73] leading-relaxed whitespace-pre-wrap text-justify">
            {previewBody}
          </p>
        </div>
      )}

      {dataLoaded && !previewSubject && !previewBody && (
        <p className="text-[13px] text-[#86868b] text-center">
          등록된 제목/내용이 없습니다.
        </p>
      )}

      {errorMsg && (
        <p className="mt-3 text-[13px] text-[#ff3b30] font-medium text-center">{errorMsg}</p>
      )}
    </div>
  );
});

export default SendMailButton;
