# Phase 2 Checkpoint: ugc-platform-002

> Phase 3 이후에는 원본 PRD / 전체 api-contract / 전체 태스크를 다시 읽지 않고 이 요약 + 관련 태스크 파일만 참조.

## Tasks

| ID | Type | Target | Group |
|----|------|--------|-------|
| be-001 | backend | Content visibility toggle API (PATCH + custom-prompt block) | 001 |
| be-002 | backend | sourceContentId + regenerateCount tracking + profile aggregation | 001 |
| be-003 | backend | Payback trigger (1% promotion, persona/self skip, credit history PAYBACK row) | 001 |
| be-004 | backend | Likes domain (POST/DELETE, likeCount/liked 필드, liked 탭 활성화) | 001 |
| app-001 | app | 세로 스와이프 액션 바 4버튼 (좋아요+재생성+공유+더보기) + FeedItemEntity 확장 | 002 |
| app-002 | app | 더보기 바텀시트 (내/타 분기) + 삭제 확인 + DELETE API 연결 | 002 |
| app-003 | app | CTA 분기 (다시 생성하기 / 템플릿 사용하기) + sourceContentId 전달 + 삭제된 필터 에러 | 002 |
| app-004 | app | 게시 토글 + 비공개 확인 시트 + custom-prompt 공개 불가 안내 | 002 |
| app-005 | app | 좋아요 카운트 실제 숫자 렌더 + 훅 be-004 재배선 + self-like | 003 |
| app-006 | app | 좋아요 탭 활성화 (isLikedPhase1 제거 + SwipeFeed liked variant) | 003 |
| app-007 | app | 페이백 안내 모달 (최초 공개 시, userStorage flag) | 003 |
| app-008 | app | 크레딧 히스토리 페이백 row variant | 003 |
| app-009 | app | Deferred items 정리 (Home gear, landingTab race, Clipboard, initialContentId fallback) | 003 |

## API Endpoints (신규 + 확장)

| Method | Path | Related Tasks | Inherited |
|--------|------|---------------|-----------|
| PATCH | /v2/me/contents/:contentId/visibility | be-001, app-004 | 신규 |
| POST | /v2/contents/:contentId/likes | be-004, app-005 | 신규 |
| DELETE | /v2/contents/:contentId/likes | be-004, app-005 | 신규 |
| GET | /v2/me/contents (Phase 1 endpoint, 응답 확장) | be-001/002/004, app-001/005 | 확장 |
| GET | /v2/me/contents?visibility=liked (Phase 1 placeholder → 실제) | be-004, app-006 | 활성화 |
| GET | /v2/me/contents/counts (liked 실제 값) | be-004, app-006 | 확장 |
| GET | /v2/users/:userId/contents (응답 확장) | be-001/002/004, app-005 | 확장 |
| DELETE | /v2/contents?type=filter (기존) | app-002 | 기존 재사용 |
| DELETE | /v2/custom-prompt-contents/:contentId (기존) | app-002 | 기존 재사용 |
| (event listener, no endpoint) | payback trigger on content generation complete | be-003 | 신규 내부 |

## Schema Extensions

### ContentSummary (확장 필드)
- `isCustomPrompt: boolean` — custom-prompt 식별 (app-004 토글 차단용)
- `sourceContentId: string | null` — 재생성 원본 id
- `regenerateCount: number` — 원본 재생성 횟수 (축약 표시)
- `likeCount: number` — 실제 숫자 (축약 없음)
- `liked: boolean` — caller 좋아요 상태

### MyProfileResponse / PublicProfileResponse
- `regeneratedCount` — hardcoded 0 → 실제 aggregate 합산 (be-002)

### CREDIT_TRANSACTION_TYPE
- `PAYBACK` 추가 (be-003)

### Like schema (신규)
- `{ userId, contentId, contentType: 'filter' | 'custom-prompt', createdAt, deletedAt }`
- Unique compound index `(userId, contentId, deletedAt)`

## Key Decisions

1. **Likes endpoint 신설 (기존 reaction 재사용 X)**: REACTION enum 의 LIKE 는 피드백 용도. UGC 좋아요 리스트는 별도 도메인으로 분리 (be-004). FE 훅 (`useToggleFavoriteUseCase`) 은 app-005 에서 신규 endpoint 로 재배선.

2. **Payback thumbnail = 원본 콘텐츠 thumbnail**: PRD AC 4.2 "콘텐츠 썸네일" 직역. Prototype 단계에서 재확인. 재생성 결과물 썸네일이라는 대안도 존재하나 원본 해석을 기본으로 채택.

3. **CTA 분기 Prop threading**: `ownerId`, `isCustomPrompt`, `isPublished` 가 FeedItemEntity 에서 CTA/ToggleButton 까지 threading (rubric C13 준수). 자식이 parent state 를 추정/기본값 대체 금지.

4. **Custom-prompt 공개 차단 이중 방어**: BE 에서 409 CUSTOM_PROMPT_PUBLISH_BLOCKED (be-001), FE 에서도 API 호출 전 차단 (app-004). 두 layer 모두 동일 문구 토스트.

5. **Liked cursor 쿼리**: `_id: { $lte }` + compound `(liked_at DESC, _id DESC)` 정렬. rubric C10 준수.

6. **페이백 idempotency**: 동일 contentId + sourceContentId 조합으로 중복 적립 방지 (CreditDetailHistory lookup).

7. **Deferred items (app-009)**: 4 sub-fix 번들 단일 태스크. Sub-fix 1 Home gear 제거는 default 결정이나 Implementation 단계에서 PRD 재확인 조건부.

8. **Phase 1 Deferred AC (AC-2.3, AC-7.4)**: Phase 5 PR 전 수동 QA 체크리스트 (evaluation/criteria.md 말미).

## Group Plan

### Group 001 — Backend
- **Tasks**: be-001, be-002, be-003, be-004
- **순서 (의존)**: be-001 / be-004 (병렬) → be-002 (독립) → be-003 (be-002 의존)
- **Risk**: 페이백 event listener 의 기존 ContentGeneration pipeline 에 hook point 식별. `$lte` 규약 준수 (신규 cursor 쿼리). persona skip IF 분기.
- **Regression Guard**: Phase 1 me-contents, users-public 응답 호환성 유지 (신규 필드 optional 처리 가능해야 구형 FE 안전).
- **E2E**: 신규 4개 spec (visibility, regeneration, payback, likes) — nx testMatch discovery 확인 필수 (rubric C11).

### Group 002 — App 피드 인터랙션
- **Tasks**: app-001, app-002, app-003, app-004
- **Pattern**: SwipeFeed 중심 UX 덩어리. FeedItemEntity 확장 (app-001) 후 나머지 병렬 가능.
- **Risk**: Owner 판정 + Custom-prompt 판정의 prop threading (rubric C13). CTA 분기 누락 (rubric C3/C7).
- **E2E**: `swipe-feed-publish-toggle.yaml`, `swipe-feed-custom-prompt-block.yaml`, `swipe-feed-more-sheet.yaml` 신규 + `profile-to-swipe-feed.yaml` `swipe-feed.yaml` 확장.

### Group 003 — App 좋아요 + 페이백 + 정리
- **Tasks**: app-005, app-006, app-007, app-008, app-009
- **Pattern**: SwipeFeed 외 영역. 독립성 높음.
- **Risk**: SwipeFeed liked variant 의 enabled gate (rubric C12), Clipboard migration 전수 교체 (codebase-wide grep), userStorage flag race.
- **E2E**: `payback-intro-modal.yaml` 신규, `credit-history.yaml` 확장, `my-profile-default-landing.yaml` 확장 (좋아요 탭).

## Regression Scope (Phase 1 → 2)

### High risk
- AC-2.5 MY 스와이프, AC-7.3 타유저 스와이프 — SwipeFeed 확장 영향.

### Medium risk
- AC-2.2 카운트 포맷 — 재생성은 축약 유지, 좋아요는 축약 없음 (서로 다른 포매터 사용).
- AC-2.7 landingTab 라우팅 — app-009 Sub-fix 2 가 영향.

### Low risk
- AC-1.x 탭바, AC-2.1 랜딩 우선순위, AC-2.4 편집, AC-2.8 설정, AC-7.1/7.2/7.5

Phase 4 그룹 Smoke Gate 에서 regression guard flows 실행 후 PASS 확인.

## Self-Check (Phase 2 Gate)

- [x] `api-contract.yaml` 존재 + OpenAPI 3.0 valid.
- [x] 13 태스크 파일 필수 섹션 (Target, Context, Objective, Specification, AC) 존재.
- [x] 태스크 번호 간 순환 의존성 없음 (be 선행 → app).
- [x] 모든 AC testable (ambiguous 표현 검토 — Prototype 에서 확정 항목 명시).
- [x] BE 태스크와 app 태스크가 api-contract 동일 endpoint 참조.
- [x] `e2e-flow-plan.md` 존재 + 모든 AC 가 Covered/Extend/New/Deferred 분류.
- [x] `e2e-seed-plan.md` 존재 + seed fetcher 목록 + BE 준비 작업 명시.
- [x] KB-calibrated checks (v3 C10~C13 + correctness-004, completeness-003) 반영.
- [x] Follow-up 지표: 이전 스프린트 deferred items 반영 (app-009), Phase 5 수동 QA 체크리스트 (AC-2.3, AC-7.4).

→ Phase 3 (Prototype) 진입.
