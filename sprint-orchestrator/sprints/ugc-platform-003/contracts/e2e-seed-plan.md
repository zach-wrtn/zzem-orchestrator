# E2E Seed Plan — ugc-platform-003

> 각 E2E flow 가 요구하는 시드 데이터 + 주입 env 변수. 관련 backend 태스크 Specification 에 사전 반영하여 그룹 시작 전 준비.

## Seed Fetchers (proposed)

### fetch-seed-follow-target.mjs (→ be-001 backend 준비)

- 목적: app-001 (follow-button-tap.yaml) + app-002 (follower-list/following-list).
- 조회 대상: caller 가 팔로우 가능한 "타 유저" 1명 (persona 아님, 본인 아님).
- BE endpoint: 이미 존재하는 `/v2/users?limit=1` 류 검색 endpoint 필요 — 없으면 임시 seed API (be-001 에서 추가).
- 주입 env: `MAESTRO_FOLLOW_TARGET_USER_ID`, `MAESTRO_FOLLOW_TARGET_NICKNAME`.

### fetch-seed-follower-list.mjs (→ be-001)

- 목적: app-002 (my-profile-follower-list.yaml).
- 사전 조건: caller 에게 최소 1명 팔로워 있도록 seed 유저가 caller 를 팔로우 처리.
- 주입 env: `MAESTRO_MY_FOLLOWER_NICKNAME` (assertVisible 대상).

### fetch-seed-following-list.mjs (→ be-001)

- 목적: app-002 (my-profile-following-list.yaml).
- 사전 조건: caller 가 최소 1명 팔로우.
- 주입 env: `MAESTRO_MY_FOLLOWING_NICKNAME`.

### fetch-seed-block-target.mjs (→ be-002)

- 목적: app-003 (other-user-profile-block.yaml).
- 조회: caller 가 차단할 타 유저 1명 (persona 아님).
- 주입 env: `MAESTRO_BLOCK_TARGET_USER_ID`, `MAESTRO_BLOCK_TARGET_NICKNAME`.

### fetch-seed-blocked-list.mjs (→ be-002)

- 목적: app-004 (settings-block-management.yaml).
- 사전 조건: caller 가 최소 1명 차단 상태. BE 에 "유저 A 가 유저 B 차단" 상태 주입.
- 주입 env: `MAESTRO_BLOCKED_NICKNAME`.

### fetch-seed-reportable-content.mjs (→ be-003)

- 목적: app-005 (swipe-feed-content-report.yaml).
- 조회: caller 가 신고 가능한 타 유저 public content 1개 (본인 것 제외).
- 주입 env: `MAESTRO_REPORTABLE_CONTENT_ID`.

### fetch-seed-notifications.mjs (→ be-004, be-005)

- 목적: app-006 (home-to-notification-center.yaml).
- 사전 조건: caller 에게 Notification 3건 seed (LIKE / FOLLOW / PAYBACK 각 1건).
- BE endpoint: seed API 또는 직접 Notification persist 스크립트. be-004 구현 시 test-seed endpoint 제공.
- 주입 env: `MAESTRO_SEED_NOTIFICATION_TITLE_1` (첫 알림 title — assertVisible 대상).

### no-seed: notification-center-empty.yaml (→ app-006)

- 목적: empty state 검증.
- 사전 조건: caller 에게 Notification 0건. seed 없이 새 유저 또는 readAll + TTL cleanup.
- env 주입 불필요.

### no-seed: follow-button-tap (initial state NONE)

- 사전 조건: caller 가 target 을 팔로우하지 않은 상태. fetch-seed-follow-target.mjs 만 있으면 충분.
- env: `MAESTRO_FOLLOW_TARGET_USER_ID`.

### no-seed: settings-notification-settings

- 사전 조건: caller 의 NotificationSetting document default (4 토글 ON).
- env 불필요.

## Backend 준비 작업

각 관련 backend 태스크의 Specification 에 다음 사전 요구를 반영:

### be-001 (Follow)
- test-seed API 또는 확정된 public endpoint 를 통해:
  - follow target 유저 1명 (persona 아님) 조회 가능
  - caller 에게 follower 1명 주입 가능
  - caller 가 following 1명 주입 가능
- Nx local 환경에서 seed 스크립트 실행 가능한 endpoint.

### be-002 (Block)
- caller 가 특정 유저 차단 상태 주입 가능 (test-seed 또는 직접 DB write).

### be-003 (Report)
- caller 가 신고 가능한 타 유저 public content 조회 가능.

### be-004 / be-005 (Notification)
- caller 에게 3 타입 Notification 각 1건 seed 주입 가능한 테스트 endpoint 또는 스크립트.

## Seed 파일 위치

`app/apps/MemeApp/e2e/scripts/fetch-seed-*.mjs` (Phase 1 패턴).

## E2E 실행 순서

Maestro CI 에서 seed fetch → env 주입 → `maestro test {flow}` 실행. Phase 1/2 패턴 유지.

## 회귀 / 영향 최소화

- 기존 seed fetcher (Phase 1 profile, Phase 2 feed) 는 미수정.
- 신규 seed fetcher 만 추가 — 기존 flow 에 영향 없음.
