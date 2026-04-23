# Group 001 Contract Review (Round 1)

> Reviewer: Evaluator (Phase 4 Round 1)
> Reviewed at: 2026-04-22
> Contract version: draft (Sprint Lead 2026-04-23)
> Base: api-contract.yaml v0.2.0-ugc-platform-002, rubric v3, Phase 1 retrospective

## Verdict: ISSUES

Contract 의 전반 scope 는 AC 와 일치하나, 구현 시 ambiguity/미검증 엣지 케이스로 인해 평가 단계에서 혼선 또는 feature stubbing 이 발생할 가능성이 있는 항목들이 존재한다. 특히 be-003 의 `creditUsed` 출처, thumbnail 정책, idempotency key composition, be-002 의 profile aggregation 범위, be-004 의 cursor 구조/counts 계산 규칙이 Round 2 sign-off 전 확정되어야 한다.

Count summary — Critical 0 / Major 7 / Minor 8

## Issues Found

### Critical (contract가 논리적으로 동작 불가)

없음.

### Major (AC testability 결함, 엣지 케이스 누락, 검증 방법 모호)

| # | Type | Done Criterion 라인 | Issue | Suggested Fix |
|---|------|--------------------|-------|---------------|
| 1 | ambiguity | be-002 라인 30 (`SOURCE_CONTENT_DELETED`) | "`sourceContentId` 가 없는 콘텐츠 / soft-deleted" 라는 표현이 두 가지 중의적 해석 가능: (a) sourceContentId 가 존재하지 않는 (없는) 콘텐츠 id, (b) sourceContentId 필드 자체가 null. Task file (001-* 라인 43) 은 "해당 콘텐츠 조회. 존재하지 않으면" — 즉 non-existent 또는 soft-deleted 라는 의미. Contract 표현 수정 필요. | `sourceContentId 가 존재하지 않는 id (non-existent) 또는 soft-deleted 된 Content/CustomPromptContent → 400 SOURCE_CONTENT_DELETED` 로 재기술. |
| 2 | untestable | be-003 라인 36 (creditUsed) | "재생성자가 소비한 크레딧 (`creditUsed`)" 의 출처가 명시되지 않음. ContentGeneration 완료 이벤트 payload 에 존재한다고 가정하지만, task 파일 (003-* 라인 79) 이 "payload 에 없으면 `CreditProductPlanDomainService` 참조" 로 서술 — 즉 존재 미확정. Evaluator 가 수식 trace 할 때 어떤 값이 `creditUsed` 인지 확정 불가. | Done Criterion 에 "Event payload 에 `creditUsed` 필드 존재 or CreditProductPlanDomainService 단일 경로 조회 중 어느 하나 SSOT" 를 명시. V-method 에 payload 경로 trace 테스트 추가. |
| 3 | ambiguity | be-003 라인 39 (thumbnailUrl) | Task 파일 내부 모순: 라인 49 는 "재생성된 신규 콘텐츠의 thumbnail" 로 시작했다가 라인 50 에서 "현 시점 SSOT: 원본 콘텐츠 thumbnail" 로 번복. Contract 는 "원본 content.thumbnailUrl" 로 확정했으나, 구현자가 task 파일 라인 49 를 먼저 읽고 혼란 가능. Phase 2 checkpoint 역시 "원본" 으로 기재. Active Evaluation #1 trace 때 평가자 혼선 위험. | Contract 에 "(SSOT: 원본 Content.thumbnailUrl — task 파일 라인 49 본문 해석 모호함 무시)" 주석 추가. 또는 원본 task 파일의 모순 문구를 정정 (task file amendment). |
| 4 | ambiguity | be-003 라인 40 (idempotency key) | "동일 contentId + sourceContentId 조합" 에서 `contentId` 가 (a) 재생성된 신규 콘텐츠 id 인지 (b) CreditDetailHistory 내부 저장된 어떤 contentId 인지 불분명. 실제 중복 방지를 위해서는 `(newContentId, sourceContentId)` 가 맞으나, 현재 문장은 `(contentId, sourceContentId)` — 둘 다 원본/신규 둘 중 하나로 해석 가능. | `동일 (newContentId, sourceContentId) tuple 에 대해 CreditDetailHistory 에 이미 PAYBACK 엔트리 존재 시 skip` 로 명시. V-method 에 중복 트리거 시나리오 (동일 이벤트 2회 dispatch → CreditHistory count === 1) 추가. |
| 5 | missing-edge | be-002 라인 33 (profile regeneratedCount) | Aggregation 범위 미정: caller 소유 콘텐츠 전체 (public+private+soft-deleted) 합산 vs public 만. 사용자가 public 으로 재생성 받다가 비공개 전환 시 regenerateCount 유지되나 response 에 포함되어야 하는지 판단 필요. PRD AC (프로필 "재생성된" 카운트) 의 UX 의미상 **공개 시절 값 포함** 이 자연스럽지만, 구현자 해석 여지 큼. | Done Criterion 에 "aggregation 범위: `userId=caller, deletedAt=null` (공개/비공개 무관, soft-delete 제외)" 명시. Public-only 해석이라면 추가 `isPublished=true` 필터 명기. |
| 6 | missing-edge | be-004 cursor ($lte) 라인 76 | 단순 `_id: $lte` 만 언급. 하지만 task file (004-* 라인 104) + checkpoint 라인 67 은 **compound cursor** `(liked_at DESC, _id DESC)` — 동일 timestamp 동점자 해소 2차 정렬. 단일 `_id $lte` 만으로는 같은 liked_at 에서 누락 가능. | Contract 에 "Cursor 쿼리는 `(liked_at, _id) <= (cursorLikedAt, cursorId)` compound `$lte` (rubric C10 compound 케이스)" 로 확정. V-method 에 동일 timestamp 2건 seed + limit 1 edge case 추가. |
| 7 | untestable | be-004 라인 54 (counts.liked) | "hardcoded 0 탈출" 만 요구. 실제 계산 규칙이 명시되지 않음. Task file (004-* 라인 72) 은 "Like 컬렉션의 caller userId 기준 count. soft-delete / 비공개 / 삭제 콘텐츠 제외" — 이는 Content/CustomPromptContent 양쪽 lookup join 을 요구. 이 join 이 구현되지 않으면 counts 가 실제로 리스트 응답보다 많게 나올 수 있음 (inconsistency). | Done Criterion 에 "`counts.liked` === `GET /v2/me/contents?visibility=liked` 전체 페이지 합계 (consistency invariant)" 추가. V-method seed 3 like + 1 unpublish + 1 delete → counts.liked === 1 assert. |

### Minor (스타일, 명확성, 보강 제안)

| # | Type | Line | Issue | Suggested Fix |
|---|------|------|-------|---------------|
| M1 | clarity | be-001 멱등 (contract 라인 23, task 라인 40) | "추가 DB 쓰기 없어도 OK" — 관찰 불가능한 내부 동작. 응답 200 + 상태 동일 만 테스트 가능. | Done Criterion 에는 외부 관찰 가능한 것 (status, response body) 만 남기고 DB 쓰기 skip 은 implementation hint 로 이동. |
| M2 | missing-edge | be-001 (contract 없음, task 라인 49) | Task 의 `isPublished` 필수 + boolean 타입 validation (400) 이 Contract Done Criteria 에 미반영. | Contract 에 "`isPublished` 누락/비-boolean → 400" 추가. |
| M3 | missing-edge | be-002 라인 32 (체인 transitive 없음) | A→B→C 3단계 테스트가 task AC (002-* 라인 69) 에는 있으나 contract V-method 에 명시 없음. | Active Evaluation 에 "Trace — Chain Transitive: seed A(src=null) → B(src=A) → C(src=B) regenerate 완료 → A.regenerateCount === 1 (변화 없음)" 추가. |
| M4 | missing-edge | be-003 PAYBACK_RATE boundary | Rate=0 / 음수 / 1 초과 시 동작 미정. MVP 에서는 env 신뢰 가정이지만 방어적 검증 권장. | Minor: "PAYBACK_RATE ≤ 0 시 skip, > 1 시 허용" (기본 위임 OK). 테스트는 필수 아님. |
| M5 | missing-edge | be-004 Like + soft-deleted content | Content soft-delete 후 POST `/v2/contents/:id/likes` → 404 인지 200 + 기록 인지 불분명. Task 라인 46 은 "콘텐츠 없음: 404" 인데 soft-deleted 도 포함되는가? | V-method 에 "soft-deleted content 에 like toggle 시도 → 404" edge 추가. |
| M6 | missing-edge | be-004 Self-unlike | "Self-like 성공 + likeCount +1" 는 있으나 self-unlike (→ likeCount -1) 미명시. | Done Criterion 에 "Self-unlike → likeCount -1 확인" 추가. |
| M7 | clarity | be-004 추천 이벤트 | Contract 라인 56 "EventBus publish 지점 확인 (EventBus spy)" — EventBus 구현체/이벤트 이름 미확정 (`like.created`/`like.removed` 는 task 만). 본 이벤트의 payload shape 도 미정. | Contract 에 "EventBus.publish 호출 존재 + eventName 이 `like.created` / `like.removed` 중 하나 + contentId payload 포함" 명시. 실제 consumer 는 scope 외 라는 주석 재확인. |
| M8 | scope | Phase 1 Regression Guard (contract 라인 58–64) | AC 7.5 등 grep/snapshot 검증 방법이 "유지" 로만 서술. 실제 verification path 비명시. | "Phase 1 AC 7.5 검증: `rg 'isPersona' apps/meme-api/src/application/me-users/dto/public-profile-response.dto.ts` → 0 hit. `/v2/me/profile` 응답에 `isPersona` 필드 존재 (e2e snapshot)." 추가. |

## Specific Concerns

### be-001 Visibility Toggle

- [x] custom-prompt 판정 로직: Content vs CustomPromptContent 별도 컬렉션인지, Content.type 필드인지 — 구현 모호. **허용 가능 (engineer latitude)**. 단 be-002 와 판정 helper 공유를 Cross-task Integration 에서 명시한 점은 OK. Round 2 에서 구현 경로 확정 (Contract 는 양쪽 허용).
- [ ] Cross-collection lookup 성능/일관성: 단일 PATCH endpoint 호출당 1회 resolve 이라 성능 우려 낮음. OK.
- [ ] `isPublished` validation (400) AC 누락 — Minor M2.
- [ ] 멱등 동작의 외부 관찰 criterion 모호 — Minor M1.
- [ ] ContentSummary 응답의 신규 필드 포함 criterion 명시되어 있음 (Good). Phase 1 소비자의 optional 처리 보장은 checkpoint §Regression 에서 대체 확인 가능.

### be-002 Regeneration Tracking

- [x] ContentGeneration "완료 이벤트" 정확한 진입점: task 파일 (002-* 라인 77) 이 "파이프라인의 완료 시점 훅 (event listener / domain service hook) 탐색" 로 engineer 에게 위임. Contract 도 "ContentGeneration 완료 훅 공유" (라인 116). **허용 가능** — 다만 실제 hook point 를 Evaluator 가 평가 단계에서 trace 할 수 있도록 Done Criterion 에 "hook 위치 파일:라인 제시 의무" 추가 고려.
- [ ] `regenerateCount` 동시성: MongoDB `$inc` atomic operator 사용 시 race 안전. Task hint (라인 78) 참조. Contract 에 `$inc` 명시 가능 (minor).
- [ ] Chain transitive 검증: Minor M3.
- [ ] Profile aggregation 범위: Major #5.
- [ ] regenerateCount 필드가 schema default=0 인데 Phase 1 legacy 문서 업데이트 migration 필요성 — 미명시. MongoDB 는 missing field = undefined → aggregate sum 시 0 처리 (정상). 단 TypeScript Mongoose schema 에 `default: 0` 확정이 필요한지 Contract 에 명시 (be-001 라인 45 이미 요구). 재확인 OK.

### be-003 Payback Trigger

- [x] PAYBACK transaction type enum 추가: task 라인 44 "없으면 추가" + checkpoint §Schema Extensions "PAYBACK 추가" — contract §Scope 에 "CREDIT_TRANSACTION_TYPE 확장 (PAYBACK)" 반영됨.
- [ ] creditUsed 출처 — Major #2.
- [ ] Idempotency key composition — Major #4.
- [ ] Self-regeneration 판정 기준: Task 라인 33 ("재생성자 본인 소유") = `caller userId === content.userId`. UserProfile level 아님 — 즉 캐시된 persona 계정이 본인 콘텐츠 재생성하면 self-regen skip 이 먼저 트리거 (persona skip 전에) — 판정 순서 미정. Skip 조합에 따른 결과는 동일 (엔트리 미생성) 이라 critical 아님. Minor.
- [ ] Thumbnail 정책 — Major #3.
- [ ] Order of regenerateCount +1 vs payback: task 는 "권장 동일 listener" 수준. regenerateCount 는 항상 증가, payback 은 조건부 skip. Payback 실패 시 regenerateCount 롤백 여부 미정. 권장: Try/catch in same handler, payback failure 는 별도 로깅 후 regenerateCount 는 유지 (source of truth 유지). Contract 에 "payback 실패가 regenerateCount 를 롤백시키지 않음" 명시 권장. Minor.

### be-004 Likes

- [x] Like schema contentType discriminator: Content vs CustomPromptContent 참조. FK 없는 MongoDB 에서 integrity 보장: (a) Like insert 전 contentType 에 따라 ContentDomainService or CustomPromptContentDomainService 로 existence check (404 체크), (b) Content soft-delete 후 Like 존재하지만 리스트에서 제외. Contract 는 (b) 를 "Like 레코드 유지" 로 명시 OK. (a) 의 404 기준 contentType 미명시 — Minor M5.
- [ ] 추천 시스템 시그널 publish target — Minor M7.
- [ ] liked list 응답 liked=true 강제 — caller 자신의 좋아요이므로 자명. 이미 삭제된 like 레코드 (hard-delete) 는 조회되지 않음. 단 soft-delete 모델 선택 시 `deletedAt: null` 필터 누락 가능성 — Done Criterion 에 `deletedAt: null` 또는 hard-delete 일관 명시. Task 는 hard-delete 권장. 확정 필요 (minor).
- [ ] Counts.liked consistency — Major #7.
- [ ] Cursor compound — Major #6.
- [ ] Self-unlike — Minor M6.
- [ ] Unique compound index `{userId, contentId, deletedAt: null}` — partial filter index 로 구현해야 MongoDB 에서 deletedAt: null 조건이 unique 에 적용. Contract 는 "Unique compound index (userId, contentId, deletedAt)" 수준으로 평이함. V-method 에 `db.likes.getIndexes()` 확인 + partial filter (`deletedAt: null`) 옵션 검증 추가 고려. Minor.

## Regression Guard 검증 방법 평가

- Phase 1 AC 회귀 검증 방법이 "유지" 수준으로 추상적.
- 다음 구체화 요청:
  - AC 7.5 (isPersona 부재): `rg '\bisPersona\b' apps/meme-api/src/application/me-users/dto/public-profile-response.dto.ts` → 0 hit. MyProfile snapshot 에는 존재.
  - `/v2/me/contents?visibility=public`: Phase 1 e2e spec 재실행 (nx e2e listTests 포함 시 자동).
  - `/v2/users/:userId/contents` 에 `isPublished=true` 필터: 기존 repository 쿼리 변경 없음 grep (`rg 'isPublished: true' apps/meme-api/src/persistence/content/`).
  - `/v2/me/contents/counts` 응답 구조 (public/private/liked): OpenAPI schema 불변 assertion.
  - Content 생성/삭제 회귀: 기존 e2e 통과.
- 위 5 항목을 contract V-method 에 bullet 로 명시 권장.

## KB Pattern Adoption 검증

- **C10 ($lte)**: Contract V-method §공통빌드품질 에 `rg '_id:\s*\{\s*\$lt\s*:' apps/meme-api/src/persistence/` → 신규 hit 0 명시됨. Good. 단 compound cursor 케이스 (`(liked_at, _id)`) 에 대한 명시 부족 (Major #6).
- **C11 (nx e2e testMatch)**: Contract §Verification Method 에 `nx test meme-api-e2e --listTests | grep -E "(visibility|regenerate|payback|likes)"` 명시됨. Good. 단 project.json::test-e2e target + jest-e2e.json::moduleNameMapper 확인은 bullet 로 추가 권장 (Minor).
- **correctness-001 (Cursor DTO 이중 래핑)**: be-004 likes list controller 에만 적용 — Contract §KB Pattern Injection 에서 언급됨 (라인 123). V-method 에 직접 검증 bullet 부족. "Controller 는 Service 반환 CursorResponseDto 그대로 JSON.stringify — 재래핑 detect: `rg 'new CursorResponseDto' apps/meme-api/src/controller/` controller 레이어 hit 0" 추가 권장.
- **integration-001 (BE/FE 필드명 일치)**: likeCount, liked, regenerateCount, sourceContentId, isCustomPrompt, errorCode 언급됨. Group 001 은 BE only 라 타 그룹 (group-002/003) 의 mapper 와 matching 은 그쪽 contract 에서 재검증 예정. OK.
- **completeness-003 (Route param)**: BE only 라 해당 적음 — 본 그룹 적용 낮음. Contract 에서도 그렇게 명시. Good.
- **completeness-005 (e2e testMatch)**: 위 C11 과 중복. OK.

## Recommended Contract Patches

### Patch 1 — be-002 SOURCE_CONTENT_DELETED 의미 명확화 (Major #1)
```diff
- [ ] `sourceContentId` 가 없는 콘텐츠 / soft-deleted → 400 `SOURCE_CONTENT_DELETED`.
+ [ ] `sourceContentId` 가 존재하지 않는 id (non-existent) 또는 soft-deleted 된 Content/CustomPromptContent 대상 → 400 `SOURCE_CONTENT_DELETED`.
```

### Patch 2 — be-003 creditUsed SSOT 명시 (Major #2)
```diff
- [ ] 재생성 이벤트 (sourceContentId 있음) 시 페이백 크레딧 = `Math.ceil(creditUsed * PAYBACK_RATE)` 계산 (env `PAYBACK_RATE`, default 0.01).
+ [ ] 재생성 이벤트 (sourceContentId 있음) 시 페이백 크레딧 = `Math.ceil(creditUsed * PAYBACK_RATE)` 계산 (env `PAYBACK_RATE`, default 0.01).
+   - `creditUsed` SSOT: ContentGeneration 완료 이벤트 payload 필드. 부재 시 `CreditProductPlanDomainService.getConsumedCredit(contentId)` 단일 경로 참조. V-method 에 payload trace.
```

### Patch 3 — be-003 thumbnailUrl 확정 (Major #3)
```diff
- [ ] CreditHistory 엔트리: `title = "크레딧 페이백"`, `thumbnailUrl = 원본 content.thumbnailUrl`, ...
+ [ ] CreditHistory 엔트리: `title = "크레딧 페이백"`, `thumbnailUrl = 원본 Content.thumbnailUrl` (SSOT: 원본. task 003-* 라인 49 의 "재생성 결과물" 대안 해석은 무시. Prototype 단계에서 최종 확정 — 현재 SSOT 유지), ...
```

### Patch 4 — be-003 idempotency key (Major #4)
```diff
- [ ] Idempotency: 동일 contentId + sourceContentId 조합 → 중복 적립 없음 (CreditDetailHistory lookup).
+ [ ] Idempotency: 동일 `(newContentId, sourceContentId)` tuple 조합 → 중복 적립 없음. CreditDetailHistory 에 이미 PAYBACK 엔트리 존재 시 skip. V-method: 동일 generation 이벤트 2회 dispatch → CreditHistory count === 1.
```

### Patch 5 — be-002 profile aggregation 범위 (Major #5)
```diff
- [ ] `MyProfileResponse.regeneratedCount` / `PublicProfileResponse.regeneratedCount` 가 실제 소유 콘텐츠 합산값 반영 (hardcoded 0 탈출).
+ [ ] `MyProfileResponse.regeneratedCount` / `PublicProfileResponse.regeneratedCount` 가 `userId=caller, deletedAt=null` 조건의 소유 콘텐츠 `regenerateCount` 합산 (공개/비공개 무관, soft-delete 제외). hardcoded 0 탈출.
```

### Patch 6 — be-004 compound cursor (Major #6)
```diff
- [ ] `GET /v2/me/contents?visibility=liked` 실제 데이터 반환 (seed 기반 list 검증).
+ [ ] `GET /v2/me/contents?visibility=liked` 실제 데이터 반환. Cursor compound `(liked_at, _id)` 정렬 + `$lte` (rubric C10 compound case). V-method: seed 3 like (중 2개 동일 liked_at) + limit 2 → page 2 list.length === 1, nextCursor === null.
```

### Patch 7 — be-004 counts.liked consistency invariant (Major #7)
```diff
- [ ] `GET /v2/me/contents/counts.liked` 실제 값 (hardcoded 0 탈출).
+ [ ] `GET /v2/me/contents/counts.liked` === `GET /v2/me/contents?visibility=liked` 전체 페이지 합계 (consistency invariant). V-method seed: 3 like + 1 unpublish + 1 delete → counts.liked === 1.
```

### Patch 8 — Phase 1 Regression 구체 검증 방법
```diff
 ## Regression Guard (Phase 1 Inherited)
-- [ ] Phase 1 `MyProfileResponse.isPersona` 유지, `PublicProfileResponse.isPersona` 부재 유지 (AC 7.5).
+- [ ] Phase 1 `MyProfileResponse.isPersona` 유지, `PublicProfileResponse.isPersona` 부재 유지 (AC 7.5).
+   - `rg '\bisPersona\b' apps/meme-api/src/application/me-users/dto/public-profile-response.dto.ts` → 0 hit.
+   - `/v2/me/profile` e2e snapshot 에 `isPersona` 필드 존재 확인.
 ...
+- [ ] Phase 1 e2e spec (me-contents, me-profile, users-public) `nx test meme-api-e2e --listTests` 에 포함 유지 (Phase 1 Evaluator Round 1 regression 재현 방지).
```

### Patch 9 (Minor 일괄)
- M1: 멱등 criterion 을 외부 관찰 가능 한 response 200 + state 동일 로 재서술.
- M2: be-001 에 `isPublished` validation 400 criterion 추가.
- M3: be-002 에 Trace Chain Transitive (A→B→C) V-method 추가.
- M5: be-004 에 "soft-deleted content 에 like toggle 시도 → 404" 추가.
- M6: be-004 에 "Self-unlike → likeCount -1" 추가.
- M7: be-004 추천 이벤트 publish eventName + payload 명시.

## Round 2 합의 조건

다음 7 Major + 핵심 Minor 가 Round 2 sign-off 전 해결되어야 한다:

1. **Major #1** — be-002 `SOURCE_CONTENT_DELETED` 표현 재기술 (Patch 1).
2. **Major #2** — be-003 `creditUsed` SSOT 명시 (Patch 2).
3. **Major #3** — be-003 `thumbnailUrl` 확정 + task file 모순 해소 (Patch 3 + task-file amendment 검토).
4. **Major #4** — be-003 idempotency key tuple 명시 + V-method 검증 (Patch 4).
5. **Major #5** — be-002 profile aggregation 범위 명시 (Patch 5).
6. **Major #6** — be-004 compound cursor 구조 명시 (Patch 6).
7. **Major #7** — be-004 counts.liked consistency invariant + V-method (Patch 7).
8. **Minor M2, M3, M6, M7** — be-001 isPublished validation, Chain transitive trace, Self-unlike, 추천 이벤트 명세 — done criteria 또는 V-method 에 추가.
9. **Regression 구체화** — Patch 8 의 Phase 1 AC 7.5 grep + e2e listTests 포함 확인.

Round 2 제출 시 위 Patch 1~8 적용된 contract 를 기대함. 적용 확인 후 Evaluator 는 **APPROVE** 로 전환 가능.

---

## Sign-off (Round 1)

- Evaluator: ISSUES (Major 7 / Minor 8)
- Date: 2026-04-22
- Next: Sprint Lead 에게 Patch 1~9 반영 요청 → Round 2 review.

---

## Round 2 Review (2026-04-23)

> Reviewer: Evaluator (Phase 4 Round 2)
> Reviewed at: 2026-04-23
> Contract version: Round 2 submission (Patches 1~8 + Minor M1/M2/M3/M5/M6/M7 applied)

### Patch Verification

| Concern | Round 1 Major/Minor | Contract Line | Resolution | Verdict |
|---------|---------------------|---------------|------------|---------|
| #1 SOURCE_CONTENT_DELETED wording | Major #1 | be-002 line 31 | "sourceContentId 가 존재하지 않는 id (non-existent) 또는 soft-deleted 된 Content/CustomPromptContent 대상 → 400" — non-existent vs null 중의성 해소. Patch 1 주석 포함. | resolved ✓ |
| #2 creditUsed SSOT | Major #2 | be-003 line 38 | "ContentGeneration 완료 이벤트 payload 필드. 부재 시 CreditProductPlanDomainService.getConsumedCredit(contentId) 단일 경로 참조 — 둘 중 하나를 구현 시점에 확정. V-method 에 payload trace 증거 필수." — SSOT 2-tier fallback 명시. | resolved ✓ |
| #3 thumbnailUrl 확정 + SSOT 주석 | Major #3 | be-003 line 41 | "thumbnailUrl = 원본 Content.thumbnailUrl (SSOT: 원본. task 003-* 라인 49 의 '재생성 결과물' 대안 해석은 무시)" — task 파일 모순 명시적 무시. | resolved ✓ |
| #4 Idempotency tuple + V-method | Major #4 | be-003 line 42 | "동일 (newContentId, sourceContentId) tuple 조합 → 중복 적립 없음. CreditDetailHistory 에 이미 PAYBACK 엔트리 존재 시 skip. V-method: 동일 generation 이벤트 2회 dispatch → CreditHistory count === 1." — tuple + V-method 둘 다 포함. | resolved ✓ |
| #5 Profile aggregation 범위 | Major #5 | be-002 line 34 | "userId=caller, deletedAt=null 조건의 소유 콘텐츠 regenerateCount 합산 (공개/비공개 무관, soft-delete 제외). hardcoded 0 탈출." — 정확히 Patch 5 에 부합. | resolved ✓ |
| #6 Compound cursor + seed test | Major #6 | be-004 line 58 | "Cursor compound (liked_at DESC, _id DESC) 정렬 + $lte (rubric C10 compound case). V-method: seed 3 like (중 2개 동일 liked_at) + limit 2 → page 2 list.length === 1, nextCursor === null." — compound + tie-break seed 포함. | resolved ✓ |
| #7 counts.liked consistency | Major #7 | be-004 line 59 | "counts.liked === GET /v2/me/contents?visibility=liked 전체 페이지 합계 (consistency invariant). V-method seed: 3 like + 1 unpublish + 1 delete → counts.liked === 1." — invariant + seed 3가지 케이스 포함. | resolved ✓ |
| Patch 8 Regression 구체화 | Regression | lines 66-67, 72 | isPersona grep (`rg '\bisPersona\b' apps/meme-api/src/application/me-users/dto/public-profile-response.dto.ts → 0 hit`) + e2e snapshot + `nx test meme-api-e2e --listTests` 포함 assertion — 3 항목 모두 반영. | resolved ✓ |
| M1 멱등 외부 관찰 criterion | Minor M1 | be-001 line 24 | "외부 관찰 가능 criterion 만 검증 — Minor M1" 명시. | resolved ✓ |
| M2 isPublished validation 400 | Minor M2 | be-001 line 20 | "isPublished 누락 또는 비-boolean 타입 → 400 (validation, Minor M2)" | resolved ✓ |
| M3 Chain Transitive trace | Minor M3 | V-method line 88-91 | "Trace — Chain Transitive: seed A(src=null) → B(src=A) → C(src=B) regenerate 완료. A.regenerateCount === 1, B.regenerateCount === 1, C.regenerateCount === 0. transitive 증분 금지 검증." | resolved ✓ |
| M5 soft-deleted like toggle → 404 | Minor M5 | be-004 line 56 | "Soft-deleted content 에 like toggle 시도 (POST or DELETE) → 404 (Minor M5)" — POST+DELETE 모두 커버. | resolved ✓ |
| M6 Self-unlike likeCount -1 | Minor M6 | be-004 line 55 | "Self-unlike → likeCount -1 (Minor M6)" | resolved ✓ |
| M7 추천 이벤트 명세 | Minor M7 | be-004 line 61 | "EventBus.publish 호출 존재 + eventName 이 like.created / like.removed 중 하나 + contentId payload 포함. 실제 consumer 는 scope 외." | resolved ✓ |

### Additional Cross-check

- **Phase 1 Regression**: 기존 5 항목 유지 + Patch 8 신규 2 항목 (isPersona grep evidence + listTests 포함 assertion) 정상 반영.
- **be-003 추가 개선사항**: "Payback 실패가 regenerateCount 를 롤백시키지 않음" (line 43), "공개→비공개 전환 시 CreditWallet 회수 없음 negative test" (line 44), "삭제 후 회수 없음" (line 45) — Round 1 에서 언급된 order/rollback concerns 에 대한 보강 확인.
- **V-method 총 9 항목** (0~8 index): Trace 7 + Type Diff + Deadhook 모두 테스트 가능한 수준으로 구체화.
- **KB Pattern Injection**: 6 패턴 모두 명시적 injection (line 134-141) — correctness-001/004, completeness-003/005, integration-001, code_quality-001.

### Remaining Concerns

없음. 7 Major + 6 key Minor 전부 contract 반영 검증 완료. Minor M4 (PAYBACK_RATE boundary) 와 M8 (Phase 1 Regression — Patch 8 로 흡수) 는 Round 1 에서 "필수 아님" / "Patch 8 로 대체" 로 명시되어 Round 2 차단 요소 아님.

회귀/신규 이슈 없음.

### Final Verdict: APPROVE

- Major 7 / 7 resolved
- Minor 6 key items (M1/M2/M3/M5/M6/M7) / 6 resolved
- Patch 8 Regression 구체화 완료
- Evaluator approved 2026-04-23

## Sign-off (Round 2)

- Evaluator: APPROVE
- Date: 2026-04-23
- Next: Phase 5 구현 진입 승인. Group 001 BE 4 task (be-001/002/003/004) 구현자 dispatch 가능.
