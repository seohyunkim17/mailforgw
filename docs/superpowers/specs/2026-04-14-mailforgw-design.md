# mailforgw - 랜덤 메일 발송기

## 개요

구글 로그인 후 버튼 하나로 사전 등록된 제목/내용을 랜덤 조합하여 고정 수신자 2명에게 업무 메일을 발송하는 웹앱.

## 요구사항

- 구글 로그인 (여러 사용자 가능)
- 관리자 페이지에서 메일 제목/내용 다수 등록 (비밀번호: Forgw03!)
- 버튼 클릭 시 제목 N개 중 1개 + 내용 N개 중 1개 랜덤 조합
- Gmail API로 직접 발송 (보낸 메일함에 기록 남음)
- 고정 수신자 2명: wakeione@wake-one.com, protect@wake-one.com (동시 발송)
- 과금 없음 (모두 무료 플랜)
- 여러 사용자가 각자 본인 Gmail로 발송, 합산 일 2,000건 이상 가능해야 함

## 기술 스택

| 항목 | 선택 | 비용 |
|------|------|------|
| 프레임워크 | Next.js 14 (App Router) | 무료 |
| 인증 | Firebase Auth (Google Provider) | 무료 |
| DB | Firestore | 무료 (Spark) |
| 메일 발송 | Gmail API (클라이언트 직접 호출) | 무료 (일 250건) |
| 배포 | Vercel | 무료 (Hobby) |
| 스타일링 | Tailwind CSS | 무료 |

## 아키텍처

### 프로젝트 구조

```
mailforgw/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인: 로그인 + 발송 버튼
│   │   ├── admin/page.tsx        # 관리자: 제목/내용 CRUD
│   │   ├── layout.tsx            # 레이아웃
│   │   └── globals.css
│   ├── lib/
│   │   ├── firebase.ts           # Firebase 초기화 (Auth + Firestore)
│   │   └── gmail.ts              # Gmail API 발송 함수
│   └── components/
│       ├── LoginButton.tsx        # 구글 로그인 버튼
│       ├── SendMailButton.tsx     # 랜덤 메일 발송 버튼
│       └── AdminPanel.tsx         # 관리자 제목/내용 관리 UI
├── public/
├── .env.local                     # Firebase config, 수신자 이메일
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Firestore 데이터 구조

```
subjects/
  ├── {auto-id}: { text: "제목1", createdAt: timestamp }
  ├── {auto-id}: { text: "제목2", createdAt: timestamp }
  └── ...

bodies/
  ├── {auto-id}: { text: "내용1", createdAt: timestamp }
  ├── {auto-id}: { text: "내용2", createdAt: timestamp }
  └── ...
```

### 사용자 흐름

#### 일반 사용자 (메일 발송)
1. 사이트 접속
2. "구글로 로그인" 버튼 클릭 → Firebase Auth Google 팝업
3. OAuth 스코프에 `https://www.googleapis.com/auth/gmail.send` 포함
4. 로그인 완료 → "메일 보내기" 버튼 표시
5. 버튼 클릭 →
   - Firestore에서 subjects 전체 조회 → 랜덤 1개 선택
   - Firestore에서 bodies 전체 조회 → 랜덤 1개 선택
   - 선택된 제목+내용으로 Gmail API 호출 (2명에게 동시 발송)
6. 성공/실패 토스트 알림

#### 관리자 (제목/내용 관리)
1. `/admin` 접속
2. 비밀번호 입력 (Forgw03!) → localStorage에 세션 저장
3. 제목 관리: 텍스트 입력 + 추가 버튼, 기존 목록 표시 + 삭제 버튼
4. 내용 관리: 텍스트에어리어 입력 + 추가 버튼, 기존 목록 표시 + 삭제 버튼

### 메일 발송 (Gmail API)

클라이언트에서 직접 Gmail API를 호출합니다:
- Firebase Auth로 Google 로그인 시 `gmail.send` 스코프 요청
- 로그인 후 받은 OAuth access token으로 `https://gmail.googleapis.com/gmail/v1/users/me/messages/send` 호출
- RFC 2822 형식의 메일을 Base64 인코딩하여 전송
- 수신자: wakeione@wake-one.com, protect@wake-one.com (To 필드에 둘 다 포함)

### 보안

- 관리자 페이지: 단순 비밀번호 (클라이언트 사이드, 보안 중요도 낮음)
- Firestore 규칙: 읽기는 인증된 사용자, 쓰기는 제한 없음 (관리자 비밀번호로 앱 레벨 보호)
- Gmail 토큰: 클라이언트에서만 사용, 서버에 저장하지 않음

## Google Cloud 설정 (사용자 수동 설정 필요)

1. Google Cloud Console에서 프로젝트 생성
2. Gmail API 활성화
3. OAuth 동의 화면 설정 (외부 사용자)
4. OAuth 2.0 클라이언트 ID 발급 (웹 애플리케이션)
5. Firebase 프로젝트 생성 및 웹 앱 추가
6. Firestore 데이터베이스 생성
7. `.env.local`에 Firebase 설정값 입력

## UI 디자인

- 미니멀, 모바일 우선
- 메인 페이지: 중앙에 큰 "메일 보내기" 버튼 + 로그인 상태 표시
- 관리자 페이지: 좌우 2열 (제목 관리 | 내용 관리), 모바일은 1열

## 제약사항

- Gmail API 한도: 무료 Gmail 계정당 일 500건, Workspace 계정당 일 2,000건. 한도는 계정별로 적용되므로 여러 사용자가 각자 발송하면 합산 한도는 사용자 수 x 500건.
- OAuth 동의 화면이 "테스트" 상태면 등록된 테스트 사용자만 로그인 가능 (프로덕션 게시 필요)
- Firebase Spark 플랜: Firestore 1GB, 일 5만 읽기
