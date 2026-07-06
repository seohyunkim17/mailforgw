"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LANGS, DEFAULT_LANG, type LangCode } from "@/lib/langs";

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
    const q = query(collection(db, collectionName), where("lang", "==", lang));
    const unsubscribe = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, text: d.data().text })));
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
            <span className="break-all text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">{item.text}</span>
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

export default function AdminPanel() {
  const [lang, setLang] = useState<LangCode>(DEFAULT_LANG);

  return (
    <div>
      <div className="flex gap-1 bg-[#f0f0f5] rounded-xl p-1 mb-8 max-w-md">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
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
