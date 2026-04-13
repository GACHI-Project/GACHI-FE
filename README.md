# 가치 GACHI — Frontend

> 다문화 가정 학부모를 위한 초등학교 가정통신문 AI 분석 앱
> React Native (Expo) 기반 Android 앱

---

## 📌 프로젝트 소개

**가치(GACHI)** 는 가정통신문 사진 한 장을 찍으면 번역·행동 요약·체크리스트·일정 등록까지 한 번에 처리해주는 다문화 가정 맞춤형 AI 서비스입니다.
단순 번역을 넘어 "지금 내가 해야 할 일"을 바로 알 수 있도록 설계된 **Actionable AI** 앱입니다.

---

## ✨ 핵심 기능

| 기능               | 설명                                       |
| ------------------ | ------------------------------------------ |
| 📷 가정통신문 스캔 | OCR로 문서를 촬영하면 텍스트 자동 추출     |
| 🤖 AI 분석         | 행동 항목 자동 추출 및 문화 맥락 해설 제공 |
| ✅ 체크리스트      | "지금 해야 할 일"을 리스트로 정리          |
| 📅 캘린더 연동     | 마감일 자동 추출 후 일정 등록              |
| 💬 챗봇 (까치)     | 문서 기반 질문 및 학교 문화 안내           |
| 🌐 다국어 지원     | 한국어 · 영어 · 베트남어 · 중국어          |

---

## 🛠 기술 스택

| 분류        | 기술                                      |
| ----------- | ----------------------------------------- |
| Framework   | React Native (Expo ~55)                   |
| Language    | TypeScript                                |
| Navigation  | Expo Router                               |
| State       | Zustand                                   |
| Form        | React Hook Form + Zod                     |
| HTTP        | Axios                                     |
| i18n        | i18next, react-i18next                    |
| UI          | React Native Reanimated, React Native SVG |
| Lint/Format | ESLint (Airbnb), Prettier                 |

---

## 📁 프로젝트 구조

```
gachi-app/
├── app/
│   ├── (auth)/                   # 비로그인 그룹
│   │   ├── index.tsx             # 스플래시
│   │   ├── login.tsx
│   │   └── register/
│   │       ├── basic.tsx
│   │       ├── child.tsx
│   │       ├── language.tsx
│   │       └── notification.tsx
│   ├── (tabs)/                   # 로그인 후 하단 탭
│   │   ├── index.tsx             # 홈
│   │   ├── documents/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── scan/
│   │   │   └── index.tsx
│   │   ├── calendar.tsx
│   │   └── mypage/
│   │       ├── index.tsx
│   │       ├── language.tsx
│   │       ├── notification.tsx
│   │       └── child/
│   │           ├── index.tsx
│   │           ├── add.tsx
│   │           └── [id].tsx
│   ├── scan/                     # 스캔 전체화면 플로우
│   │   ├── select.tsx
│   │   ├── camera.tsx
│   │   ├── loading.tsx
│   │   └── result/
│   │       ├── checklist.tsx
│   │       ├── summary.tsx
│   │       └── fulltext.tsx
│   └── chatbot.tsx
├── assets/
├── .github/
├── .eslintrc.js
├── .prettierrc
└── tsconfig.json
```

---

## ⚙️ 시작하기

### 사전 요구사항

- Node.js 18 이상
- Expo CLI (`npm install -g expo-cli`)
- 실기기: [Expo Go](https://expo.dev/client) 앱 설치

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/[org]/gachi-app.git
cd gachi-app

# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 플랫폼별 실행
npm run android
npm run ios
```

### 코드 품질 검사

```bash
npm run lint
npm run lint:fix
npm run format
```

---

## 🌿 브랜치 전략

| 브랜치            | 용도                    |
| ----------------- | ----------------------- |
| `main`            | 프로덕션 배포           |
| `develop`         | 개발 통합               |
| `feat/[기능명]`   | 새로운 기능 개발        |
| `fix/[내용]`      | 버그 수정               |
| `chore/[내용]`    | 패키지 추가 / 기타 작업 |
| `refactor/[내용]` | 코드 리팩토링           |
| `style/[내용]`    | UI / 스타일 수정        |
| `docs/[내용]`     | 문서 수정               |
| `hotfix/[내용]`   | 긴급 버그 수정          |

예시: `feat/login-ui`

---

## ✍️ 커밋 컨벤션

형식: `깃모지 [타입]: [요약]`

| 깃모지 | 타입       | 설명                    |
| ------ | ---------- | ----------------------- |
| ✨     | `feat`     | 새로운 기능 추가        |
| 🐛     | `fix`      | 버그 수정               |
| 📦     | `chore`    | 패키지 추가 / 기타 작업 |
| ♻️     | `refactor` | 코드 리팩토링           |
| 🎨     | `style`    | UI / 스타일 수정        |
| 📝     | `docs`     | 문서 수정               |
| 🚑     | `hotfix`   | 긴급 버그 수정          |
| 💄     | `design`   | 디자인 개선             |
| 🔥     | `remove`   | 코드 삭제               |
| 🚧     | `wip`      | 작업 진행 중            |
| 🎉     | `init`     | 프로젝트 초기화         |

예시: `✨ feat: 로그인 화면 구현`

---

## 🔀 PR 규칙

- 제목 형식: `깃모지 [타입] [요약] (#이슈번호)`
- 예시: `✨ [Feat] 로그인 화면 구현 (#10)`
- 병합 방식: Squash & Merge
- 코드 리뷰 필수

---

## 👥 팀원

| 이름   | 역할       | GitHub                           |
| ------ | ---------- | -------------------------------- |
| 이채영 | 프론트엔드 | [@](https://github.com/chae1125) |
| hyeeon | 프론트엔드 | [@](https://github.com/hyeeon)   |
