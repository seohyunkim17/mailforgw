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
  const { user, accessToken, login, logout } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sendCount, setSendCount] = useState(0);
  const [showSwitchPopup, setShowSwitchPopup] = useState(false);
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
        const newCount = sendCount + 1;
        setSendCount(newCount);
        if (newCount % 10 === 0) {
          setShowSwitchPopup(true);
        }
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

  const handleSwitch = async () => {
    setShowSwitchPopup(false);
    setSendCount(0);
    await logout();
    await login();
  };

  return (
    <>
      {/* Switch account popup */}
      {showSwitchPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-6 max-w-[320px] w-full shadow-xl text-center">
            <p className="text-[15px] font-semibold text-[#1d1d1f] mb-2">
              다른 계정으로 전환할까요?
            </p>
            <p className="text-[13px] text-[#86868b] mb-5">
              10건 발송했습니다. 다른 계정으로 로그인하면 더 많이 보낼 수 있어요.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSwitch}
                className="w-full py-3 bg-[#0071e3] text-white text-[15px] font-medium rounded-xl hover:bg-[#0077ED] active:scale-[0.98] transition-all"
              >
                다른 계정으로 로그인
              </button>
              <button
                onClick={() => setShowSwitchPopup(false)}
                className="w-full py-3 bg-[#f0f0f5] text-[#86868b] text-[15px] font-medium rounded-xl hover:bg-[#e8e8ed] active:scale-[0.98] transition-all"
              >
                아니오
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="w-full">
      {dataLoaded && previewSubject && previewBody && (
        <div className="w-full bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-[12.8px] font-bold text-[#4b4b4b] pb-[10px] text-center">
            {previewSubject}
          </p>
          <p className="text-[12px] text-[#6e6e73] leading-relaxed whitespace-pre-wrap text-justify">
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
    </>
  );
});

export default SendMailButton;
