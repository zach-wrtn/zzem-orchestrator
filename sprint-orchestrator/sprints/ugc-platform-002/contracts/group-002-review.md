# Group 002 Contract Review (Round 1)

> Reviewer: Evaluator (Claude Opus 4.7)
> Sprint: ugc-platform-002
> Scope: Group 002 — App 피드 인터랙션 (app-001 ~ app-004)
> Input: `contracts/group-002.md` (2026-04-23 draft), 4 app tasks, api-contract.yaml, criteria.md, KB rubric v3, group-001-summary Lessons, prototypes app-001~004, prd-amendment.md (DRIFT-01/02).

## Verdict: ISSUES

Count summary — Critical 0 / Major 4 / Minor 5

Contract 은 전반적으로 scope / verification 기법이 탄탄하나, Group 001 Lesson #3 (dead-hook grep 의무), Lesson #2 (cross-component 전수 나열), 그리고 app-003 내부 모순 (서버 에러코드 수신 시 Toast vs Modal), app-004 토글 위치 prototype SSOT 정합 — 네 가지가 Round 1 에서 수정되어야 구현자가 해석 폭 없이 진행 가능.

---

## Issues Found

### Critical (contract 가 논리적으로 동작 불가)

_없음._

---

### Major (AC testability 결함, 엣지 케이스 누락, 검증 방법 모호)

| # | Type | Done Criterion 라인 | Issue | Suggested Fix |
|---|------|---------------------|-------|---------------|
| M1 | **Internal contradiction** | `group-002.md` L56 vs L60 (app-003) | `SOURCE_CONTENT_DELETED` errorCode 수신 시의 UI 가 이중 정의됨 — L56 은 "FilterDeletedErrorModal 노출" (modal), L60 은 "Toast + invalidate". app-003 task 파일 L66-68 은 **modal** 이 정답 ("삭제된 필터 에러 모달과 유사"). Contract 가 충돌하므로 구현자가 Toast 든 Modal 이든 선택 가능 → AC 판정 불가. | `SOURCE_CONTENT_DELETED` 수신 시: **FilterDeletedErrorModal 노출 + 피드 invalidate** 로 통일. Toast 는 `SOURCE_CONTENT_NOT_PUBLIC` 전용 ("이 콘텐츠는 이제 비공개예요"). 두 에러코드별 UI 분기 테이블로 명시. |
| M2 | **Prototype SSOT 불일치 (potential drift)** | L63 (app-004 Toggle 위치) | "하단 CTA 영역 **좌측/상단**" — "좌측/상단" either/or 해석 가능. Prototype `PublishToggle.spec.md` canonical 은 **CTA 버튼 위쪽 full-width row (space-between: label left, switch right)**. "좌측" 으로 해석되면 CTA 와 가로 배치가 되어 prototype drift. | "세로 스와이프 하단 CTA **위쪽 row** (space-between: `PublishLabel` left + `PublishSwitch` right). `cta-footer` 내부 flex-column direction=vertical, gap=8. 타 유저 콘텐츠에서는 row 전체 unmount" 로 표현 교체. Prototype spec `cta-footer → publish-toggle-row → TemplateCTAButton` 계층 SSOT. |
| M3 | **Dead-hook grep 의무 누락 (Group 001 Lesson #3)** | Verification Method 전체 | `useUpdateMeContentVisibilityUseCase()` / `useDeleteMyContentUseCase()` 신설이 명시되었으나 **callsite count ≥ 1 검증 gate** 가 Done Criteria 에 없음. Group 001 Round 1 Major 1/3 (setSourceContentId dead / buildGenerationCompletedEvent dead) 와 동일 class 이슈 재발 위험. | Verification Method 8번으로 추가: `rg "useUpdateMeContentVisibilityUseCase\(" app/apps/MemeApp/src --glob '*.tsx' --glob '*.ts' → ≥ 1 hit`, `rg "useDeleteMyContentUseCase\(" ... → ≥ 1 hit`. 두 훅 모두 실제 컴포넌트에서 호출됨 확인 (Publish/DeleteConfirm 컴포넌트). |
| M4 | **Cross-component 적용 범위 전수 나열 누락 (Group 001 Lesson #2)** | L6-13 Target areas / L143 Cross-group | `FeedItemEntity` 확장 (likeCount, liked, regenerateCount, sourceContentId, isCustomPrompt) 이 어떤 **SwipeFeed 진입 variant** 에 영향을 주는지 전수 나열 없음. Phase 1 discriminated union 3 variants (`{kind:'me',visibility}`, `{kind:'user',userId}`, legacy `{targetId,type,entryPoint}`) 의 각 variant 에서 매퍼/훅이 같은 entity 를 받아 렌더하는지 확인 루프 필요 — L84 "discriminated union variant 여전히 정상" 만으로는 부족. | Done Criterion 추가: "본 그룹 entity 확장은 아래 3 SwipeFeed 진입 path 모두에서 동일 매퍼/entity 를 거친다: (a) MY profile 3-tab 진입, (b) ProfileToSwipeFeed (타 유저), (c) legacy 홈 → SwipeFeed. 각 path 의 queryFn 이 동일 `meme.mapper.ts` 를 경유함을 trace 확인." |

---

### Minor (clarity / testability 부차적)

| # | Type | Done Criterion 라인 | Issue | Suggested Fix |
|---|------|---------------------|-------|---------------|
| m1 | missing-spec | L34 (app-001 telemetry) | `click_vertical_feed_action_btn` 의 `button_name` 에 `regenerate` 추가 — 기존 enum 값 리스트가 Contract 에 없어 "추가" 검증을 위해 enum 소재를 밝혀야 함. | "기존 `button_name` enum 에 `'regenerate'` 문자열 추가 (위치: `<tracking-event-spec-path>`). grep hit 시 regenerate 존재 확인" 식 경로 추가. |
| m2 | edge-case | L43 (app-002 contentType 분기) | `item.isCustomPrompt` 가 `undefined` (BE 롤아웃 지연 / legacy 응답) 일 때 DELETE 엔드포인트 분기 동작 미정의. | "default: `isCustomPrompt !== true` → filter DELETE" 로 fallback 명시, or Zod 스키마에서 `isCustomPrompt` 필수로 강제 (L32 에 이미 "신규 필드" 로 추가되어 있음. Zod 가 boolean 필수면 undefined 상태는 파싱 실패 → Queryfn 에러. 이 경우 DELETE 분기는 도달 불가 — 명시 필요). |
| m3 | unclear-scope | L44 (app-002 invalidate QueryKey) | "React Query invalidate (meme-feed, me-contents, counts)" — 구체 queryKey 상수 미명시. | `meme.query-key.ts`, `me-contents.query-key.ts` 상수명 명시 (예: `MEME_QUERY_KEYS.feed.all`, `ME_CONTENTS_QUERY_KEYS.list`, `ME_CONTENTS_QUERY_KEYS.counts`). Evaluator 는 `invalidateQueries` 호출부 grep 으로 각 키 존재 확인. |
| m4 | optional-vs-required | L69 (app-004 rollback) | "optimistic update 사용 시 rollback" — optimistic 사용 자체가 옵셔널인지 필수인지 불명. Task spec Implementation Hints 는 "고려". AC L70 "실패 시 Toast error + 토글 원복" 이 성립하려면 사실상 optimistic path 필수. | "Optimistic update 필수 (UX 즉시 반영). 실패 시 `isPublished` 원복 + toggle track state rollback. Test: `rejected` mock 주입 시 최종 상태 = 이전 상태." 로 확정. |
| m5 | verification-method-gap | L120 (C7 v3 grep 방식) | Done Criteria L90 에서 `yarn typescript 2>&1 \| grep -v '@wrtn/' \| grep 'error TS'` → 0 hit. 정상이나 **측정 기준선(baseline)** 이 없으면 "신규 0" 판정이 어려울 수 있음. Group 001 에서도 pre-existing cascade 와의 구분 필요성이 제기됨. | "Baseline: pre-change `yarn typescript 2>&1 \| grep -v '@wrtn/' \| grep 'error TS' \| wc -l = N` 기록 → post-change 동일 명령 ≤ N. Diff 라인에 신규 컴포넌트/훅 관련 오류 없음 (evaluator 가 diff 검토)." |

---

## Recommended Contract Patches

```diff
Patch 1 — app-003 L56 & L60: SOURCE_CONTENT_DELETED UI 이중 정의 해소
@@ Done Criteria: app-003 @@
-- [ ] 삭제된 원본 필터 → `FilterDeletedErrorModal` 노출 (단일 action "확인"). 탭 후 피드 유지.
+- [ ] 삭제된 원본 필터 (client-side check OR BE `SOURCE_CONTENT_DELETED` 수신) → `FilterDeletedErrorModal` 노출 (단일 action "확인"). 탭 후 피드 유지 + 해당 아이템 invalidate.
@@
-- [ ] BE 응답 `SOURCE_CONTENT_DELETED` / `SOURCE_CONTENT_NOT_PUBLIC` errorCode 수신 시 Toast + invalidate.
+- [ ] BE errorCode 분기:
+   - `SOURCE_CONTENT_DELETED` → `FilterDeletedErrorModal` (위 규칙 동일) + feed invalidate.
+   - `SOURCE_CONTENT_NOT_PUBLIC` → Toast `"이 콘텐츠는 이제 비공개예요"` + feed invalidate (rare timing edge).
```

```diff
Patch 2 — app-004 L63: Toggle 위치를 prototype canonical 에 정렬
@@ Done Criteria: app-004 @@
-- [ ] 세로 스와이프 하단 CTA 영역 좌측/상단에 iOS-style Switch 51×31 (Android Material 32×20 보조).
+- [ ] 세로 스와이프 하단 `cta-footer` 내부에 `PublishToggleRow` (direction=horizontal, space-between, padding 8×4) 를 CTA 버튼 **위쪽** 에 배치. row 구조: `PublishLabel ("게시", left)` + `PublishSwitch (iOS-style 51×31, right)`. (Prototype `PublishToggle.spec.md` canonical SSOT). Android Material 32×20 은 플랫폼 가드시 보조.
+- [ ] 타 유저 콘텐츠 (`isOwn === false`) 에서 `PublishToggleRow` 자체 unmount (null 렌더).
```

```diff
Patch 3 — Verification Method: dead-hook grep 게이트 추가
@@ Verification Method > Active Evaluation Techniques @@
+ 9. **Dead hook detection (Group 001 Lesson #3)**:
+    - `rg "useUpdateMeContentVisibilityUseCase\(" app/apps/MemeApp/src --glob '*.tsx' --glob '*.ts'` → **≥ 1 hit** (PublishToggle 컴포넌트 내).
+    - `rg "useDeleteMyContentUseCase\(" app/apps/MemeApp/src --glob '*.tsx' --glob '*.ts'` → **≥ 1 hit** (DeleteConfirmSheet 컴포넌트 내).
+    - 0 hit 시 Major — Hook 이 export 만 되고 실제 호출되지 않음 (dead method).
```

```diff
Patch 4 — Cross-component 범위 전수 명시 (Group 001 Lesson #2)
@@ Cross-group Integration @@
+ ### FeedItemEntity 확장 영향 범위 (Group 002 내부 전수)
+ 본 그룹의 entity 확장은 다음 **3 SwipeFeed 진입 path** 에서 동일 `meme.mapper.ts` 를 경유한다:
+   (a) MY profile 3-tab 진입 (kind=me, visibility=public|private|liked)
+   (b) ProfileToSwipeFeed (kind=user, userId)
+   (c) legacy 홈 필터 진입 (targetId, type, entryPoint)
+ 각 path 의 queryFn 이 동일 mapper 를 사용하여 5 신규 필드 (likeCount, liked, regenerateCount, sourceContentId, isCustomPrompt) 를 제공함을 trace. 어느 path 에서도 `undefined` 필드로 인한 런타임 zod 파싱 실패 없음.
```

```diff
Patch 5 — app-002 invalidate QueryKey 상수 명시 + isCustomPrompt undefined fallback
@@ Done Criteria: app-002 @@
-- [ ] 성공 시 React Query invalidate (meme-feed, me-contents, counts). Toast `"삭제됐어요"`.
+- [ ] 성공 시 React Query invalidate 대상: `MEME_QUERY_KEYS.feed.*`, `ME_CONTENTS_QUERY_KEYS.list`, `ME_CONTENTS_QUERY_KEYS.counts` 전 3 키 (meme.query-key.ts / me-contents.query-key.ts 상수 기준, `invalidateQueries` 호출부 grep 으로 검증). Toast `"삭제됐어요"`.
+- [ ] `item.isCustomPrompt` 가 undefined 일 가능성 방지: Zod 스키마에서 `isCustomPrompt` 필수 boolean 강제 (app-001 매퍼). 런타임 파싱 실패 시 해당 item 은 feed 에 포함되지 않음 (fallback 도달 불가).
```

```diff
Patch 6 — app-004 optimistic update 명시
@@ Done Criteria: app-004 @@
-- [ ] 취소 시 상태 원복 (optimistic update 사용 시 rollback).
+- [ ] Optimistic update 필수: 탭 직후 toggle 상태 즉시 전환 (UI feedback), mutation onError 시 이전 상태로 rollback. 테스트: `rejected` mock 주입 시 최종 렌더 상태 = 이전 상태 (jest spy 또는 RTL).
```

---

## Round 2 합의 조건

Round 2 APPROVE 를 위한 최소 조건:

1. **M1 해소**: app-003 의 `SOURCE_CONTENT_DELETED` UI = Modal 로 통일, `SOURCE_CONTENT_NOT_PUBLIC` = Toast. 두 errorCode 분기 테이블 명시.
2. **M2 해소**: app-004 Toggle 위치 = "CTA 위쪽 row (space-between)" 로 prototype canonical 명시 + 타 유저 unmount 명시.
3. **M3 해소**: Verification Method 에 `useUpdateMeContentVisibilityUseCase` / `useDeleteMyContentUseCase` callsite grep ≥ 1 게이트 추가.
4. **M4 해소**: Cross-component 범위로 SwipeFeed 3 variant 진입 path 를 전수 나열 + 동일 mapper 경유 trace 의무.

**Minor (m1~m5)** 는 Round 2 에서 반영 권고, 미반영 시에도 Round 2 APPROVE 가능 (rubric C4 — verdict 비블로킹). 단 m2 (isCustomPrompt undefined) 와 m4 (optimistic update 명시) 는 구현자 해석 자유도를 줄이기 위해 반영 선호.

**KB Pattern 연결**:
- M3 → `completeness-008` 후보 신설 (dead-hook grep 게이트 의무) — KB 승격 고려.
- M4 → `completeness-007` v2 보강 (prop threading 뿐 아니라 mapper/entity cross-variant 전수 나열).

---

## Sign-off (Round 1)

- Evaluator: **ISSUES**
- Date: 2026-04-23
- Next step: Sprint Lead (or Generator) 가 Patches 1~4 (최소) 반영 → Round 2 재검토.

---

## Round 2 Review (2026-04-23)

> Reviewer: Evaluator (Claude Opus 4.7)
> Input: `contracts/group-002.md` Round 2 submission (Patches 1~6 applied) + Round 1 review.

### Patch Verification

| Concern | Round 1 | Resolution | Verdict |
|---------|---------|------------|---------|
| Major #1 — SOURCE_CONTENT_DELETED UI 통일 | ISSUES (Toast vs Modal 모순) | L57 (`FilterDeletedErrorModal` + invalidate) + L61-63 errorCode 분기 테이블 (DELETED → Modal, NOT_PUBLIC → Toast) 명시. Modal SSOT 선언. | ✓ resolved |
| Major #2 — PublishToggle canonical 위치 | ISSUES ("좌측/상단" either/or) | L66 "CTA 버튼 **위쪽** 에 배치", direction=horizontal, space-between, `PublishLabel` left + `PublishSwitch` right. L67 `isOwn === false` 시 row 전체 unmount. Prototype spec SSOT 연결. | ✓ resolved |
| Major #3 — Dead-hook grep 게이트 | ISSUES (Verification Method gap) | Verification Method #8 (L131-134) 에 `useUpdateMeContentVisibilityUseCase` / `useDeleteMyContentUseCase` callsite grep **≥ 1 hit** 게이트 명시. 0 hit 시 Major 판정. | ✓ resolved |
| Major #4 — Cross-variant entity 전수 | ISSUES (Group 001 Lesson #2 재발 위험) | L149-157 에 3 SwipeFeed 진입 path (a) MY 3-tab (b) ProfileToSwipeFeed (c) legacy 홈 전수 나열 + 동일 `meme.mapper.ts` 경유 trace Done Criterion. Zod 파싱 안전성 명시. | ✓ resolved |
| Minor m2 — isCustomPrompt undefined fallback | ISSUES | L45 Zod 필수 boolean 강제 + 파싱 실패 시 feed 제외 (fallback 도달 불가). | ✓ resolved |
| Minor m3 — QueryKey 상수 명시 | ISSUES | L44 `MEME_QUERY_KEYS.feed.*`, `ME_CONTENTS_QUERY_KEYS.list`, `ME_CONTENTS_QUERY_KEYS.counts` 3 키 상수 + `invalidateQueries` grep 검증. | ✓ resolved |
| Minor m4 — Optimistic update 필수화 | ISSUES | L73 "Optimistic update **필수**" + onError rollback + rejected mock 테스트 assertion 명시. | ✓ resolved |
| Minor m1 — telemetry enum source 경로 | advisory | Sprint Lead 자율 처리 명시 (L177), 구현자 판단 여지 OK. | △ deferred (non-blocking) |
| Minor m5 — typecheck baseline | advisory | Sprint Lead 자율 처리 명시, 기존 C7 v3 grep 방식 유지. | △ deferred (non-blocking) |

### Resolution Summary

- **Major**: 4/4 resolved (100%)
- **Minor**: 3/5 resolved (m2/m3/m4), 2 deferred as non-blocking (m1/m5 — rubric C4 verdict 비블로킹)
- **Critical**: 0 (unchanged)

### Remaining Concerns

없음. Patches 1~6 가 Round 1 합의 조건 (M1~M4 필수 + m2/m4 선호) 을 모두 충족. Minor m1/m5 의 자율 처리는 rubric 에 부합하며 구현 시 typecheck diff 검토는 Evaluator 가 임계값 없이 판단 가능.

**KB Pattern 승격 제안 (구현 후 확정)**:
- `completeness-008` (신설 후보): Dead-hook callsite grep ≥ 1 게이트 의무화 (Group 001 Lesson #3 + Group 002 M3 — 2회 누적).
- `completeness-007` v2 보강: Cross-variant mapper/entity 전수 나열 (Group 001 Lesson #2 + Group 002 M4 — 2회 누적).

### Final Verdict: **APPROVE**

## Sign-off (Round 2)

- Evaluator: **APPROVE**
- Date: 2026-04-23
- Rationale: Patches 1~6 가 Round 1 ISSUES 4 Major + 3 Minor 를 모두 해소. 잔여 Minor 2 건은 비블로킹 조항으로 자율 처리 허용. Contract 는 구현자 해석 폭 없이 진행 가능한 수준에 도달.
- Next step: Sprint Lead 가 구현 단계 (Generator) 착수 → phase-build 실행.
