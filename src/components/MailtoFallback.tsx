"use client";

import { useState } from "react";
import { fetchItems } from "@/lib/items";
import { DEFAULT_LANG, type LangCode } from "@/lib/langs";
import { LOGIN_COPY } from "@/lib/loginCopy";

const RECIPIENTS = "wakeone@wake-one.com,protect@wake-one.com,mnet.help@cj.net,cjauditor@cj.net,webmaster@cj.net";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function MailtoFallback({ lang = DEFAULT_LANG }: { lang?: LangCode }) {
  const [loading, setLoading] = useState(false);
  const copy = LOGIN_COPY[lang];

  const handleClick = async () => {
    setLoading(true);
    try {
      const { subjects, bodies } = (await fetchItems())[lang];

      if (subjects.length === 0 || bodies.length === 0) {
        alert(copy.noItems);
        setLoading(false);
        return;
      }

      const subject = pickRandom(subjects);
      const body = pickRandom(bodies);
      const mailto = `mailto:${RECIPIENTS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    } catch {
      alert(copy.error);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      lang={lang}
      className="w-full max-w-[280px] px-6 py-3 bg-[#f0f0f5] text-[#86868b] text-[15px] font-medium rounded-xl hover:bg-[#e8e8ed] active:scale-[0.98] transition-all disabled:opacity-50"
    >
      {loading ? copy.fallbackLoading : copy.fallback}
    </button>
  );
}
