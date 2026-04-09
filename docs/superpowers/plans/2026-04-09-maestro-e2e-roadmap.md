# Maestro E2E Testing 전체 로드맵

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MemeApp 전체 유저 플로우에 대한 Maestro E2E 테스트를 완성하고, CI에 통합하여 스프린트 회귀 방지 체계를 확립한다.

**Base Branch:** `chore/e2e-maestro-setup` (app-core-packages 서브모듈)

**작업 방식:** 각 Phase별로 `chore/e2e-maestro-setup`에서 feature 브랜치를 생성하여 작업 후 머지.

---

## 진행 상태 요약

| Phase | 상태 | 산출물 |
|-------|------|--------|
| **Phase 1: 인프라 셋업** | ✅ 완료 | Maestro config, smoke-test, README, package.json scripts |
| **Phase 2: 기본 testID + 플로우** | ✅ 완료 | Home/Settings testID 계장, 5개 플로우 YAML, Bitrise CI |
| **Phase 3: 인증 자동화** | ✅ 완료 | Deeplink 인증 바이패스, login.yaml 헬퍼, settings-authenticated 플로우 |
| **Phase 4: 밈 생성 플로우** | ✅ 완료 | FilterPreview/MemeCollection/MemeViewer testID + 3개 플로우 |
| **Phase 5: SwipeFeed + Credit 플로우** | ✅ 완료 | SwipeFeed/Credit testID + swipe-feed/credit-history 플로우 |
| **Phase 6: Android + CI 안정화** | ✅ 완료 | e2e_check_android, pr_check E2E 통합, e2e_nightly + Slack 알림 |

---

## Phase 3: 인증 자동화

> **브랜치:** `chore/e2e-maestro-setup` → `feat/e2e-auth-bypass`

인증된 유저 플로우를 E2E에서 테스트하려면 로그인 바이패스가 필요하다. MemeApp은 SSO WebView 기반 로그인을 사용하므로, 테스트 전용 바이패스 메커니즘을 구현한다.

### Task 6: 인증 바이패스 전략 조사 및 결정

**Files:**
- Read: `apps/MemeApp/src/shared/lib/auth/` — 현재 인증 흐름 파악
- Read: `apps/MemeApp/src/shared/store/` — MMKV 토큰 저장 구조 파악
- Read: `apps/MemeApp/src/domain/user/` — useAuthGuardUseCase, isGuest 로직

- [ ] **Step 1: 현재 인증 아키텍처 분석**

조사 항목:
- MMKV에 저장되는 토큰 키/값 구조
- `useAuthGuardUseCase`의 isGuest/isAuthenticated 판단 로직
- SSO 로그인 완료 후 토큰 저장 흐름

- [ ] **Step 2: 3가지 접근법 PoC**

| 접근법 | 방법 | 장점 | 단점 |
|--------|------|------|------|
| A. MMKV 토큰 주입 | Maestro `runScript`로 앱 시작 전 MMKV에 테스트 토큰 직접 세팅 | 가장 빠르고 안정적 | 토큰 만료 관리, MMKV 접근 방법 |
| B. Deeplink 로그인 | 테스트 전용 deeplink scheme으로 인증 상태 설정 | 깔끔한 분리 | 앱 코드 수정 필요 |
| C. SSO WebView 자동화 | Maestro Studio로 WebView 요소 캡처 후 자동화 | 코드 수정 없음 | 느리고 불안정, SSO 변경에 취약 |

- [ ] **Step 3: 선택한 전략 구현**

가장 유력한 후보: **B. Deeplink 로그인 바이패스** (DEV 빌드 전용)

```typescript
// apps/MemeApp/src/shared/lib/auth/e2e-auth-handler.ts
// DEV 빌드에서만 활성화되는 E2E 로그인 바이패스
// deeplink: zzem://e2e-login?token=TEST_TOKEN
```

- [ ] **Step 4: 로그인 헬퍼 플로우 작성**

`apps/MemeApp/e2e/helpers/login.yaml` — 인증 바이패스를 사용하는 서브플로우

- [ ] **Step 5: 검증 + 커밋**

인증된 상태에서 Settings 화면의 "계정", "비밀번호", "로그아웃" 메뉴가 표시되는지 확인.

---

### Task 7: 인증 필요 설정 플로우

**Files:**
- Create: `apps/MemeApp/e2e/flows/settings-authenticated.yaml`
- Modify: `apps/MemeApp/e2e/README.md`

- [ ] **Step 1: 인증 상태 설정 플로우 작성**

```yaml
# 인증된 유저의 설정 화면 — 계정/비밀번호/로그아웃 메뉴 확인
- runFlow: ../helpers/login.yaml

- tapOn:
    id: "home.header.settings-button"
- assertVisible:
    id: "settings.account"
- assertVisible:
    id: "settings.password"
- assertVisible:
    id: "settings.logout-button"
```

- [ ] **Step 2: README 업데이트 + 커밋**

---

## Phase 4: 밈 생성 플로우

> **브랜치:** `chore/e2e-maestro-setup` → `feat/e2e-meme-flow`

### Task 8: 밈 화면 testID 계장

**Files:**
- Modify: `apps/MemeApp/src/presentation/meme/filter-preview.screen.tsx`
- Modify: `apps/MemeApp/src/presentation/meme/meme-collection.screen.tsx`
- Modify: `apps/MemeApp/src/presentation/meme/meme-viewer.screen.tsx`
- Modify: `apps/MemeApp/src/presentation/meme/components/` (관련 하위 컴포넌트)
- Modify: `apps/MemeApp/src/shared/constants/test-ids.ts` — meme 섹션 확장

- [ ] **Step 1: 밈 화면 구조 분석**

각 화면의 주요 인터랙션 요소 파악:
- FilterPreview: 필터 선택, 이미지 업로드, 생성 버튼
- MemeCollection: 생성된 밈 그리드, 선택, 저장/공유
- MemeViewer: 밈 상세 보기, 공유, 다운로드

- [ ] **Step 2: test-ids.ts 확장**

```typescript
meme: {
  filterPreview: {
    screen: 'meme.filter-preview.screen',
    generateButton: 'meme.filter-preview.generate-button',
    imageUpload: 'meme.filter-preview.image-upload',
  },
  collection: {
    screen: 'meme.collection.screen',
    grid: 'meme.collection.grid',
    item: 'meme.collection.item',
  },
  viewer: {
    screen: 'meme.viewer.screen',
    shareButton: 'meme.viewer.share-button',
    downloadButton: 'meme.viewer.download-button',
  },
},
```

- [ ] **Step 3: 각 화면 컴포넌트에 testID 부착**
- [ ] **Step 4: TypeScript 컴파일 확인 + 커밋**

---

### Task 9: 밈 생성 E2E 플로우

**Files:**
- Create: `apps/MemeApp/e2e/flows/meme-generation.yaml`
- Create: `apps/MemeApp/e2e/flows/meme-viewer.yaml`
- Modify: `apps/MemeApp/e2e/README.md`

- [ ] **Step 1: 밈 생성 플로우 작성**

FilterPreview 화면 진입 → 이미지 업로드 → 생성 → MemeCollection 도달 검증.
인증 필요 플로우 — `helpers/login.yaml` 사용.

- [ ] **Step 2: 밈 뷰어 플로우 작성**

MemeCollection에서 밈 선택 → MemeViewer 화면 → 공유/다운로드 버튼 존재 확인.

- [ ] **Step 3: README 업데이트 + 커밋**

---

## Phase 5: SwipeFeed + Credit 플로우

> **브랜치:** `chore/e2e-maestro-setup` → `feat/e2e-swipefeed-credit`

### Task 10: SwipeFeed + Credit testID 계장

**Files:**
- Modify: `apps/MemeApp/src/presentation/swipe-feed/swipe-feed.screen.tsx`
- Modify: `apps/MemeApp/src/presentation/swipe-feed/components/`
- Modify: `apps/MemeApp/src/presentation/credit/credit-history.screen.tsx`
- Modify: `apps/MemeApp/src/presentation/credit/credit-paywall.screen.tsx`
- Modify: `apps/MemeApp/src/shared/constants/test-ids.ts`

- [ ] **Step 1: SwipeFeed 화면 구조 분석 + testID 설계**
- [ ] **Step 2: Credit 화면 구조 분석 + testID 설계**
- [ ] **Step 3: test-ids.ts 확장**

```typescript
swipeFeed: {
  screen: 'swipe-feed.screen',
  likeButton: 'swipe-feed.like-button',
  shareButton: 'swipe-feed.share-button',
},
credit: {
  history: {
    screen: 'credit.history.screen',
    list: 'credit.history.list',
  },
  paywall: {
    screen: 'credit.paywall.screen',
    purchaseButton: 'credit.paywall.purchase-button',
  },
},
```

- [ ] **Step 4: 각 화면에 testID 부착 + 커밋**

---

### Task 11: SwipeFeed + Credit E2E 플로우

**Files:**
- Create: `apps/MemeApp/e2e/flows/swipe-feed.yaml`
- Create: `apps/MemeApp/e2e/flows/credit-history.yaml`
- Modify: `apps/MemeApp/e2e/README.md`

- [ ] **Step 1: SwipeFeed 플로우 작성**

홈 피드에서 아이템 탭 → SwipeFeed 화면 → 스와이프 동작 → 좋아요/공유 버튼 확인.

- [ ] **Step 2: Credit History 플로우 작성**

인증 상태에서 크레딧 아이콘 탭 → CreditHistory 화면 도달 확인.
(크레딧 아이콘에 testID 추가 필요 — HomeHeader의 코인 아이콘)

- [ ] **Step 3: HomeHeader 크레딧 아이콘 testID 추가**

```typescript
// test-ids.ts에 추가
home: {
  header: {
    creditButton: 'home.header.credit-button',
    // ... 기존 유지
  },
},
```

- [ ] **Step 4: README 업데이트 + 커밋**

---

## Phase 6: Android + CI 안정화

> **브랜치:** `chore/e2e-maestro-setup` → `feat/e2e-android-ci`

### Task 12: Android Emulator E2E 지원

**Files:**
- Modify: `bitrise.yml` — Android e2e 워크플로우 추가
- Modify: `apps/MemeApp/e2e/.maestro/config.yaml`
- Modify: `apps/MemeApp/package.json` — android e2e 스크립트

- [ ] **Step 1: Android 빌드 + Emulator 셋업 스크립트**

```yaml
# bitrise.yml에 e2e_check_android 워크플로우 추가
# assembleDevDebug → Emulator 부팅 → APK 설치 → maestro test
```

- [ ] **Step 2: package.json에 Android E2E 스크립트 추가**

```json
"e2e:android": "maestro test --platform android e2e/flows/"
```

- [ ] **Step 3: 전체 플로우 Android 호환성 확인**

Android에서 `back` 동작이 다를 수 있음 (하드웨어 백 버튼 vs 제스처).
필요시 플로우 분기 또는 `platform` 조건 추가.

- [ ] **Step 4: 커밋**

---

### Task 13: pr_check에 E2E 통합

**Files:**
- Modify: `bitrise.yml` — pr_check 워크플로우에 e2e 스텝 추가
- Modify: `apps/MemeApp/e2e/README.md`

- [ ] **Step 1: pr_check 워크플로우에 E2E 스텝 추가**

기존 `pr_check` (tsc + jest) 이후에 E2E 스텝 추가:
```yaml
# 게스트 플로우만 (빠른 피드백)
# 인증 플로우는 별도 nightly 워크플로우로 분리
```

- [ ] **Step 2: 실행 시간 최적화**

- 병렬 실행: `maestro test e2e/flows/` (전체 디렉토리)
- 타임아웃 설정
- 실패 시 스크린샷 캡처

- [ ] **Step 3: Nightly 전체 E2E 워크플로우**

```yaml
# 매일 자정 실행, 인증 플로우 포함 전체 E2E
# 실패 시 Slack 알림
```

- [ ] **Step 4: README 최종 업데이트 + 커밋**

---

## 검증 체크리스트 (전체)

| # | 검증 항목 | Phase |
|---|----------|-------|
| 1 | smoke-test + 4개 게스트 플로우 로컬 PASS | 2 ✅ |
| 2 | 인증 바이패스 → 인증 플로우 PASS | 3 |
| 3 | 밈 생성 플로우 (FilterPreview → Collection → Viewer) PASS | 4 |
| 4 | SwipeFeed + Credit 플로우 PASS | 5 |
| 5 | Android Emulator에서 전체 플로우 PASS | 6 |
| 6 | Bitrise pr_check에서 게스트 플로우 green | 6 |
| 7 | Nightly 전체 E2E green | 6 |
