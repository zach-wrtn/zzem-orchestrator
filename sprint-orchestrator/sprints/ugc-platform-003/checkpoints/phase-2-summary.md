# Phase 2 Checkpoint: ugc-platform-003 (Spec)

**Sprint**: ugc-platform-003 (follow-up from ugc-platform-002)
**Generated**: 2026-04-23
**Gate**: PASS

## Tasks (13 total)

| ID | Type | Target (1-line) | Group | Depends |
|----|------|-----------------|-------|---------|
| be-001 | backend | Follow 도메인 + endpoints + FollowCreatedEvent | 001 | — |
| app-001 | app | FollowButton (3-state) on other-user profile | 001 | be-001 |
| app-002 | app | FollowerList + FollowingList screens (본인만) | 001 | be-001 |
| be-002 | backend | Block 도메인 + feed/profile 필터 + 팔로우 양방향 해제 | 002 | be-001 |
| be-003 | backend | Content Report + ContentReportedEvent + caller-content filter | 002 | — |
| app-003 | app | BlockConfirmSheet + BlockedProfileState + more-sheet wire | 002 | be-002 |
| app-004 | app | BlockManagement screen + UnblockConfirmSheet + Toast | 002 | be-002 |
| app-005 | app | ContentReportBottomSheet (자유 텍스트 100자) | 002 | be-003 |
| be-004 | backend | Notification entity + 3 listener (LIKE/FOLLOW/PAYBACK batch) | 003 | be-001 + Phase 2 events |
| be-005 | backend | /v2/me/notifications list + unread-count + read-all | 003 | be-004 |
| be-006 | backend | Push dispatch (new-noti + UserDevice.fcmToken) | 003 | be-004, be-007 |
| be-007 | backend | NotificationSetting 확장 (4 토글 + persona lock) + shouldNotify helper | 003 | — |
| app-006 | app | NotificationCenter + HomeHeader bell + red dot + banner | 004 | be-005 |
| app-007 | app | NotificationSettings screen (4 토글, pushAll disable subs) | 004 | be-007 |
| app-008 | app | usePushNotificationHandler 확장 (LIKE/FOLLOW/PAYBACK) | 004 | be-006 |

## API Endpoints (new in Phase 3)

| Method | Path | Related Tasks |
|--------|------|---------------|
| POST / DELETE | /v2/users/{userId}/follows | be-001 |
| GET | /v2/me/followers | be-001, app-002 |
| GET | /v2/me/following | be-001, app-002 |
| GET | /v2/users/{userId}/follow-state | be-001, app-001 |
| POST / DELETE | /v2/users/{userId}/blocks | be-002 |
| GET | /v2/me/blocks | be-002, app-004 |
| POST | /v2/contents/{contentId}/reports | be-003, app-005 |
| GET | /v2/me/notifications | be-005, app-006 |
| GET | /v2/me/notifications/unread-count | be-005, app-006 |
| POST | /v2/me/notifications/read-all | be-005, app-006 |
| GET / PATCH | /v2/me/notification-settings | be-007, app-007 |

## Group Plan

- **Group 001 — Follow**: be-001, app-001, app-002 (3 tasks)
- **Group 002 — Block & Report**: be-002, be-003, app-003, app-004, app-005 (5 tasks)
- **Group 003 — Notification Backend**: be-004, be-005, be-006, be-007 (4 tasks)
- **Group 004 — Notification App**: app-006, app-007, app-008 (3 tasks)

## Key Decisions

1. **Cross-stack groups (not stack-separated)**: Follow / Block+Report / Notif-BE / Notif-App 으로 분할. Group 001/002 는 cross-stack (BE+FE), Group 003/004 는 stack-split (BE 먼저, App 후). 각 그룹은 내부 결속이 강함.
2. **Follow 양방향 해제 helper**: be-002 의 cross-path cleanup (integration-002) 을 단일 helper `rollbackFollowByPair` 로 일원화.
3. **shouldNotify / shouldPush 이원화**: be-007 이 `shouldNotify(owner, type)` 제공 (persona + settings gate). be-006 의 `shouldPush` 는 push 전송 직전 재확인 (race 방지). 역할 분리.
4. **Content Report filter 진입점**: BE `/v2/feed`, `/v2/users/{userId}/contents`, `/v2/me/likes` 에만 반영. `/v2/me/contents` 는 제외 (본인 콘텐츠 신고 불가).
5. **Block 응답에 isBlocked 필드 단방향**: UserPublicProfile 에 `isBlocked` 필드 추가 (caller→target 방향만). 양방향 blocked 여부 노출 안 함 (AC 7.2 미통지 원칙).
6. **Notification TTL 1개월**: mongoose TTL index + read-path 에서 `createdAt >= now - 30days` 필터 병행 (지연 삭제 방어).
7. **PAYBACK 배치 idempotency**: `@Cron("0 10 * * *", {tz: Asia/Seoul})` + (ownerUserId, YYYY-MM-DD) unique 제약으로 재실행 안전.
8. **Persona 토글 default**: NotificationSetting 초기 document 생성 시 persona 는 4 필드 false (알림 수신 불가).
9. **Push deeplink fallback**: BE 가 항상 유효한 deeplink 기재 → FE 는 parse 실패 시 `zzem://home` fallback (app-008).
10. **E2E 9 신규 flow + 1 extend**: 푸시/native-dialog/time-warp 류는 Deferred → BE integration test + 수동 QA.

## KB Patterns Inherited → Contract clauses

6 patterns from ugc-platform-002 반영 (evaluation/criteria.md §KB-Calibrated Checks).

| Pattern | Freq | Applied Tasks |
|---------|------|---------------|
| completeness-008 (mapper fallback 금지) | 2 | 전체 (mapper 접점) |
| completeness-009 (dead hook 금지) | 2 | 전체 (신규 hook/service) |
| completeness-010 (cross-component 전수) | 2 | be-002, be-003, be-004, be-007, app-004/006/007 |
| correctness-004 (cursor $lte) | 1 | be-001, be-002, be-005 |
| integration-002 (cross-path cleanup) | 2 | be-002 (팔로우 양방향 해제) |
| storage primitive (integration) | 1 | app-006, app-007, app-008 |
| E2E flow structure | 1 | 전체 app 태스크 |

## Regression Guard (inherited)

- Phase 1 profile/nav: ProfileScreen, ProfileCountRow, SettingsBody canonical order, RootNavigator 기존 screen.
- Phase 2 feed/like/payback: SwipeFeed, PublishToggleRow, MoreSheet (owner/non-owner), Like 버튼, Credit history PaybackHistoryRow. PaybackEventListener 이벤트 emit 유지.
- Manual QA carryover (Phase 1): AC-2.3 프로필 공유, AC-7.4 404 — Phase 5 PR body 체크리스트.

## Next Phase

Phase 3: Prototype
- 각 app 태스크 (app-001 ~ app-008) 별 Design Engineer HTML prototype 생성.
- 프로토타입 승인 루프 + amendment (예: Notification dot 색상 확정, BlockedProfileState copy 최종).
