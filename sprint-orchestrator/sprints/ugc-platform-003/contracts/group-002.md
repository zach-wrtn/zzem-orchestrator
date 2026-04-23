# Sprint Contract: Group 002 — Block & Report (DRAFT — pending Group 001 PASS)

> Sprint Lead 선행 초안. Group 001 (특히 be-001) 의 FollowDomainService 시그니처가 합의된 후 최종 확정.
> Evaluator 리뷰 대상. 합의 후 구현 시작.

## Scope

- **Sprint**: ugc-platform-003
- **Tasks**:
  - `be-002`: Block 도메인 + feed/profile 필터 + 팔로우 양방향 해제 (Group 001 의 `rollbackFollowByPair` 호출)
  - `be-003`: Content Report 도메인 + ContentReportedEvent + caller-contentId filter
  - `app-003`: BlockConfirmSheet + BlockedProfileState + more-sheet wire (profile/swipe-feed)
  - `app-004`: BlockManagement screen + UnblockConfirmSheet + Toast
  - `app-005`: ContentReportBottomSheet (자유 텍스트 100자)
- **API Endpoints**:
  - POST / DELETE `/v2/users/{userId}/blocks`
  - GET `/v2/me/blocks`
  - POST `/v2/contents/{contentId}/reports`
  - (response extension) `/v2/users/{userId}/profile` → `isBlocked` 필드 추가
  - (read-path filter) 기존 feed / `/v2/users/{userId}/contents` / `/v2/me/likes` 에 block + report 필터 병합

## Cross-group Integration

- **Group 001 종속**: be-002 가 `FollowDomainService.rollbackFollowByPair(a, b)` 호출 — Group 001 be-001 의 export 가 전제.
- **Group 001 종속**: be-002 가 `BlockRelationPort` 의 **실제 구현** 을 제공 (Group 001 의 default noop 대체). be-001 이 정의한 포트 인터페이스 준수.
- **Group 003 (Notification) 무관**: 본 그룹에서 알림/푸시 emit 없음 (AC 7.2 차단/해제 미통지 원칙).

## Done Criteria

### be-002 (Backend — Block domain)

- [ ] UserBlock mongoose schema: `{userId, blockedUserId, createdAt}`. Unique `{userId, blockedUserId}`. Index `{userId, createdAt, _id}` for list.
- [ ] POST /v2/users/{userId}/blocks: idempotent. Self-block 400 `SELF_BLOCK_FORBIDDEN`. 404 USER_NOT_FOUND.
- [ ] DELETE /v2/users/{userId}/blocks: idempotent.
- [ ] GET /v2/me/blocks: cursor paging (`_id: $lte`), blockedAt DESC 정렬.
- [ ] **Transaction on block**: UserBlock 생성 + `rollbackFollowByPair(caller, target)` 단일 transaction 내 수행. Helper 실패 시 UserBlock 도 rollback.
- [ ] `BlockRelationPort` 실제 impl 제공 — `isBlockedEither(a, b)` 가 양방향 UserBlock 조회. Group 001 의 noop 을 DI 교체 (provider override in app module).
- [ ] **Read-path filter 전수 적용** (completeness-010):
  - `/v2/users/{userId}/profile` 응답에 `isBlocked` (caller → target 단방향) 필드 추가.
  - `/v2/users/{userId}/contents`: caller 가 target 을 block 했거나 target 이 caller 를 block 한 경우 빈 list + `{ hasNext: false }`.
  - `/v2/me/likes`: block 관계의 콘텐츠 제외.
  - `/v2/feed` (기존 feed endpoint — grep `feed.controller` 확인): block pair 의 콘텐츠 제외.
  - `/v2/me/contents`: **영향 없음** (본인 콘텐츠이므로 block 과 무관).
- [ ] 차단 시 알림 발송 없음 grep: `rg 'notifyBlock|BLOCK_CREATED' backend/apps/meme-api/src → 0 hit`.
- [ ] Nx unit + integration test: self-block, idempotent, transaction 실패 rollback, cross-feed filter 전수.

### be-003 (Backend — Content Report)

- [ ] ContentReport mongoose schema: `{reporterUserId, contentId, reason: string (1-100), createdAt}`. Unique `{reporterUserId, contentId}` → 중복 신고 idempotent.
- [ ] POST /v2/contents/{contentId}/reports:
  - 본인 콘텐츠 신고 400 `SELF_REPORT_FORBIDDEN`.
  - reason 길이 1-100 class-validator 검증, 위반 400 VALIDATION.
  - 404 CONTENT_NOT_FOUND.
  - 중복 신고 200 (기존 row 반환).
- [ ] `ContentReportedEvent` emit: EVENT_TYPE.CONTENT_REPORTED (enum 추가). payload `{reporterUserId, contentId, reason}`. 추천 시스템은 본 태스크 scope 외.
- [ ] Read-path filter 반영:
  - `/v2/feed`, `/v2/users/{userId}/contents`, `/v2/me/likes`: caller 가 신고한 contentId 제외.
  - `/v2/me/contents`: **제외** (본인 콘텐츠 신고 불가).
- [ ] 상대방 미통지 grep: `rg 'notifyReport|REPORT_CREATED' backend/apps/meme-api/src → 0 hit`.
- [ ] Nx integration test: idempotent, self-report 차단, read-path 필터.

### app-003 (App — Block sheets + BlockedProfileState)

- [ ] `BlockConfirmSheet` (horizontal 2-button) with AC 7.2 문구 직역.
- [ ] `BlockedProfileState` renders on `userPublicProfile.isBlocked=true` paths — ProfileScreen 타 유저 분기.
- [ ] `useBlockUser()` + `useUnblockUser()` hooks (React Query mutations) with cache invalidation: `['user-profile', userId]`, `['follow-state', userId]`, `['feed']`, `['me-likes']`.
- [ ] More-sheet wire-up: profile more-sheet (타 유저) + swipe-feed more-sheet (non-owner) 에 "차단" 액션 추가. 기존 액션 미변경.

### app-004 (App — BlockManagement screen)

- [ ] BlockManagementScreen at `zzem://block-management`. RootNavigator + link-screens + AUTH_REQUIRED_PATHS 등록.
- [ ] List: avatar + nickname + [차단 해제] 버튼. blockedAt DESC (BE 응답 그대로).
- [ ] Empty state: "아직 차단한 유저가 없어요".
- [ ] UnblockConfirmSheet (AC 7.6 문구 직역) + confirm 시 mutation + Toast "{nickname}님을 차단 해제했어요".
- [ ] SettingsBody "차단 관리" 메뉴 activate (ComingSoon 에서 제거).
- [ ] Settings body canonical order: "알림 설정" → "차단 관리" → "고객센터" 불변.
- [ ] 팔로우 자동 복원 없음 — 차단 해제 후 follow-state=NONE (be-002 에서 이미 delete).

### app-005 (App — ContentReportBottomSheet)

- [ ] ContentReportBottomSheet: TextInput maxLength=100 + counter + "신고하기" button.
- [ ] Empty disabled + 100자 초과 입력 차단.
- [ ] Success Toast "신고가 접수되었어요" + invalidate `['feed']`, `['user-contents', ownerUserId]`, `['me-likes']`.
- [ ] Swipe-feed more-sheet non-owner / profile more-sheet 에서 기존 `ReportFilter` 로의 navigate 를 본 sheet 로 교체 (콘텐츠 신고 경로에 한함).
- [ ] ReportFilterScreen (필터 신고) 완전 미변경 — git diff 로 검증.

## Verification Method

| Criterion | 검증 방법 |
|-----------|----------|
| Block transaction rollback | Unit test: rollbackFollowByPair throw 시 UserBlock 도 미존재 |
| Cross-feed block filter | Integration test: A block B → GET /v2/users/B/contents (as A) → empty list |
| ContentReport idempotent | Integration test: 동일 (user, content) 2회 POST → 단일 row, 양쪽 200 |
| Read-path report filter | Integration test: caller 가 신고한 contentId 는 feed response 에 없음 |
| FE block mutation invalidation | React Query cache trace — 모든 invalidate 대상 queryKey 확인 |
| Settings body canonical order | App: settings screen snapshot test — 항목 순서 고정 |
| Unblock 후 follow 복원 없음 | Integration: block → unblock → GET follow-state → NONE |

### Default Verification Gates

- [ ] **Mapper fallback 금지** (KB: completeness-008):
  - `rg '\?\?\s*0|\?\?\s*false|userProfile\.id\s*\|\|\s*""|nickname\s*\|\|\s*""' backend/apps/meme-api/src/{domain,persistence,common/dto}/user-block backend/apps/meme-api/src/{domain,persistence,common/dto}/content-report → 0 hit`.
  - `rg 'isBlocked\s*\?\?\s*false|reason\s*\|\|\s*""' app/apps/MemeApp/src/presentation/{user-block,content-report} → 0 hit`.
- [ ] **Dead hook/method 금지** (KB: completeness-009):
  - `rg 'rollbackFollowByPair\(' backend/apps/meme-api/src` → ≥ 2 hit (Group 001 export + Group 002 call).
  - `rg 'isBlockedEither\(' backend/apps/meme-api/src` → ≥ 3 hit (port + impl + be-001 consumer).
  - `rg 'useBlockUser\(|useUnblockUser\(|useReportContent\(' app/apps/MemeApp/src` → 각 ≥ 2 hit.
  - `rg 'ContentReportedEvent|EVENT_TYPE\.CONTENT_REPORTED' backend/apps/meme-api/src` → ≥ 2 hit.
- [ ] **Cross-component 전수 적용** (KB: completeness-010):
  - Block filter 영향 endpoint 전수: /v2/users/:id/profile (isBlocked), /v2/users/:id/contents, /v2/me/likes, /v2/feed. **/v2/me/contents 제외 명시**.
  - Report filter 영향 endpoint 전수: /v2/feed, /v2/users/:id/contents, /v2/me/likes. **/v2/me/contents 제외 명시**.
  - More-sheet 수정 site: profile-more-sheet.tsx + swipe-feed-more-sheet.tsx only.
- [ ] **Cross-path cleanup 일원화** (KB: integration-002):
  - `rollbackFollowByPair(a, b)` 단일 helper 호출 — Block write path 에서만 호출. 직접 UserFollow.deleteMany 호출 금지: `rg 'UserFollow.*deleteMany|followRepository\.delete(?!Pair)' backend/apps/meme-api/src/domain/user-block → 0 hit`.
- [ ] **FE typecheck clean**: `yarn typescript` 신규 error 0 (pre-existing cascade 제외).
- [ ] **BE cursor 규약**: `rg '_id:\s*\{\s*\$lt\s*:' backend/apps/meme-api/src/persistence/user-block → 0 hit`.

## Edge Cases to Test

- Caller A 가 B block 상태에서 A 가 B 의 프로필 진입 → BlockedProfileState 렌더.
- B 가 A 를 block 상태에서 A 가 B 의 프로필 진입 → 일반 profile 렌더 but contents=empty + follow 불가 (403 BLOCKED).
- Self-block / self-report → 400.
- Block 직전 상호 팔로우 상태 → block 후 양방향 UserFollow 없음.
- Block 해제 → follow 자동 복원 없음 (AC 7.6).
- Report idempotent: 동일 (user, content) 2회 → 단일 row.
- Report reason 공백/100자 초과 → 400.
- 본인 콘텐츠 신고 시도 → 400 SELF_REPORT_FORBIDDEN.
- 타 유저 프로필에서 콘텐츠 신고 → 콘텐츠가 피드에서 즉시 사라짐 (React Query invalidation).

## Business Rules to Validate

- AC 7.2: 차단 양방향 + 팔로우 양방향 해제 + 미통지.
- AC 7.3: 자유 텍스트 100자, 필수, 드롭다운 없음, 미통지.
- AC 7.4: 신고 후 ~1h 내 미노출 (BE 는 즉시 필터링 + invalidation).
- AC 7.5: 페르소나 차단 가능, 신고 가능 (별도 분기 없음).
- AC 7.6: 차단 관리 + [차단 해제] 확인 + 팔로우 자동 복원 없음.

## Regression Guard

- [ ] Phase 2 feed / like / payback 엔드포인트 응답 schema 불변 (block/report 필터만 추가 — 응답 타입 미변경).
- [ ] Swipe-feed more-sheet owner 분기 (다운/의견/삭제) 미변경.
- [ ] ReportFilterScreen (필터 신고) 완전 미변경.
- [ ] SettingsBody canonical order 불변.
- [ ] Group 001 FollowDomainService 동작 회귀 없음 (rollbackFollowByPair 만 호출).

## E2E Flows (required)

- `apps/MemeApp/e2e/flows/other-user-profile-block.yaml` — app-003
- `apps/MemeApp/e2e/flows/settings-block-management.yaml` — app-004
- `apps/MemeApp/e2e/flows/swipe-feed-content-report.yaml` — app-005

Seed: fetch-seed-block-target.mjs, fetch-seed-blocked-list.mjs, fetch-seed-reportable-content.mjs.

## Sign-off

- Sprint Lead draft: 2026-04-23 (pending Group 001 PASS)
- 조건부 sign-off: Group 001 `rollbackFollowByPair` + `BlockRelationPort` 시그니처 확정 시 재검증
- Evaluator review: pending
