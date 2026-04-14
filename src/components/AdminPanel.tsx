"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Item {
  id: string;
  text: string;
}

function ItemManager({
  title,
  collectionName,
  isTextarea,
}: {
  title: string;
  collectionName: string;
  isTextarea?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, text: d.data().text })));
    });
    return unsubscribe;
  }, [collectionName]);

  const handleAdd = async () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    await addDoc(collection(db, collectionName), {
      text: trimmed,
      createdAt: serverTimestamp(),
    });
    setNewText("");
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, collectionName, id));
  };

  return (
    <div className="flex-1 min-w-0">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="flex gap-2 mb-4">
        {isTextarea ? (
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={`새 ${title} 입력...`}
            className="flex-1 border rounded px-3 py-2 text-sm min-w-0"
            rows={3}
          />
        ) : (
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={`새 ${title} 입력...`}
            className="flex-1 border rounded px-3 py-2 text-sm min-w-0"
          />
        )}
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
        >
          추가
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded text-sm"
          >
            <span className="break-all">{item.text}</span>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-red-500 hover:text-red-700 text-xs whitespace-nowrap"
            >
              삭제
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-gray-400 text-sm">등록된 항목이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <ItemManager title="제목" collectionName="subjects" />
      <ItemManager title="내용" collectionName="bodies" isTextarea />
    </div>
  );
}
