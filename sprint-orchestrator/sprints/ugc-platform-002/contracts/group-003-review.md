# Group 003 Contract Review (Round 1)

> Reviewer: Evaluator (Claude Opus 4.7)
> Sprint: ugc-platform-002
> Scope: Group 003 — 좋아요 (app-005) / 좋아요 탭 (app-006) / 페이백 모달 (app-007) / 크레딧 히스토리 PAYBACK row (app-008) / Deferred items 4 sub-fix (app-009)
> Input: `contracts/group-003.md` (2026-04-23 draft) · 5 app tasks · `api-contract.yaml` · `evaluation/criteria.md` · KB rubric v3 · group-001 + group-002 summaries · prototypes/app-005~009 specs · DRIFT-01 / DRIFT-02 · existing MemeApp 코드 trace (favorite.usecase.ts, credit.model.ts, userStorage from `@wrtn/mmkv-kit`, gen-meme callsites).

## Verdict: ISSUES

Count summary — Critical 0 / Major 4 / Minor 6

전반적 scope / AC structure 는 탄탄하다. 특히 dead-hook grep 게이트 (`usePaybackIntro` ≥ 1, `isLikedPhase1` → 0) 와 cross-group Regression Guard 가 명시돼 있어 Group 001/002 Lesson #2, #3 재발 방지 의도가 보인다. 그러나 다음 4 가지 Major 가 해소돼야 구현자가 해석 폭 없이 진행 가능:

1. **(M1)** app-005 "기존 reaction endpoint 경로는 유지" — 현재 `useToggleFavoriteUseCase` 가 reaction/favorite 에 바인딩돼 있다. "재배선" 대상과 "유지" 대상의 경계가 불명확 (내부 모순 소지).
2. **(M2)** app-007 userStorage 구현 세부 — contract L71 이 "AsyncStorage wrapper" 라 기술하지만, 실제 codebase 의 `userStorage` 는 `@wrtn/mmkv-kit` (MMKV 기반, **동기 I/O**) 이다. Prototype spec 도 `userStorage.setItem(...)` API 를 쓴다. AsyncStorage 가정은 Group 002 Major 1 과 동급 class 의 fallback/semantic 훼손 risk (race 초기화 논리 오설계).
3. **(M3)** app-006 SwipeFeed `liked` variant 확장 — discriminated union 의 3번째 케이스 `visibility: 'liked'` 가 Group 002 Round 2 에서 명시된 **3 SwipeFeed 진입 path (MY 3-tab / ProfileToSwipeFeed / legacy 홈)** 와의 정합 검증 기준이 contract 에 없음. Group 002 M4 cross-variant entity pattern 의 연장이 필요.
4. **(M4)** app-005 mapper fallback semantic — `LikeToggleResponse` 파싱 시 `likeCount` / `liked` 가 undefined 일 때의 동작이 명시되지 않음. Group 002 Major 1 (`userProfile.id=""` fallback → isOwn 오판) 과 동일 class — entity 확장 시 fallback 이 semantic 을 깨는 risk.

---

## Issues Found

### Critical (contract 가 논리적으로 동작 불가)

_없음._

---

### Major (AC testability 결함, 엣지 케이스 누락, 검증 방법 모호)

| # | Type | Done Criterion 라인 | Issue | Suggested Fix |
|---|------|---------------------|-------|---------------|
| M1 | **Internal contradiction / scope 경계 모호** | `group-003.md` L37-41 (app-005 toggle 재배선) + `tasks/app/005-*.md` L33 ("기존 endpoint 회귀 방지, 좋아요 전용 로직만 치환") | Contract 는 "`useToggleFavoriteUseCase` 가 be-004 endpoint 호출" 로 재배선을 명시하지만, task spec L33 은 **기존 reaction 경로 유지 + 좋아요 전용 로직만 치환** 이라 기술. 실제 `domain/favorite/favorite.usecase.ts` 는 favorite/reaction 바인딩 된 훅 하나만 존재. "유지 vs 치환" 의 **대상 경계** 가 없어 구현자가 (a) 훅 내부를 완전 대체 / (b) 새 훅 신설 후 기존 훅 유지 / (c) if-else 이원 바인딩 중 선택 가능 → AC trace 기준이 모호. Group 001 Lesson #1 (DTO 추가 vs behavior 명확 분리) 재발 위험. | Done Criterion 에 명시: **"`useToggleFavoriteUseCase` 훅의 **내부 구현만** be-004 로 치환 (기존 export signature 유지 — `toggleFavorite(contentId, nextState)`). 기존 reaction endpoint (`/reactions/*` 류) 는 favorite usecase 외부에서 0 callsite (grep 으로 확인). favorite 도메인 내부에서만 endpoint 스왑."** + Verification Method 에 grep 추가: `rg "\/reactions|REACTION\.LIKE" app/apps/MemeApp/src --glob '*.ts' --glob '*.tsx' | grep -v __tests__ → 0 hit`. |
| M2 | **Fact error — userStorage ≠ AsyncStorage** | L71-72 (app-007 1회성 gate) + task spec L40 "AsyncStorage wrapper" | codebase trace: `userStorage` 는 `@wrtn/mmkv-kit` 의 MMKV 래퍼 (**동기 I/O**). 기존 callsite (`shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx`, `useWatermarkRemovalChecker.tsx`) 모두 `createStorageBuilder(userStorage).string/boolean().build()` 패턴 사용. Contract 가 "AsyncStorage wrapper" 로 기술하면 구현자가 (a) 신규 AsyncStorage 도입 / (b) Provider preload + race-safe async 초기화 로직 과설계 / (c) 잘못된 fallback (`undefined` → show 중복 노출) risk. Group 002 Major 1 fallback-semantic 훼손 class. | **"`userStorage` (`@wrtn/mmkv-kit`, MMKV 동기 I/O) 에 `PAYBACK_INTRO_SHOWN: boolean` flag. 기존 `createStorageBuilder(userStorage).boolean().build()` 패턴 재사용. 동기 I/O 이므로 Provider preload 불필요 — hook 내부에서 즉시 read. 초기값 `undefined` → 미노출 상태가 아님 (flag 미set === 1회차), default `false` 로 간주 후 노출."** 로 교체. Implementation hint 의 "AsyncStorage race 주의" 삭제. |
| M3 | **Cross-variant regression (Group 002 M4 재발 위험)** | L58-60 (app-006 SwipeFeed liked variant) + L117 (Regression Guard) | Group 002 Round 2 Patch 4 에서 3 SwipeFeed 진입 path (MY 3-tab / ProfileToSwipeFeed / legacy 홈) 의 동일 `meme.mapper.ts` 경유 trace 가 Done Criterion 으로 승격됨. Group 003 은 **discriminated union 에 `visibility: 'liked'` variant 를 신규 추가** 하므로 (a) 신규 variant 의 queryFn 가 어느 mapper 를 경유하는지, (b) 3 variant 전체가 동일 `FeedItemEntity` (likeCount/liked) 를 동일 경로로 받는지, (c) legacy 홈 variant (visibility 개념 없음) 가 liked variant 추가로 TS 회귀 없이 동작하는지 명시 없음. rubric C12 (enabled gate) 만으로는 mapper 정합 trace 가 부족. | Done Criterion 추가: **"`useGetProfileSwipeFeedUseCase` 의 switch 확장 후 (a) MY 3-tab (`visibility:public|private|liked`), (b) ProfileToSwipeFeed (`kind:user`), (c) legacy 홈 필터, 3 path 모두 동일 `meme.mapper.ts` 를 경유하여 `FeedItemEntity` 생성 (`likeCount`/`liked` 포함) 함을 trace. 신규 liked variant 의 queryFn 이 `/v2/me/contents?visibility=liked` 단일 endpoint 만 호출 (enabled gate rubric C12). legacy 홈 variant 의 route types 는 visibility 필드 없음을 유지 (TS union exhaustiveness)."** |
| M4 | **Fallback semantic — mapper 에서 likeCount/liked undefined 대응 미정의** | L41-42 (app-005 response 파싱) + api-contract L301-308 (likeCount required, liked required) | api-contract 가 `likeCount` / `liked` / `regenerateCount` 를 ContentSummary required 로 선언하지만, **롤아웃 지연 / legacy 응답 / 캐시된 Phase 1 응답** 에서 undefined 가능. Contract 는 "zod 파싱 실패 시 feed 제외" 류의 fallback 정책이 없음. Group 002 Round 2 Patch 5 (m2 isCustomPrompt undefined) 에서 이미 해결된 class 의 좋아요 domain 판박이. likeCount=undefined 시 `toLocaleString('ko-KR')` TypeError / `"0"` 렌더 중 무엇이 기대인지 불명 + Self-like 판정 regression risk. | Done Criterion 추가: **"Zod 스키마에서 `likeCount`, `liked` 필수 (zod `.number().int().nonnegative()` / `.boolean()`). 파싱 실패 시 feed item 제외 (기존 Phase 2 app-001 zod 패턴 일관). runtime fallback 금지 — `likeCount ?? 0` / `liked ?? false` 패턴 grep → 0 hit (semantic-breaking fallback 방지). LikeToggleResponse 도 동일 필수 boolean + 음수 금지 nonnegative int."** Verification Method 7 번에 `rg 'likeCount\s*\?\?' app/apps/MemeApp/src → 0 hit`. |

---

### Minor (clarity / testability 부차적)

| # | Type | Done Criterion 라인 | Issue | Suggested Fix |
|---|------|---------------------|-------|---------------|
| m1 | **Trigger precision** | L74 (app-007 trigger primary) + task spec L37-38 | "최초 공개 이벤트 (생성 완료 자동 공개 or 게시 토글 OFF→ON)" — **both OR one?** 질문에 답 없음. 두 trigger 가 모두 발화하면 동일 세션 내 중복 모달 시도 (flag check 로 2회차는 막히지만 1회차 동안 race 가능). | **"Primary trigger: 생성 완료 후 자동 공개 성공 이벤트 (useGenerateMemeUseCase onSuccess + result.isPublished === true). Secondary (fallback only): 게시 토글 OFF→ON 성공 이벤트. flag === true 시 양쪽 trigger 모두 no-op. 동일 세션 중복 mount 방지는 flag 의 동기 read 로 자연 보장 (MMKV)."** 로 명시. |
| m2 | **QueryKey 상수 명시 누락** | L52-53 (app-005 cache 업데이트) | Group 002 Round 2 Patch 5 와 동일 이슈. "세로 스와이프 피드, 프로필 콘텐츠 목록, 좋아요 탭 목록, counts" invalidate 대상의 queryKey 상수명 미기재. | `MEME_QUERY_KEYS.feed.*`, `ME_CONTENTS_QUERY_KEYS.list('liked'|'public'|'private')`, `ME_CONTENTS_QUERY_KEYS.counts`, `USER_CONTENTS_QUERY_KEYS.list(userId)` 4 key 상수 명시 + `invalidateQueries` grep 검증. |
| m3 | **Clipboard grep 범위 모호** | L103-104 (app-009 Sub-fix 3) | `rg "from 'react-native'" \| rg 'Clipboard'` grep 범위가 `app/apps/MemeApp/src` 인지 전체 monorepo (`app-core-packages`) 인지 불명. 테스트 파일 (`__tests__`, `*.test.tsx`) 포함 여부도 불명. | **"Grep 범위: `app/apps/MemeApp/src` 단일 — `app-core-packages/` 의 pre-existing 사용은 scope 외 (별도 follow-up). `__tests__` 및 `*.test.tsx` 제외 (`--glob '!**/__tests__/**' --glob '!**/*.test.*'`) — production 코드 한정."** 으로 범위 고정. |
| m4 | **Sub-fix 4 fallback 정상 케이스 guard 누락** | L107-108 (app-009 Sub-fix 4 initialContentId) | fallback `effectiveIndex = initialIndex >= 0 ? initialIndex : 0` 만 명시. **정상 케이스 (id 존재)** 에서 기존 동작 유지를 위한 test 누락 — list empty (length=0) 케이스 처리도 불명 (findIndex → -1 → 0, 하지만 list[0] 없음 → 런타임 err). | Done Criterion 추가: **"list.length === 0 시 `SwipeFeed` 는 empty state 렌더 (기존 fallback UI 재사용). list.length ≥ 1 + initialContentId 존재 → 기존 index 유지. list.length ≥ 1 + initialContentId 없음/불일치 → index 0. 3 케이스 모두 unit test 또는 Evaluator trace."** |
| m5 | **E2E flow precondition 명시 부족** | L168-169 (E2E Smoke Gate) | `payback-intro-modal.yaml` seed prerequisite ("신규 유저 flag 미set + 공개 콘텐츠") 가 있으나 **user 초기화 방법** 이 불명 (마에스트로 appId clear-state? userStorage 수동 reset?). rubric C9 (E2E 환경 의존성 명시). | **"Flow 상단 주석에 prerequisite: `clearState: true` (Maestro app reset) + seed user 가 콘텐츠 1개 보유 (publish=false initial). Flow step 1 = 게시 토글 OFF→ON → 2회차 반복 시 미노출 assert 는 unit test (flag true 분기)."** 로 구체화. |
| m6 | **Credit filter chip 분류 불확정** | L89 (app-008 Filter chip "적립") | "적립" 칩에 PAYBACK 포함 — 기존 "적립" 칩이 어떤 transactionType 을 매핑하는지 확인 없이 PAYBACK 추가. 기존 칩 필터 로직 (`CreditMapper.toCreditHistoryChipEntityCollection`) 이 transactionType 배열을 enum 으로 쥐고 있으면 enum 확장 필요. | **"`CreditMapper.toCreditHistoryChipEntityCollection` 내 '적립' chip 의 transactionType 배열에 `CREDIT_TRANSACTION_TYPE.PAYBACK` 추가. 기존 chip 카운트 (충전/차감/환불) 회귀 없음 — unit test snapshot."** 로 구체 코드 위치 명시. |

---

## Recommended Contract Patches

```diff
Patch 1 — app-005 L37-41: reaction endpoint 경계 명확화 (M1)
@@ Done Criteria: app-005 @@
-- [ ] `useToggleFavoriteUseCase` 가 be-004 endpoint 호출:
-  - `toggleFavorite(contentId, nextState)`:
-    - `nextState === true` → `POST /v2/contents/:contentId/likes`
-    - `nextState === false` → `DELETE /v2/contents/:contentId/likes`
-  - Response `LikeToggleResponse { contentId, liked, likeCount }` 파싱 + React Query cache 업데이트.
+- [ ] `useToggleFavoriteUseCase` **훅의 내부 구현만** be-004 endpoint 로 치환. export signature (`toggleFavorite(contentId, nextState)`) 유지.
+- [ ] `nextState === true` → `POST /v2/contents/:contentId/likes`. `nextState === false` → `DELETE /v2/contents/:contentId/likes`.
+- [ ] Response `LikeToggleResponse { contentId, liked, likeCount }` 파싱 — zod 필수 3필드 (string / boolean / nonnegative int). 파싱 실패 시 cache 업데이트 skip + 기존 optimistic rollback.
+- [ ] **기존 reaction endpoint 제거**: `rg "\/reactions|REACTION\.LIKE" app/apps/MemeApp/src --glob '*.ts' --glob '*.tsx' | grep -v __tests__` → 0 hit. favorite 도메인 외부에서 0 callsite.
+- [ ] React Query cache 업데이트 대상 queryKey 상수: `MEME_QUERY_KEYS.feed.*`, `ME_CONTENTS_QUERY_KEYS.list('liked'|'public'|'private')`, `ME_CONTENTS_QUERY_KEYS.counts`, `USER_CONTENTS_QUERY_KEYS.list(userId)`. `invalidateQueries` 호출부 grep 으로 각 키 존재 확인.
```

```diff
Patch 2 — app-007 L71-72: userStorage = MMKV (동기 I/O) 명시 (M2)
@@ Done Criteria: app-007 @@
-- [ ] **1회성 gate**: `userStorage` (AsyncStorage wrapper) 에 `PAYBACK_INTRO_SHOWN: boolean` flag.
-  - 노출 후 flag set. 이후 미노출.
-  - 비로그인 시 skip.
+- [ ] **1회성 gate**: `userStorage` (`@wrtn/mmkv-kit`, MMKV 동기 I/O) 에 `PAYBACK_INTRO_SHOWN: boolean` flag. 기존 codebase 패턴 재사용 — `createStorageBuilder(userStorage).boolean().build()` (참조: `shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx`, `presentation/meme/hooks/useWatermarkRemovalChecker.tsx`).
+- [ ] 동기 I/O 이므로 Provider preload / async race 처리 불필요. Hook 내부에서 즉시 `get()` → false (기본값) 시 1회차 노출, true 시 skip. 노출 후 `set(true)`. `undefined` 상태는 false 로 간주.
+- [ ] 비로그인 시 trigger 자체 skip (authUser 존재 체크 선행).
```

```diff
Patch 3 — app-006 L58-60: SwipeFeed liked variant 3-path cross-mapper trace (M3)
@@ Done Criteria: app-006 @@
-- [ ] 카드 탭 → SwipeFeed `{kind:'me', visibility:'liked'}` variant 진입 지원 (`useGetProfileSwipeFeedUseCase` switch 에 liked 케이스 추가 or 확장).
-  - variant 별 **enabled gate** 필수 (rubric C12) — liked variant 의 queryFn 만 발화, 다른 variant 불필요 fire 없음.
+- [ ] 카드 탭 → SwipeFeed `{kind:'me', visibility:'liked'}` variant 진입 지원. `useGetProfileSwipeFeedUseCase` switch 에 liked 케이스 추가.
+- [ ] **Cross-variant mapper 정합 (Group 002 M4 재사용)**: 신규 liked variant 추가 후 3 진입 path 모두 동일 `meme.mapper.ts` (또는 `me-contents.mapper.ts`) 경유하여 `FeedItemEntity` 생성 확인:
+   (a) MY 3-tab (`kind:me, visibility:public|private|liked`)
+   (b) ProfileToSwipeFeed (`kind:user, userId`)
+   (c) legacy 홈 필터 (`targetId, type, entryPoint`)
+   각 path 의 queryFn trace + `FeedItemEntity.likeCount/liked` 필드 일관.
+- [ ] variant 별 **enabled gate** 필수 (rubric C12):
+   - liked variant: `enabled: source.kind === 'me' && source.visibility === 'liked'`
+   - public/private variant: 기존 gate 유지
+   - user variant: `enabled: source.kind === 'user'`
+   - legacy: `enabled: !!source.targetId`
+   다른 variant 불필요 fire 없음 (network spy).
+- [ ] Route types 확장 후 legacy 홈 변종 callsite (rubric C7 v3) typecheck clean. `yarn typescript | grep -v '@wrtn/'` 신규 에러 0.
```

```diff
Patch 4 — app-005 fallback semantic + Verification Method 확장 (M4 + m2)
@@ Done Criteria: app-005 @@
+- [ ] **Mapper fallback 금지 (Group 002 M1 재발 방지)**: `LikeToggleResponse` / `FeedItemEntity` 확장에서 `likeCount ?? 0`, `liked ?? false`, `userProfile.id || ""` 류 semantic-breaking fallback 금지. zod 필수 boolean/nonnegative int 강제. 파싱 실패 시 feed item 제외 (Phase 2 app-001 패턴 일관).
+- [ ] grep: `rg 'likeCount\s*\?\?\s*0|liked\s*\?\?\s*false' app/apps/MemeApp/src --glob '*.ts' --glob '*.tsx' | grep -v __tests__` → 0 hit.

@@ Verification Method > Active Evaluation Techniques @@
+ 10. **Mapper fallback semantic 검증 (Group 002 M1 lesson)**:
+     - `rg 'likeCount\s*\?\?|liked\s*\?\?\s*false' app/apps/MemeApp/src` → 0 hit (runtime default 금지).
+     - zod 필수 필드 확인: `LikeToggleResponse.schema` + `FeedItemEntity.schema` likeCount/liked 필수 여부.
+     - Self-like 판정 코드 경로: `item.ownerId === myUserId` 비교가 mapper 에서 fallback (`""` / undefined) 으로 false 오판하지 않는지 trace.
```

```diff
Patch 5 — app-007 Trigger precision (m1)
@@ Done Criteria: app-007 @@
-- [ ] Trigger primary: 최초 공개 성공 이벤트 (생성 완료 자동 공개 or 게시 토글 OFF→ON).
+- [ ] **Trigger primary** (단일): 생성 완료 후 자동 공개 성공 이벤트. `useGenerateMemeUseCase` onSuccess + `result.isPublished === true` 시점.
+- [ ] **Trigger secondary** (fallback only, primary 미발화 경우 대비): 게시 토글 OFF→ON 성공 시점 (app-004 `useUpdateMeContentVisibilityUseCase` onSuccess). flag === true 시 양쪽 trigger 모두 no-op. 동일 세션 중복 mount 방지는 MMKV 동기 read 로 자연 보장.
```

```diff
Patch 6 — app-009 Sub-fix 3/4 범위/케이스 명시 (m3 + m4)
@@ Done Criteria: app-009 — Sub-fix 3 @@
-- [ ] `rg "from 'react-native'" | rg 'Clipboard'` → 0 hit.
+- [ ] `rg "from 'react-native'" app/apps/MemeApp/src --glob '*.ts' --glob '*.tsx' --glob '!**/__tests__/**' --glob '!**/*.test.*' | rg 'Clipboard'` → 0 hit (production 코드 한정, scope = MemeApp/src).
+- [ ] `app-core-packages/` 의 pre-existing Clipboard 사용은 scope 외 (별도 follow-up 기록).

@@ Done Criteria: app-009 — Sub-fix 4 @@
-- [ ] Sub-fix 4 initialContentId fallback 정상 케이스 회귀 guard.
-- [ ] `const initialIndex = list.findIndex(i => i.id === initialContentId); const effectiveIndex = initialIndex >= 0 ? initialIndex : 0;`
-- [ ] 정상 케이스 (id 존재) 동작 회귀 없음.
+- [ ] fallback 코드: `const initialIndex = list.findIndex(i => i.id === initialContentId); const effectiveIndex = initialIndex >= 0 ? initialIndex : 0;`
+- [ ] 3 케이스 모두 동작 확인:
+   (a) list.length ≥ 1 + initialContentId 존재 match → 기존 index 유지 (회귀 없음).
+   (b) list.length ≥ 1 + initialContentId 없음/불일치 → effectiveIndex = 0.
+   (c) list.length === 0 → SwipeFeed empty state (기존 fallback UI 재사용, index 접근 전 early return).
+   Unit test 또는 Evaluator trace.
```

```diff
Patch 7 — app-008 Filter chip 코드 위치 명시 (m6)
@@ Done Criteria: app-008 @@
-- [ ] Filter chip "적립" 에 PAYBACK 포함 (CreditMapper.toCreditHistoryChipEntityCollection 확인).
+- [ ] `CreditMapper.toCreditHistoryChipEntityCollection()` 내 '적립' chip 의 transactionType 배열에 `CREDIT_TRANSACTION_TYPE.PAYBACK` 추가. 기존 chip 카운트 (충전/차감/환불) snapshot test 회귀 없음.
```

```diff
Patch 8 — E2E precondition + reset (m5)
@@ Verification Method > E2E Smoke Gate @@
- 9. **E2E Smoke Gate (phase-build §4.3.2)**:
-    - 신규 `payback-intro-modal.yaml` 실행 (seed: 신규 유저 flag 미set + 공개 콘텐츠).
+ 9. **E2E Smoke Gate (phase-build §4.3.2, rubric C9)**:
+    - 신규 `payback-intro-modal.yaml` 실행. Flow 상단 주석에 prerequisite:
+      - `clearState: true` (Maestro app reset → MMKV `PAYBACK_INTRO_SHOWN` 초기화).
+      - Seed user 가 콘텐츠 1개 보유 (publish=false initial).
+      - Step 1: 게시 토글 OFF→ON 또는 첫 생성 → PaybackIntroModal assertVisible.
+      - 2회차 노출 금지는 unit test (flag true 분기 no-op).
+    - `credit-history.yaml` 확장: PAYBACK row assertVisible + "크레딧 페이백" text + thumbnail.
+    - `my-profile-default-landing.yaml` 확장: 좋아요 탭 진입 + empty/with-items 2 branch.
+    - Maestro tap 제약 인지 — assertVisible 위주.
```

---

## Round 2 합의 조건

Round 2 APPROVE 를 위한 최소 조건:

1. **M1 해소 (Patch 1)**: app-005 "훅 내부만 재배선 / signature 유지 / reaction endpoint 외부 0 callsite" 명시 + grep 게이트.
2. **M2 해소 (Patch 2)**: app-007 userStorage = `@wrtn/mmkv-kit` (MMKV 동기 I/O) 명시 + AsyncStorage/race 언급 제거 + 기존 패턴 (`createStorageBuilder`) 참조.
3. **M3 해소 (Patch 3)**: app-006 SwipeFeed liked variant 의 3-path cross-mapper trace + 4 variant 각 enabled gate 명시 (Group 002 M4 + rubric C12 정합).
4. **M4 해소 (Patch 4)**: mapper fallback 금지 (`?? 0`, `?? false`, `|| ""` grep 0 hit) + zod 필수 필드 강제 (Group 002 M1 재발 방지).

**Minor (m1~m6)** 는 Round 2 에서 반영 권고. 특히 m1 (trigger primary/secondary) 와 m4 (Sub-fix 4 list.length=0) 는 구현자 해석 폭을 줄이기 위해 선호. m2/m3/m5/m6 는 rubric C4 verdict 비블로킹 — 미반영 시에도 Round 2 APPROVE 가능.

**KB Pattern 연결**:
- M2 → `integration-002` 후보 신설 (storage primitive 정확성 — AsyncStorage vs MMKV 혼동 방지) — 2회 이상 누적 시 KB 승격.
- M4 → `completeness-008` (Group 001 Lesson #3 + Group 002 M3 + Group 003 M4) — fallback semantic 검증 grep 게이트 의무화. 3회 누적 → rubric v4 promotion 후보.
- M3 → `completeness-007` v2 (Group 002 M4 + Group 003 M3) — cross-variant mapper 전수 명시 의무. 2회 누적.

---

## Sign-off (Round 1)

- Evaluator: **ISSUES**
- Date: 2026-04-23
- Next step: Sprint Lead (or Generator) 가 Patches 1~4 (최소) + 5~8 (권고) 반영 → Round 2 재검토.

---

## Round 2 Review (2026-04-23)

Sprint Lead 가 Patches 1~8 (Major 4 + Minor 6) 전량 반영. 각 항목을 업데이트된 contract (group-003.md) 에서 라인 단위로 verify.

### Patch Verification Table

| Concern | Round 1 | Resolution | Verdict |
|---------|---------|------------|---------|
| **Major #1** — app-005 reaction 경계 | 훅 내부만 치환 / signature 유지 / reaction grep 0 | L37 "`useToggleFavoriteUseCase` **훅의 내부 구현만** be-004 endpoint 로 치환. export signature (`toggleFavorite(contentId, nextState)`) 유지" + L40 `rg "\/reactions\|REACTION\.LIKE" ... → 0 hit` + "favorite 도메인 외부에서 0 callsite" | **RESOLVED** |
| **Major #2** — userStorage MMKV | `@wrtn/mmkv-kit` + createStorageBuilder 참조 + AsyncStorage 언급 제거 | L84 "`userStorage` (`@wrtn/mmkv-kit`, MMKV **동기 I/O**)" + "`createStorageBuilder(userStorage).boolean().build()` (참조: `bottom-confirm-sheet.tsx`, `useWatermarkRemovalChecker.tsx`)" + L85 "Provider preload / async race 처리 불필요" (AsyncStorage/race 언급 삭제) | **RESOLVED** |
| **Major #3** — cross-variant 3-path mapper | Liked variant 추가 + 4 variant enabled gate + TS callsite 가드 | L60 liked variant switch 확장 + L61-65 3 path (MY 3-tab / ProfileToSwipeFeed / legacy 홈) cross-mapper trace + L66-71 4 variant enabled gate (liked / public-private / user / legacy) + L72 `yarn typescript` 신규 에러 0 TS callsite 가드 | **RESOLVED** |
| **Major #4** — fallback 금지 | `?? 0` / `?? false` grep + zod 필수 필드 강제 | L42 "`likeCount ?? 0`, `liked ?? false`, `userProfile.id \|\| ""` 류 semantic-breaking fallback 금지. zod 필수 boolean/nonnegative int 강제. 파싱 실패 시 feed item 제외" + L43 `rg 'likeCount\s*\?\?\s*0\|liked\s*\?\?\s*false' → 0 hit` + L193-196 Verification 10 (Self-like fallback trace) | **RESOLVED** |
| **Minor m1** — trigger precision | primary / secondary 분리 명시 | L87 "Trigger primary (단일): 생성 완료 후 자동 공개 성공 이벤트. `useGenerateMemeUseCase` onSuccess + `result.isPublished === true`" + L88 "Trigger secondary (fallback only): 게시 토글 OFF→ON (`useUpdateMeContentVisibilityUseCase` onSuccess). flag === true 시 양쪽 no-op" | **RESOLVED** |
| **Minor m2** — QueryKey 상수 | 4 상수 명시 | L41 "`MEME_QUERY_KEYS.feed.*`, `ME_CONTENTS_QUERY_KEYS.list('liked'\|'public'\|'private')`, `ME_CONTENTS_QUERY_KEYS.counts`, `USER_CONTENTS_QUERY_KEYS.list(userId)`" + invalidateQueries grep 확인 (Patch 1 에 통합 반영) | **RESOLVED** |
| **Minor m3** — Clipboard grep 범위 | MemeApp/src + production only | L117 "`rg "from 'react-native'" app/apps/MemeApp/src --glob '*.ts' --glob '*.tsx' --glob '!**/__tests__/**' --glob '!**/*.test.*' \| rg 'Clipboard'` → 0 hit" + L118 "`app-core-packages/` 는 scope 외" 명시 | **RESOLVED** |
| **Minor m4** — Sub-fix 4 empty list | 3 케이스 가드 | L121-127 3 케이스 (a: match→index 유지 / b: unmatch→0 / c: empty→early return empty state) + Unit test or trace | **RESOLVED** |
| **Minor m5** — E2E precondition | clearState / seed / 2회차 unit test | L184-188 `clearState: true` + seed user 콘텐츠 1개 (publish=false) + Step1 OFF→ON → assertVisible + 2회차 미노출은 unit test (flag true 분기) | **RESOLVED** |
| **Minor m6** — Credit chip code location | CreditMapper 코드 위치 명시 | L103 "`CreditMapper.toCreditHistoryChipEntityCollection()` 내 '적립' chip 의 transactionType 배열에 `CREDIT_TRANSACTION_TYPE.PAYBACK` 추가. snapshot test 회귀 없음" | **RESOLVED** |

### Resolved Count

- Major: 4 / 4 (100%)
- Minor: 6 / 6 (100%)
- Total: 10 / 10

### Remaining Concerns

_없음._ Round 2 블로커 전무. 다음 사항은 구현 단계 관찰로 충분 (contract 재수정 불필요):

- Verification Method L176 (기존 Clipboard grep) 은 Done Criterion L117 의 정밀 grep 이 SSOT 이므로 비블로킹 — 구현자는 L117 범위 준수.
- L85 "`undefined` 상태는 false 로 간주" 문구는 MMKV semantic (미set === 기본값) 을 명확히 함 — Group 002 M1 "fallback 금지" 와 충돌 아님 (entity 오판 risk 없이 1회차 노출 기대 동작).

### KB Pattern Accumulation (next sprint 로 이월)

- `integration-002` (storage primitive 정확성 — AsyncStorage vs MMKV) — 1회 누적 (G003 M2). 2회 이상 시 KB 승격.
- `completeness-008` (fallback semantic grep 게이트) — 3회 누적 (G001 #3 + G002 M3 + G003 M4). **rubric v4 promotion 후보 확정** — Evaluator Retro 에서 제안 권고.
- `completeness-007 v2` (cross-variant mapper 전수 trace) — 2회 누적 (G002 M4 + G003 M3). KB 승격 권고.

### Final Verdict: **APPROVE**

Round 1 의 Major 4 / Minor 6 전량이 Patches 1~8 로 명확히 해소됨. Contract 는 이제 구현자 해석 폭 없이 trace-ready. Group 001/002 lesson reuse (fallback 금지, cross-variant mapper, dead-hook grep) 이 체계적으로 주입되어 있음. Generator build phase 진행 가능.

## Sign-off (Round 2)

- Evaluator: **APPROVE**
- Date: 2026-04-23
- Resolved: Major 4 / 4, Minor 6 / 6 (total 10 / 10)
- Next step: Sprint Lead → Generator build (app-005 ~ app-009 구현 착수).
