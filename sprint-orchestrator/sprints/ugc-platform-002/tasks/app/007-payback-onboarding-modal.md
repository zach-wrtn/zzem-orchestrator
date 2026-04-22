# app-007 · 페이백 안내 모달 (AC 4.4)

- **Group**: 003
- **Owner**: fe-engineer
- **Depends on**: app-004 (게시 토글) — 최초 공개 트리거 지점 공유

## Target

`app/apps/MemeApp/src/presentation/swipe-feed/components/` (모달 트리거)
`app/apps/MemeApp/src/presentation/credit/components/` (또는 공용 컴포넌트)
`app/apps/MemeApp/src/shared/lib/userStorage.ts` (이미 존재 예상) — 1회성 게이트

## Context

AC 4.4: 유저가 **콘텐츠를 최초로 생성하고 공개** 했을 때 1% 페이백 안내 모달 노출.
- 문구: `"쨈 런칭 기념 프로모션 크레딧 1% 페이백"` (PRD 직역).
- 확인 후 피드 노출.
- **1회성** — 최초 공개 시에만.

트리거 타이밍 candidates:
1. 생성 완료 직후 (콘텐츠가 자동 공개되는 순간 — AC 1.1) — 기본 공개 정책.
2. 첫 콘텐츠가 이미 공개 상태로 생성된 후 MY 탭 진입 시.
3. 게시 토글 OFF → ON 시 (첫 번째 공개).

PRD 문구는 "최초 공개 시" — 생성 후 공개 상태로 진입한 **첫 시점** 이 기준. Prototype 에서 정확한 타이밍 확정.

## Objective

LocalStorage gate 기반 1회성 모달 구현. 최초 공개 트리거 시점에 노출.

## Specification

### Trigger 지점
- **Primary**: 생성 완료 이벤트 (자동 공개 성공) 핸들러.
  - `useGenerateMemeUseCase()` onSuccess 또는 navigation event.
  - 결과물이 isPublished=true 이고 유저의 **첫 공개** 인 경우 모달.
- **Secondary (fallback)**: 게시 토글 OFF→ON 시에도, 이전에 공개 이력 없으면 모달 (game-of-chicken — 거의 안 쓰이지만 Cover).

### 1회성 판정
- `userStorage` (AsyncStorage wrapper) 에 `PAYBACK_INTRO_SHOWN: boolean` 또는 timestamp 키.
- 노출 후 flag set. 이후 절대 노출 안 됨.
- 비로그인 → 모달 스킵 (공개 기능 자체가 인증 필요).

### Modal Content
- Component: `PaybackIntroModal` (신규).
- Title: `"쨈 런칭 기념 프로모션 크레딧 1% 페이백"`
- Body: PRD 직역 + 간략 설명 (Prototype 에서 확정):
  `"내 콘텐츠를 다른 유저가 재생성하면, 소비한 크레딧의 1%가 나에게 적립돼요."`
- Illustration: 기존 크레딧 아이콘 + 하트 / Prototype 확정.
- CTA: `"확인했어요"` 단일 버튼.
- 탭 시 모달 닫힘 + flag set.

### Implementation
- `BottomConfirmSheet` 또는 full-screen `Modal` (native). Prototype 에서 최종 결정.
- 공통 Provider / Hook: `usePaybackIntro()`:
  - `show(): void` — modal open + flag 체크.
  - `markShown(): void` — flag set.
  - `hasBeenShown(): boolean` — getter.

### Regression Guard
- 기존 모달/시트 (최초 진입 온보딩 등) 와 충돌 없음 — 트리거 타이밍 분리.

### Out of Scope
- 페이백 실제 로직 (be-003).
- 추후 페이백 재공지 캠페인.

## Acceptance Criteria

- [ ] 최초 공개 (자동 공개 포함) 시 `PaybackIntroModal` 노출.
- [ ] 확인 탭 → 닫힘 + userStorage flag set.
- [ ] 2회차 공개 시 모달 미노출.
- [ ] 비로그인 상태에서 트리거 안 됨.
- [ ] 기존 모달 flow (온보딩, 크레딧 부족 등) 와 중첩 없음 (순서 보정).
- [ ] e2e: `payback-intro-modal.yaml` — 최초 트리거 후 assertVisible + 확인 탭 후 dismiss. 2회차 진입은 unit test 또는 Evaluator 추적.
- [ ] `yarn typescript | grep -v '@wrtn/'` 신규 에러 0.

## Screens / Components

- **PaybackIntroModal** (BottomSheet or full-screen Modal, 최초 공개 1회성):
  - Header: illustration (크레딧 + 하트 조합 icon) — Prototype 에서 확정
  - Title: "쨈 런칭 기념 프로모션 크레딧 1% 페이백"
  - Body: "내 콘텐츠를 다른 유저가 재생성하면, 소비한 크레딧의 1%가 나에게 적립돼요."
  - Single CTA: "확인했어요"
  - Closeable by CTA tap only (dismiss by backdrop tap 금지 — 1회성이라 정확한 CTA 탭 유도)
- States: default(open) / dismissing(fade-out)

## Implementation Hints

- `userStorage` 키 prefix: `meme:` 또는 기존 convention.
- AsyncStorage race 주의 — read/write 비동기. Provider 초기 로드 시 flag 를 미리 preload.
- `BottomConfirmSheet` 재사용 시 커스텀 Title + Description + single action 모드.
- Prototype 단계에서 Illustration / 정확한 문구 확정.
