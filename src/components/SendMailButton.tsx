"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { collection, getDocs, addDoc, Timestamp, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendEmail } from "@/lib/gmail";
import { useAuth } from "./AuthProvider";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTodayMidnightKST(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCHours(0, 0, 0, 0);
  return new Date(kst.getTime() - 9 * 60 * 60 * 1000);
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
  const [showLimitPopup, setShowLimitPopup] = useState(false);
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
    setCooldown(1);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    const to = setTimeout(() => { setCooldown(0); }, 100);
    cooldownRef.current = to as unknown as ReturnType<typeof setInterval>;
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

        // Check daily limit by querying today's count
        if (user) {
          try {
            const todayMidnight = getTodayMidnightKST();
            const myQ = query(
              collection(db, "sendLogs"),
              where("userId", "==", user.uid),
              where("sentAt", ">=", Timestamp.fromDate(todayMidnight))
            );
            const snap = await getDocs(myQ);
            if (snap.size >= 500) {
              setShowLimitPopup(true);
            }
          } catch { /* ignore */ }
        }

        setTimeout(() => { setStatus("idle"); }, 300);
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
      {/* Success toast */}
      {status === "success" && (
        <div
          key={`toast-${sendCount}`}
          className="fixed top-6 inset-x-0 z-50 pointer-events-none flex justify-center"
          style={{ animation: "toastSlide 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards" }}
        >
          <div className="px-5 py-3 rounded-2xl text-[14px] font-medium bg-[#e8f0fe] text-[#0071e3]">
            ✓ 발송 완료
          </div>
        </div>
      )}

      {/* Daily limit popup */}
      {showLimitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-6 max-w-[320px] w-full shadow-xl text-center">
            <p className="text-[15px] font-semibold text-[#1d1d1f] mb-2">
              오늘의 발송 한도에 도달했습니다
            </p>
            <p className="text-[13px] text-[#86868b] mb-5">
              이 계정의 1일 발송 한도 500건을 모두 사용했습니다.<br />다른 계정으로 로그인하여 계속 보낼 수 있습니다.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  setShowLimitPopup(false);
                  setSendCount(0);
                  await logout();
                  await login();
                }}
                className="w-full py-3 bg-[#0071e3] text-white text-[15px] font-medium rounded-xl hover:bg-[#0077ED] active:scale-[0.98] transition-all"
              >
                다른 계정으로 로그인하여 계속하기
              </button>
              <button
                onClick={() => setShowLimitPopup(false)}
                className="w-full py-3 bg-[#f0f0f5] text-[#86868b] text-[15px] font-medium rounded-xl hover:bg-[#e8e8ed] active:scale-[0.98] transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch account popup */}
      {showSwitchPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-6 max-w-[320px] w-full shadow-xl text-center">
            <p className="text-[15px] font-semibold text-[#1d1d1f] mb-2">
              다른 계정으로 전환할까요?
            </p>
            <p className="text-[13px] text-[#86868b] mb-5">
              100건 발송했습니다.<br />메일 주소 차단 방지를 위해 새 로그인을 권장합니다.
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
