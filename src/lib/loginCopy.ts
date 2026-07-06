import type { LangCode } from "@/lib/langs";

export interface LoginCopy {
  login: string;         // Google 로그인 버튼
  fallback: string;      // 로그인 불가 시 클릭 버튼
  fallbackLoading: string;
  browserNotice: string; // 브라우저 안내
  disclaimer: string;    // 하단 안내문
  noItems: string;       // 등록된 문구 없음 alert
  error: string;         // 오류 alert
}

export const LOGIN_COPY: Record<LangCode, LoginCopy> = {
  ko: {
    login: "Google로 로그인",
    fallback: "로그인 불가 시 클릭",
    fallbackLoading: "불러오는 중...",
    browserNotice: "반드시 Safari, Chrome 등으로 접속해주세요 (트위터 X)",
    disclaimer:
      "본 서비스는 개인 의견 전달을 위한 메일 간편 발송 서비스입니다.\n로그인 시 이에 동의하며, 악의적으로 사용하지 않을 것을 약속하는 것으로 간주됩니다.",
    noItems: "등록된 제목/내용이 없습니다.",
    error: "오류가 발생했습니다.",
  },
  zh: {
    login: "使用 Google 登录",
    fallback: "无法登录时点击",
    fallbackLoading: "加载中...",
    browserNotice: "请务必使用 Safari、Chrome 等浏览器访问（勿用 Twitter/X）",
    disclaimer:
      "本服务是用于传达个人意见的邮件快捷发送服务。登录即表示您同意上述内容，并承诺不会恶意使用。",
    noItems: "没有已登记的标题或内容。",
    error: "发生错误。",
  },
  en: {
    login: "Sign in with Google",
    fallback: "Can't sign in? Tap here",
    fallbackLoading: "Loading...",
    browserNotice: "Please open in Safari, Chrome, etc. (not Twitter/X)",
    disclaimer:
      "This service simply sends emails to convey personal opinions. By signing in, you agree to this and promise not to use it maliciously.",
    noItems: "No subjects or contents are registered.",
    error: "An error occurred.",
  },
  id: {
    login: "Masuk dengan Google",
    fallback: "Tidak bisa masuk? Klik di sini",
    fallbackLoading: "Memuat...",
    browserNotice: "Harap buka di Safari, Chrome, dll. (bukan Twitter/X)",
    disclaimer:
      "Layanan ini hanya mengirim email untuk menyampaikan pendapat pribadi. Dengan masuk, Anda menyetujui hal ini dan berjanji tidak menyalahgunakannya.",
    noItems: "Tidak ada judul atau isi yang terdaftar.",
    error: "Terjadi kesalahan.",
  },
};
