# be-003 · 콘텐츠 신고 도메인 + Feed/Likes read-path filter

- **Group**: 002
- **Owner**: be-engineer
- **Depends on**: 없음 (be-002 와 병렬)

## Target

`backend/apps/meme-api/src/` 내:
- 신규 `domain/content-report/` (ContentReportDomainService)
- 신규 `persistence/content-report/` (content-report.schema.ts, content-report.repository.ts)
- 신규 `controller/content-report/` (content-report.controller.ts + DTO)
- `common/constant/event-constant.ts` — `EVENT_TYPE.CONTENT_REPORTED` 추가
- `persistence/content/content.repository.ts` — feed / likes aggregation 에 contentId block predicate 추가 (caller-scoped)
- 관련 integration tests

## Context

AC 7.5 (콘텐츠 신고): 세로 스와이프 또는 프로필에서 비내-소유 콘텐츠를 "신고" 할 수 있음. 신고 즉시 피드/프로필에서 해당 콘텐츠 숨김 (PRD 의 "~1h 반영" 은 추천 패널티 기준 — 본 스프린트에서는 read-path 즉시 반영).

기존 `domain/user-report/` 는 "필터 신고" (광고/이모티콘 reason-enum) 로 콘텐츠 신고와 별개. 혼동 방지를 위해 **별도 도메인 `content-report` 신규 생성**.

신고자-신고대상 콘텐츠 pair 단위 unique — 동일 콘텐츠 중복 신고 허용 안 함 (idempotent 200).

## Objective

콘텐츠 신고 endpoint 구축 + ContentReportedEvent emit + caller-scoped read-path filter (feed / likes / user contents) 로 신고한 콘텐츠 즉시 은닉.

## Specification

### Schema — ContentReport
- Fields: `reporterUserId: ObjectId`, `contentId: ObjectId`, `reason: string` (1~100 chars), `createdAt: Date`.
- **Unique compound index**: `{ reporterUserId: 1, contentId: 1 }`.
- **List index (future admin)**: `{ contentId: 1, createdAt: -1 }` — 본 태스크 read-path 미사용, 추후 admin 집계용.
- 신고 filter 용 index: `{ reporterUserId: 1 }` (read-path 에서 distinct contentId lookup).

### Endpoint — POST `/v2/contents/{contentId}/reports`

- Path param: `contentId`.
- Body: `{ reason: string }` (trim 후 1~100 chars).
- Auth: 인증 필수.
- Validation:
  - `reason` empty / whitespace-only → 400 VALIDATION (`reason.required`).
  - `reason.length > 100` → 400 VALIDATION (`reason.tooLong`).
  - Content 존재 확인 → 404 CONTENT_NOT_FOUND.
  - Content.ownerUserId === reporterUserId → 400 SELF_REPORT_FORBIDDEN (본인 콘텐츠 신고 금지).
  - INTERNAL 유저의 콘텐츠 신고 허용 (페르소나 콘텐츠도 신고 대상).
- Idempotent:
  - 동일 `{reporterUserId, contentId}` 기존 row 존재 시 신규 생성 안 함 + 기존 row 반환 (reason 덮어쓰기 금지 — AC 해석: 첫 신고만 유효).
  - 응답 201 (신규) / 200 (중복 흡수) — API contract SSOT 에 따름. 기본 200 OK `{ reportId, alreadyReported: boolean }`.
- Side effects:
  - `ContentReportedEvent` emit (`EVENT_TYPE.CONTENT_REPORTED`) with payload `{ reportId, reporterUserId, contentId, reason, createdAt }`.
  - **상대방 미통지** — content owner 에게 push / in-app alert 금지.
  - 추천 패널티 (~1h 반영) 은 별도 consumer 가 담당 (본 태스크 scope 외 — event 만 emit).

### Read-path filter — caller-scoped contentId blocklist

`ContentReportQueryService.getReportedContentIds(callerId)` → `ContentReport.find({ reporterUserId: callerId }).distinct('contentId')`.

aggregation predicate: `_id: { $nin: reportedContentIds }` AND 병합.

**영향 엔드포인트 전수 나열** (cross-component 전수 명시, completeness-010):
1. `/v2/feed` — 신고한 콘텐츠 제외.
2. `/v2/users/{userId}/contents` — target 유저 콘텐츠 중 caller 가 신고한 것 제외.
3. `/v2/me/likes` — caller 가 좋아요한 콘텐츠 중 신고한 것 제외 (신고 후 like 상태 유지되나 list 에서 은닉).
4. `/v2/users/{userId}/likes` — 동일.
5. **제외 대상: `/v2/me/contents`** — 본인 콘텐츠는 본인이 신고할 수 없으므로 (SELF_REPORT_FORBIDDEN) filter 무의미. 적용 시 오히려 혼란 야기 → **미적용**.

request-scoped cache 권장 (단일 request 에서 여러 aggregation 이 getReportedContentIds 호출).

### Errors
- 400 VALIDATION (reason empty / too long).
- 400 SELF_REPORT_FORBIDDEN (본인 콘텐츠).
- 404 CONTENT_NOT_FOUND.
- 401 (미인증).

### Events
- `EVENT_TYPE.CONTENT_REPORTED` enum 신규 추가 (event-constant.ts).
- Payload `ContentReportedEvent`: `{ reportId, reporterUserId, contentId, reason, createdAt }`.
- 본 태스크는 emit 만. Subscriber (추천 패널티) 는 별도 태스크.

## Acceptance Criteria

- [ ] POST `/v2/contents/{contentId}/reports`: 정상 생성 → ContentReport row + event emit.
- [ ] 중복 신고: idempotent 200 + `alreadyReported: true` (unique index 위반 흡수, reason 덮어쓰기 없음 verified).
- [ ] reason empty → 400 VALIDATION.
- [ ] reason 101 chars → 400 VALIDATION.
- [ ] 본인 콘텐츠 신고 → 400 SELF_REPORT_FORBIDDEN.
- [ ] Content 미존재 → 404 CONTENT_NOT_FOUND.
- [ ] ContentReportedEvent emit 검증 (spy): EVENT_TYPE.CONTENT_REPORTED + payload 필드 전수.
- [ ] 상대방 미통지: owner 에 대한 notification 생성 없음 (notification.repository find → 0 hit).
- [ ] Read-path 4개 엔드포인트 block filter 전수 — /v2/feed, /v2/users/{userId}/contents, /v2/me/likes, /v2/users/{userId}/likes 각각 integration test.
- [ ] /v2/me/contents **미적용** 검증 (본인 콘텐츠 filter 안 함 — negative test).
- [ ] Mapper fallback 금지 (completeness-008): ContentReport DTO `?? 0 / ?? false / || ""` 0 hit. Zod `.min(1).max(100)` reason 강제.
- [ ] Dead hook 금지 (completeness-009): 신규 메서드 (`reportContent`, `getReportedContentIds`) 호출처 ≥ 2 hit.
- [ ] Cross-component 전수 (completeness-010): 영향 4개 엔드포인트 + 미적용 1개 (me/contents) 명시 — "모든 feed" 표현 금지.
- [ ] Phase 1 / Phase 2 AC 회귀 없음 (feed/likes 기존 쿼리 predicate 추가만, 기존 필터 불변).
- [ ] be-002 block filter 와 AND 병합 시 정상 동작 (block + report 중첩 integration test).
- [ ] lint / typecheck 신규 에러 0. nx listTests 포함 확인.

## Implementation Hints

- 기존 `domain/user-report/` 를 절대 확장하지 말 것 — 별도 도메인 `content-report` 신규 생성 (reason semantics 다름 — enum 아닌 free-text).
- Zod schema: `z.object({ reason: z.string().trim().min(1, 'reason.required').max(100, 'reason.tooLong') })`.
- Event emit: 기존 event-constant.ts 에 `CONTENT_REPORTED = 'content.reported'` 추가. emit 위치는 repository `create` 이후 service layer 에서 `eventEmitter.emit`.
- Read-path filter 주입 지점: `content.repository.ts` 의 feed/contents/likes aggregation pipeline 진입점. be-002 의 BlockRelationService 옆에 `ContentReportQueryService` 주입, 병렬 predicate 생성. 둘 다 request-scoped cache.
- Cursor pagination 관련 새 쿼리 추가 시 `$lte` 의무 (correctness-004) — 단 본 태스크는 report list 엔드포인트 없음 → grep 게이트 불필요하나 기존 feed 쿼리 변경 시 기존 `$lte` 유지 확인.
- Unique index violation: Mongo error code 11000 → catch 후 기존 row find + alreadyReported=true 응답.

## Out of Scope

- 추천 패널티 subscriber (ContentReportedEvent → recommend score 하락). 본 태스크는 emit 만.
- 신고 list / 취소 endpoint (본 스프린트 PRD 미정의).
- Admin 대시보드 / 집계.
- 신고 reason enum 화 (현재 free-text SSOT).
- 신고한 콘텐츠 "다시 보기" 토글 (PRD 미정의).
- Push notification 억제 (content owner 는 신고 사실 모름 — 미통지만 보장, push 자체 로직 미변경).

## Regression Guard

- 기존 `domain/user-report/` (필터 신고) 동작 불변 — 파일 수정 금지.
- Phase 2 `/v2/feed`, `/v2/me/likes`, `/v2/users/{userId}/contents` 기존 쿼리 predicate (isPublished / 정렬 / cursor) 전량 유지. report filter 는 AND 추가만.
- be-002 block filter 와 독립적으로 동작 (병합 시 둘 다 AND — 순서 무관).
- `/v2/me/contents` 는 본 태스크 filter 적용 대상 아님 — 쿼리 변경 금지 (regression 방지).
