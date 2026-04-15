# /fax 페이지 설계 문서

작성일: 2026-04-15
상태: 승인 대기

## 목적

기존 메일 발송 시스템(/)과 동일한 UX로, 모바일에서 "팩스 앱 공유"를 이용해 특정 이미지를 특정 수신 팩스번호로 간편하게 보낼 수 있는 페이지를 구축한다.

핵심 이점: **사용자마다 본인 휴대폰 번호로 발송**되므로 여러 사용자가 쓰면 자연스럽게 발신번호 rotation 효과가 발생한다. 합법적이며 비용 0원.

## 핵심 결정

- **접근 경로**: `/fax`
- **기본 수신 번호**: `02-371-8496`
- **기본 이미지**: `https://pbs.twimg.com/media/HF4KLdJawAAun3C?format=jpg&name=4096x4096`
- **인증**: 없음 (공개)
- **플랫폼**: 모바일 우선, 데스크톱에서는 QR만 표시
- **통계 집계 시점**: 공유 시트 호출 성공 시(전자)
- **관리자**: 수신번호와 이미지 URL 변경 가능

## 아키텍처

### 페이지 구조

```
/fax                  → 메인 팩스 발송 페이지 (모바일/PC 분기)
/admin                → 기존 관리자 페이지에 팩스 설정 탭 추가
```

### 컴포넌트

```
src/app/fax/page.tsx                     모바일/PC 분기 진입점
src/components/fax/SmartSendButton.tsx   Web Share API 기반 자동 버튼
src/components/fax/ManualSendButton.tsx  다운로드 + 안내 기반 수동 버튼
src/components/fax/FaxStats.tsx          발송 카운트 통계
src/components/fax/DesktopQR.tsx         PC에서만 표시되는 QR + 안내
src/components/fax/FaxPreview.tsx        이미지 + 수신번호 프리뷰 카드
src/components/fax/PreInstallNotice.tsx  "모바일팩스 앱 설치해주세요" 안내 + 스토어 링크
src/app/api/fax-image/route.ts           트위터 이미지 CORS 우회 프록시
src/lib/fax-config.ts                    Firestore config 읽기/쓰기
```

### Firestore 구조

```
faxConfig/default (doc)
  - imageUrl: string
  - recipientNumber: string
  - updatedAt: Timestamp

faxLogs (collection)
  - sharedAt: Timestamp
  - userAgent: string (선택)
```

관리자는 기존 `admin` 페이지(관리자 인증은 기존 로직 재활용)에서 `faxConfig/default` 문서를 편집.

## 동작 흐름

### 모바일 플로우

```
1. 사용자가 /fax 접속
2. useEffect로 디바이스 감지 → 모바일이면 팩스 UI, PC면 DesktopQR 렌더
3. 페이지 mount 시 Firestore에서 config 읽어 이미지 프리뷰 + 수신번호 표시
4. FaxStats가 sendLogs 대신 faxLogs 컬렉션 카운트 표시 (기존 Stats 스타일 재활용)
5. 상단: 모바일팩스 앱 사전 설치 안내 배너 + 스토어 링크 (iOS/Android 분기)
6. 발송 버튼 2개 병렬 제공:

   [A. 스마트 발송 (자동)]
   a. `/api/fax-image`에서 이미지 Blob fetch (CORS 우회)
   b. navigator.clipboard.writeText(recipientNumber) → 토스트 "수신번호 복사됨: 02-371-8496"
   c. navigator.share({ files: [File] }) 호출
   d. OS 공유 시트가 뜨면 즉시 faxLogs에 addDoc
   e. 사용자가 공유 시트에서 모바일팩스 앱 선택 → 앱에서 수동 발송
   f. Web Share API 미지원 시 자동으로 수동 발송 플로우로 전환됨

   [B. 수동 발송]
   a. 이미지 다운로드 트리거 (fetch → Blob → a.click)
   b. 수신번호 클립보드 복사 + 토스트
   c. 안내 모달 표시:
      "1. 모바일팩스 앱 열기
       2. 방금 받은 이미지 첨부
       3. 수신번호 붙여넣기 (02-371-8496)
       4. 발송"
   d. 모달 내 "발송 완료했어요" 버튼 → 탭하면 faxLogs 기록
```

### 실패/Fallback

| 상황 | 대응 |
|---|---|
| navigator.share 미지원 | 이미지 다운로드 링크 제공 + 수신번호 복사 + 수동 안내 |
| navigator.share files 미지원 | 동일하게 다운로드 fallback |
| 이미지 fetch 실패 | 원본 URL로 바로 다운로드 시도 |
| 클립보드 복사 실패 | 수신번호를 눌러 복사할 수 있는 큰 터치 영역 제공 |
| 사용자가 공유 시트에서 취소 | share() Promise reject됨 → 로그는 기록되지 않음 (아니면 AbortError로 캐치) |

### PC 플로우

```
1. /fax 접속 → 디바이스 감지 → DesktopQR 렌더
2. 화면 중앙에 현재 URL의 QR 코드 + "휴대폰으로 스캔하여 접속해주세요" 안내
3. 수신번호와 프리뷰 이미지는 표시 (참고용)
4. 안내 문구: "팩스 발송은 모바일에서만 가능해요"
```

### 디바이스 감지

- `navigator.userAgent` 검사 + 터치 지원 여부
- SSR 이슈 방지를 위해 클라이언트에서만 판정, mount 전에는 로딩 스피너

## UI/UX

### 모바일 레이아웃

```
┌─────────────────────┐
│   발송 통계         │  ← FaxStats (fixed top, 기존과 동일 스타일)
├─────────────────────┤
│                     │
│   to wakeone        │  ← 타이틀 (FAX 뱃지)
│                     │
│ ⓘ 모바일팩스 앱을   │  ← PreInstallNotice
│   먼저 설치해주세요 │     (스토어 링크)
│                     │
│  ┌───────────────┐  │
│  │  이미지 프리뷰 │  │  ← FaxPreview (둥근 모서리 카드)
│  │              │  │
│  └───────────────┘  │
│                     │
│   수신 02-371-8496  │  ← 큰 글씨, 탭하면 복사
│                     │
│   (안내 문구)       │
│                     │
├─────────────────────┤
│ [스마트 발송] [수동] │  ← 두 버튼 나란히 (fixed bottom)
└─────────────────────┘
```

- **스마트 발송 버튼**: 주(primary) 스타일, 넓게(flex-grow). 검은 배경.
- **수동 발송 버튼**: 보조(secondary) 스타일. 회색 톤. 가로 좁게.
- 버튼 아래 매우 작은 글씨로 "앱이 목록에 없으면 수동 발송을 이용해주세요"

### 디자인 톤

- 기존 `/` 페이지와 동일: #fbfbfd 배경, Apple SF 스타일 타이포그래피
- 메인 CTA: `bg-[#1d1d1f]` 배경의 둥근 둥근 모서리 버튼
- 토스트: 기존 메일 완료 토스트 재활용

### 필수 안내 문구 (유저 요청)

```
"본 서비스는 개인 의견 전달을 위한 팩스 간편 발송 서비스입니다.
사용자의 본인 명의 휴대폰 번호로 발송되며,
악의적으로 사용하지 않을 것을 약속하는 것으로 간주됩니다."
```

하단 또는 프리뷰 아래 표시. 작은 글씨(11~12px), 회색톤.

## 관리자 기능

기존 `/admin`에 "팩스 설정" 섹션 추가:

- **이미지 URL 입력** (기본값: 트위터 이미지)
- **수신번호 입력** (기본값: 02-371-8496)
- **미리보기 썸네일**
- 저장 시 `faxConfig/default` 문서 업데이트

기존 관리자 인증 로직(`AdminPanel.tsx` 또는 유사) 그대로 재활용.

## 테스트

### 수동 검증 항목

1. 모바일(iOS Safari) 접속 → 공유 시트 → 모바일팩스 앱 확인
2. 모바일(Android Chrome) 접속 → 공유 시트 → 이미지 첨부 확인
3. PC Chrome 접속 → QR 표시 확인
4. 클립보드 복사 토스트 동작
5. 공유 취소 시 로그 미기록 확인
6. 관리자에서 이미지/번호 변경 → /fax 반영 확인
7. 통계 카운트 증가 확인

### 엣지 케이스

- 모바일팩스 앱 미설치 사용자: 공유 시트에 앱이 없을 때 안내
- iOS Safari 개인정보보호 모드에서 Firestore 쓰기 실패
- 네트워크 느릴 때 이미지 Blob 변환 지연

## 보안 / 어뷰즈 방지

- 로그인 없음이므로 무한 발송 방지 불가. 단, 실제 발송은 사용자가 모바일팩스 앱에서 수동으로 해야 하므로 자동화 봇 발송 불가
- faxLogs에 IP나 식별자 수집은 하지 않음 (익명 통계)
- `faxConfig` 문서는 관리자만 쓰기 가능하도록 Firestore 보안 규칙 업데이트 필요

## 범위 밖 (YAGNI)

- 발송 이력 개인별 조회
- 발송 예약
- 여러 이미지 선택
- 여러 수신번호 지원
- 팩스 발송 성공/실패 결과 수신 (기술적으로 불가)

## 미확정 / 위험 요소

1. **모바일팩스 앱이 iOS에서 `public.image` share extension을 제대로 등록하고 있는지** → 실기기 테스트 필요. 실패 시 수동 발송 플로우로 커버됨 (리스크 저감됨)
2. **Web Share API Level 2 (files) 지원** → iOS 15+, Android Chrome 76+ 필요. 미지원 시 자동으로 수동 발송으로 전환됨 (리스크 저감됨)
3. **트위터 이미지 URL이 수명이 긴지** → 관리자에서 언제든 바꿀 수 있으므로 수용 가능한 위험

## 설치 안내 문구 / 스토어 링크

- Android 접속 시: `https://play.google.com/store/apps/details?id=com.dho.mobilefax`
- iOS 접속 시: `https://apps.apple.com/kr/app/%EB%AA%A8%EB%B0%94%EC%9D%BC%ED%8C%A9%EC%8A%A4-i/id1487591338`
- UserAgent로 분기. PC(데스크톱)에서는 두 링크 모두 표시.
