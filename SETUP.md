# mailforgw 설정 가이드

## 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성
3. **APIs & Services → Library** → "Gmail API" 검색 → **활성화**
4. **APIs & Services → OAuth consent screen**
   - User Type: External
   - 앱 이름, 사용자 지원 이메일 입력
   - 스코프 추가: `https://www.googleapis.com/auth/gmail.send`
   - 테스트 사용자 추가 (본인 Gmail)
5. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://your-app.vercel.app` (배포 후 추가)
   - Authorized redirect URIs:
     - `https://your-project.firebaseapp.com/__/auth/handler`

## 2. Firebase Console 설정

1. [Firebase Console](https://console.firebase.google.com) 접속
2. **프로젝트 추가** → 위에서 만든 Google Cloud 프로젝트 선택
3. **Authentication → Sign-in method → Google** 활성화
4. **Firestore Database → 데이터베이스 만들기** → 테스트 모드로 시작
5. **프로젝트 설정 → 일반 → 내 앱 → 웹 앱 추가** → Firebase config 값 복사

## 3. 환경변수 설정

`.env.local.example`을 `.env.local`로 복사하고 Firebase config 값 입력:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 4. 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속

## 5. Vercel 배포

1. [Vercel](https://vercel.com)에서 GitHub 레포 연결
2. **Settings → Environment Variables**에 `.env.local` 값들 입력
3. Deploy

## 6. 배포 후 추가 설정

- Google Cloud Console → OAuth 2.0 Client ID → Authorized JavaScript origins에 Vercel 도메인 추가
- Firebase Console → Authentication → 승인된 도메인에 Vercel 도메인 추가
- OAuth 동의 화면 → "프로덕션으로 게시" (테스트 사용자 외에도 로그인 가능하게)

## 참고

- Gmail API 무료 한도: 계정당 일 500건
- Firestore 무료 한도: 1GB 저장, 일 5만 읽기
- 관리자 비밀번호: `/admin` 페이지에서 사용
