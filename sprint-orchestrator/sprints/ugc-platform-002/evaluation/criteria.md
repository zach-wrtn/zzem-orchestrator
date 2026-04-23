# Evaluation Criteria — Sprint ugc-platform-002

> Phase 2 (Spec) 산출물. Evaluator 의 active evaluation 기준 프레임워크.
> Base: KB rubric v3 (active, `learning/rubrics/v3.md`). 충돌 시 본 로컬 criteria 우선.
> Follow-up: ugc-platform-001 retrospective (pattern-digest, deferred-items) 반영.

## Rubric Ingestion (필수 선행)

Evaluator 는 평가 시작 시 다음 순서로 로드:
1. `knowledge-base/rubrics/v3.md` (status=active) — C1~C13 clauses.
2. 본 파일 (로컬 criteria) — Phase 2 specific checks.
3. `contracts/api-contract.yaml` — SSOT for endpoints/fields.
4. 해당 그룹의 Sprint Contract (`contracts/group-{N}.md`) — Phase 4 에서 생성.

## Grading Dimensions

| 기준 | 가중치 | 설명 |
|------|--------|------|
| **Correctness** | 높음 | 페이백 수식, visibility rule, cursor 규약 |
| **Completeness** | 높음 | 모든 AC testable, 진입점 연결, 호출부 전수 |
| **Integration** | 높음 | api-contract 필드명/enum, BE/FE 응답 일치, errorCode |
| **Edge Cases** | 중간 | 페르소나 skip, self-regeneration skip, custom-prompt block, 삭제된 source |
| **Code Quality** | 낮음 | 기존 패턴 준수, Clean Architecture 경계 |

## Severity Classification

| Severity | 정의 | 본 스프린트 예시 |
|----------|------|------------------|
| **Critical** | 기능 불가, 데이터 손상, 페이백 금액 오류, 페르소나 지급 | 페이백 계산 수식 오류, Unconditional 페이백 지급, Custom-prompt 공개 성공 |
| **Major** | AC 미충족, 회귀 | 좋아요 탭 empty 유지, CTA 분기 누락, sourceContentId 미전달, likeCount 축약 |
| **Minor** | 코드 품질 | unused import, 비필수 테스트 누락 |

## Verdict Rules (rubric C1)

- **PASS**: Critical 0, Major 0
- **ISSUES**: Critical 0, Major 1+
- **FAIL**: Critical 1+ 또는 Major 3+

## Evaluator Calibration

### Skepticism Anchors

```
당신은 버그 헌터다. 코드 리뷰어가 아니다.

- 구현이 완벽해 보여도 페이백 수식은 실제 계산 trace
- "페르소나 skip 됐을 것"이라 가정하지 말고 IF 조건 실제 경로 확인
- CTA 분기는 소유자 비교 코드 경로 직접 추적 (happy path 말고 owner===viewer)
- 좋아요 카운트가 축약되지 않았는지 렌더링 코드 확인 (korean-count import 금지)
- "존재"와 "올바른 동작"은 다르다
```

### Anti-Patterns to Avoid

- 페이백 event listener 파일 존재만 확인하고 VERIFIED
- 이슈 나열 후 "전반적으로 잘 구현" 으로 결론
- `sourceContentId` 전달 "되는 것 같다" 로 넘김 — 실제 navigate payload trace 필수
- Cursor 쿼리에서 `$lt` 놓침 (rubric C10 — grep 의무)
- Like toggle 의 enabled gate 간과 (rubric C12)

## KB-Calibrated Checks (from ugc-platform-001 + accumulated KB)

다음 패턴은 frequency / severity 기준으로 본 스프린트 평가에 자동 반영된다.

### correctness-004 (freq 2, major) — Cursor `$lte` 의무
- Detection: `rg '_id:\s*\{\s*\$lt\s*:' backend/apps/meme-api/src/persistence/**/*.repository.ts` → 0 hit
- Contract clause: Cursor repository 쿼리는 반드시 `$lte`. CursorResponseDto 규약 정합 필수.
- 본 스프린트 적용: be-004 의 liked list cursor 쿼리 신설 시 의무. Content.repository 의 기존 `$lt` 는 본 스프린트 scope 아니나, 신규 코드 추가 시 동일 패턴 지양.

### completeness-003 (freq 2, major) — Route param 타입 변경 callsite 전수
- Detection: `navigation.navigate('FilterPreview', ...)` 전수 grep. `sourceContentId` 파라미터 추가 후 TS2353 regression 0.
- Contract clause: Route types / NavigatorScreenParams 변경 시 전수 callsite 체크.
- 본 스프린트 적용: app-003 route 확장 시 모든 호출부 점검. FE typecheck `grep -v '@wrtn/'` clean.

### completeness-005 (freq 1, major) — nx e2e testMatch
- Detection: `nx test meme-api-e2e --listTests | grep {신규-spec}` → 포함
- Contract clause: 신규 e2e-spec.ts 추가 시 project.json::test-e2e + jest-e2e.json::moduleNameMapper 검증.
- 본 스프린트 적용: be-001, be-002, be-003, be-004 모두 신규 e2e 예상. harness 실행 확인 필수.

### completeness-006 (freq 1, major) — enabled gate
- Detection: discriminated union / parent-dependent query 의 각 variant 에서 `enabled` 옵션 존재 + 내부 path.
- Contract clause: Discriminated union / parent-dependent query 는 `enabled` 가드 필수.
- 본 스프린트 적용:
  - app-006 liked variant 의 SwipeFeed queryFn — 다른 variant 에 영향 없도록 enabled gate.
  - app-005 like toggle mutation 은 mutation 이라 enabled 무관 — single-path.

### completeness-007 (freq 1, major) — prop threading
- Detection: Navigate payload 가 parent context 의존 시 prop / context 로 전달되는지 수동 trace.
- Contract clause: Navigate payload 가 parent context (현재 탭, 소유자 등) 의존 시 prop threading 경로 Done Criterion 명시.
- 본 스프린트 적용:
  - app-003 CTA 분기: `ownerId`, `sourceContentId` 가 SwipeFeed → ItemRenderer → CTA 컴포넌트까지 prop threading.
  - app-005 좋아요 카운트: `likeCount`, `liked` 가 FeedItemEntity 에서 LikeButton 까지.

### correctness-001 (freq 1, critical) — Cursor DTO 이중 래핑 금지
- Detection: Controller 가 Service 반환 `CursorResponseDto` 를 재래핑 여부.
- 본 스프린트 적용: be-004 liked list controller, 기존 me-contents 응답 확장 시.

### integration-001 (freq 1, critical) — BE/FE 필드명 일치
- Detection: api-contract 의 필드명 `list`, `nextCursor`, `likeCount`, `liked`, `regenerateCount`, `sourceContentId`, `isCustomPrompt` 가 BE 응답 + FE mapper 전수 일치.
- 본 스프린트 적용: app-001 mapper 확장 후 zod 로 runtime 검증 + BE response snapshot test.

## Group-Specific Criteria

### Group 001 — Backend (be-001 ~ be-004)

**be-001 (Visibility toggle)**:
- PATCH endpoint 본인 소유 검증 (403 on foreign), custom-prompt block (409 with errorCode).
- 멱등 동작 (같은 상태 재요청 → 200).
- Soft-deleted 콘텐츠 → 404.
- 공개→비공개 전환 시 payback 회수 경로 **미발동** (CreditWallet 변화 없음 — negative test).

**be-002 (Regeneration tracking)**:
- `sourceContentId` path validation:
  - non-existent → 400 errorCode=SOURCE_CONTENT_DELETED
  - soft-deleted → 동일
  - isPublished=false → 400 errorCode=SOURCE_CONTENT_NOT_PUBLIC
- regenerateCount 증가는 원본 1개에만 (체인 transitive 없음 — A→B→C 테스트).
- Profile `regeneratedCount` 가 aggregate 합산 (hardcoded 0 탈출 확인).

**be-003 (Payback trigger)**:
- 계산 수식: `ceil(creditUsed * PAYBACK_RATE)` — Env override 동작 검증.
- 페르소나 skip: UserProfile.type === INTERNAL → CreditHistory 엔트리 미생성.
- Self-regeneration skip: caller === content owner → 엔트리 미생성.
- Idempotency: 동일 이벤트 중복 발화 → 단일 엔트리만 생성.
- Credit source=PROMOTION, transactionType=PAYBACK, title="크레딧 페이백" 정확.
- 비공개 전환 후 CreditWallet 변화 없음 (negative test).
- 공개 콘텐츠 삭제 후 CreditWallet 변화 없음.

**be-004 (Likes)**:
- Unique index `(userId, contentId, deletedAt)` 존재.
- POST 멱등: 이미 좋아요 상태 재호출 → 200, likeCount 변화 없음.
- DELETE 멱등: 좋아요 안 한 상태 호출 → 200, liked=false.
- Self-like 성공.
- `visibility=liked` 실제 리스트 + cursor `$lte` 쿼리 확인 (rubric C10).
- 응답 `ContentSummary.likeCount`, `liked` 필드 정확 (BE 는 caller 기준 liked 판정).
- counts 응답의 `liked` 실제 값 반영.
- 비공개 전환/삭제 콘텐츠 → liked 리스트에서 제외, 단 Like 레코드는 유지.
- 추천 시스템 이벤트 publish 지점 확인.

**공통 (rubric C10, C11)**:
- `rg '_id:\s*\{\s*\$lt\s*:' apps/meme-api/src/persistence/` 신규 hit 0.
- `nx test meme-api-e2e --listTests | grep <new-spec>` 모두 포함.
- `yarn lint` + `yarn typecheck` 신규 에러 0.

### Group 002 — App 피드 인터랙션 (app-001 ~ app-004)

**app-001 (액션 바)**:
- 4 버튼 (좋아요/재생성/공유/더보기) 순서 정확.
- 좋아요 카운트 **실제 숫자** (korean-count 미적용 — import 안 되어야 함).
- 재생성 카운트 **축약** (korean-count 적용).
- 댓글 버튼 **미노출** (grep 으로 comment 관련 UI 0).
- `FeedItemEntity` 에 신규 필드 모두 존재 + zod 검증.

**app-002 (더보기 + 삭제)**:
- 소유자 분기 (내 vs 타) 3메뉴 정확.
- 삭제 확인 팝업 노출 → 확정 시 BE DELETE endpoint 정확 호출 (filter vs custom-prompt 분기).
- 신고하기는 Phase 3 placeholder (Toast / hide — Prototype 확정).
- React Query invalidate 확인 (피드/counts).

**app-003 (CTA 분기)**:
- `ownerId === currentUserId` 분기 정확 (happy path 말고 owner 일 때).
- `sourceContentId` 가 generate API body 로 전달 (network trace).
- Legacy 홈 필터 진입 경로는 `sourceContentId` 미전달 (회귀 없음).
- MIXED 필터 프리뷰 경유 유지.
- 삭제된 필터 에러 모달 노출.
- `SOURCE_CONTENT_DELETED`, `SOURCE_CONTENT_NOT_PUBLIC` 에러 핸들링 (Toast + invalidate).
- route types 확장 후 `grep -v '@wrtn/'` typecheck clean.

**app-004 (게시 토글)**:
- 소유자 분기 (내 콘텐츠만 토글).
- OFF→ON (일반): 즉시 PATCH + Toast.
- OFF→ON (custom-prompt): API 미호출 + 안내 토스트 문구 정확.
- ON→OFF: BottomConfirmSheet → 확정 시 PATCH.
- 취소 시 상태 원복 (optimistic update 있으면 rollback).
- 409 CUSTOM_PROMPT_PUBLISH_BLOCKED defensive 처리.

**Prop threading (rubric C13)**:
- Owner 비교는 parent state (currentUser) 를 item 레벨까지 threading.
- `isCustomPrompt`, `isPublished` 가 FeedItemEntity 에서 CTA/ToggleButton 까지.

### Group 003 — App 좋아요 + 페이백 + 정리 (app-005 ~ app-009)

**app-005 (좋아요)**:
- 훅이 be-004 endpoint 호출 (network trace).
- 카운트 실제 숫자 렌더 (`likeCount.toString()` 또는 `Intl.NumberFormat`. korean-count 금지).
- 그리드 카드 + 세로 스와이프 양쪽 노출.
- Self-like 동작 (owner === viewer 시 +1).
- Optimistic update + error rollback.

**app-006 (좋아요 탭)**:
- `isLikedPhase1` 제거 (grep).
- `/v2/me/contents?visibility=liked` 실제 호출.
- 빈 상태 → ProfileEmptyState.
- 그리드 카드 탭 → SwipeFeed liked variant 진입.
- SwipeFeed liked variant 의 enabled gate (rubric C12).

**app-007 (페이백 모달)**:
- 최초 공개 시 모달 노출 + flag set.
- 2회차 공개 시 미노출 (flag true 확인).
- 비로그인 skip.
- 문구 PRD 직역 확인.

**app-008 (크레딧 히스토리 페이백 row)**:
- `transactionType === 'PAYBACK'` variant 렌더.
- title, thumbnail, amount 정확.
- 기존 타입 회귀 없음.
- Zod enum 확장 검증.

**app-009 (Deferred items)**:
- Sub-fix 1: Home gear 제거 (or PRD 확인 후 유지 결정 record).
- Sub-fix 2: landingTab race 해소 — 1회 sync flag.
- Sub-fix 3: Clipboard import 전수 치환.
- Sub-fix 4: initialContentId fallback → findIndex() >= 0 ? i : 0.

## Active Evaluation Techniques

1. **Trace Execution** — Happy path 가 아닌 edge 를 따라가라
   - 페이백: 페르소나 콘텐츠 재생성 → CreditHistory 쿼리 결과 0건 assert.
   - Self-regeneration → CreditHistory 0건.
   - Custom-prompt 공개 시도 → 409 CUSTOM_PROMPT_PUBLISH_BLOCKED trace.
   - 좋아요 탭 empty → 실제 BE 호출 (seed 없음) → 빈 응답 렌더.

2. **Grep for Regressions**
   - `rg '_id:\s*\{\s*\$lt\s*:' apps/meme-api/src/persistence/` → 신규 hit 0.
   - `rg "from 'react-native'" | rg Clipboard` → 0 (app-009 Sub-fix 3).
   - `rg 'koreanCount' (likes 렌더 부근)` → 0 (AC 3.3 축약 금지).

3. **Type Diff** — `ContentSummary` 필드 누락 여부 확인 (`likeCount`, `liked`, `regenerateCount`, `sourceContentId`, `isCustomPrompt`).

4. **Deadhook / Dead Endpoint Detection**
   - `useUpdateMeContentVisibilityUseCase` 호출부 grep → 0 이면 dead.
   - `POST /v2/contents/:id/likes` controller → app에서 실제 호출 trace (네트워크 로그).

5. **Contract Clause Echo** — 각 Done Criterion 이 실제 코드에서 구현된 라인/파일 레퍼런스 증거 형식으로 제시.

6. **E2E Flow Assertion** — `contracts/e2e-flow-plan.md` 에 매핑된 flow 실제 통과 확인 (Phase 4 그룹 스모크 게이트).

7. **FE Typecheck Clean Measure** (rubric C7 v3)
   - `cd app/apps/MemeApp && yarn typescript 2>&1 | grep -v '@wrtn/' | grep 'error TS'` → 본 그룹 신규 에러 0.

## Context Pressure Behavior

- 🟡 Caution: Minor 이슈는 보고하되 verdict 영향 없음 (rubric C4).
- 🔴 Urgent: Critical 만 검증.

## Deferred AC 수동 QA (Phase 5 전)

Phase 5 PR 제출 전 다음 수동 QA 체크리스트를 실행 (deferred from ugc-platform-001):

- [ ] **AC-2.3 (Phase 1)**: 프로필 공유 native 시트 — iOS + Android 양쪽에서 공유 시트 동작 + zzem://profile/{userId} 포함 확인.
- [ ] **AC-7.4 (Phase 1)**: 404 에러 화면 — 임의 userId 로 딥링크 진입 → ErrorNotFound 렌더 확인.

Phase 6 retrospective 에서 위 두 항목의 fulfillment 상태를 최종 판정.
