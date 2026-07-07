"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LANGS, DEFAULT_LANG, isLangCode, type LangCode } from "@/lib/langs";

interface Item {
  id: string;
  text: string;
}

function ItemManager({
  title,
  collectionName,
  isTextarea,
  lang,
}: {
  title: string;
  collectionName: string;
  isTextarea?: boolean;
  lang: LangCode;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    // Read the whole collection and bucket client-side. Legacy docs created
    // before the per-language feature have no `lang` field; treat those as the
    // default language so they remain visible and manageable.
    const unsubscribe = onSnapshot(collection(db, collectionName), (snap) => {
      setItems(
        snap.docs
          .filter((d) => {
            const raw = d.data().lang;
            const docLang = isLangCode(raw) ? raw : DEFAULT_LANG;
            return docLang === lang;
          })
          .map((d) => ({ id: d.id, text: d.data().text }))
      );
    });
    return unsubscribe;
  }, [collectionName, lang]);

  const handleAdd = async () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    await addDoc(collection(db, collectionName), {
      text: trimmed,
      lang,
      createdAt: serverTimestamp(),
    });
    setNewText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isTextarea) handleAdd();
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, collectionName, id));
  };

  return (
    <div className="flex-1 min-w-0">
      <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-4">{title}</h2>
      <div className="flex gap-2 mb-5">
        {isTextarea ? (
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={`새 ${title} 입력...`}
            className="flex-1 px-4 py-3 text-[16px] bg-[#f5f5f7] rounded-xl border-none outline-none focus:ring-2 focus:ring-[#0071e3] placeholder:text-[#86868b] min-w-0 resize-none"
            rows={3}
          />
        ) : (
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`새 ${title} 입력...`}
            className="flex-1 px-4 py-3 text-[16px] bg-[#f5f5f7] rounded-xl border-none outline-none focus:ring-2 focus:ring-[#0071e3] placeholder:text-[#86868b] min-w-0"
          />
        )}
        <button
          onClick={handleAdd}
          className="px-5 py-3 bg-[#0071e3] text-white text-[14px] font-medium rounded-xl hover:bg-[#0077ED] active:scale-[0.97] transition-all whitespace-nowrap"
        >
          추가
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 p-3 bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] text-[14px]"
          >
            <span lang={lang} className="break-all text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">{item.text}</span>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-[#ff3b30] hover:text-[#ff453a] text-[12px] font-medium whitespace-nowrap mt-0.5 transition-colors"
            >
              삭제
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-[13px] text-[#86868b] py-4 text-center">
            등록된 항목이 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}

function TotalCounterManager() {
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDoc(doc(db, "counters", "sendLogs"))
      .then((snap) => {
        const v = snap.exists() ? (snap.data().count as number | undefined) : 0;
        setCount(typeof v === "number" ? v : 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const recalc = async () => {
    setBusy(true);
    setError("");
    try {
      // One-off full count to seed / repair the aggregate counter. This is the
      // only place that scans the whole sendLogs collection; run it rarely.
      const snap = await getCountFromServer(collection(db, "sendLogs"));
      const total = snap.data().count;
      await setDoc(doc(db, "counters", "sendLogs"), { count: total }, { merge: true });
      setCount(total);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-8 p-4 bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-[#1d1d1f]">전체 발송 카운터</p>
          <p className="text-[12px] text-[#86868b]">
            현재 값: {count === null ? "…" : count.toLocaleString()}
          </p>
        </div>
        <button
          onClick={recalc}
          disabled={busy}
          className="px-4 py-2 bg-[#0071e3] text-white text-[13px] font-medium rounded-xl hover:bg-[#0077ED] active:scale-[0.97] transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? "재계산 중…" : "재계산"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[#aeaeb2] leading-relaxed">
        기존 발송 총계를 한 번 시드하거나, 카운터가 실제와 어긋났을 때만 눌러주세요.
        (전체 컬렉션을 세므로 읽기 할당량을 사용합니다.)
      </p>
      {error && <p className="mt-2 text-[12px] text-[#ff3b30]">{error}</p>}
    </div>
  );
}

export default function AdminPanel() {
  const [lang, setLang] = useState<LangCode>(DEFAULT_LANG);

  return (
    <div>
      <TotalCounterManager />

      <div className="flex gap-1 bg-[#f0f0f5] rounded-xl p-1 mb-8 max-w-md">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            lang={l.code}
            className={`flex-1 py-2 rounded-[9px] text-[13px] font-medium transition-all ${
              lang === l.code
                ? "bg-[#1d1d1f] text-white"
                : "text-[#86868b] active:scale-[0.97]"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        <ItemManager title="제목" collectionName="subjects" lang={lang} />
        <ItemManager title="내용" collectionName="bodies" isTextarea lang={lang} />
      </div>
    </div>
  );
}
