# Evaluator Calibration — ugc-platform-003

> Follow-up from ugc-platform-002. KB patterns + Phase 2 lessons 반영.

## Severity Rubric (v3 active, completeness-008 승격 후보)

- **Critical**: AC 위배 + 데이터 손상/보안/결제 무결성 파손. 즉시 차단.
- **Major**: AC 위배이지만 복구 가능. 또는 AC 충족 but 명시된 패턴 위반 (fallback semantic, dead hook, cursor $lt). Fix 필수.
- **Minor**: 동작 정상 + AC 충족 but 품질 개선 여지 (over-fetch, 중복 등). 다음 스프린트 이월.

## KB-Calibrated Checks (inherited from ugc-platform-002 + accumulated KB)

### 1. Mapper fallback 금지 (completeness-008, freq=2, 승격 후보)

**Detection**: 모든 mapper/DTO 변환 지점에서 `?? 0`, `?? false`, `|| ""` 유무.

**Grep 게이트**:
```
# Backend
rg '\?\?\s*0|\?\?\s*false|\?\?\s*""|userProfile\.id\s*\|\|\s*""|nickname\s*\|\|\s*""' \
  backend/apps/meme-api/src/common/dto backend/apps/meme-api/src/domain → 0 hit
# App
rg 'likeCount\s*\?\?\s*0|liked\s*\?\?\s*false|userId\s*\|\|\s*""|nickname\s*\|\|\s*""' \
  app/apps/MemeApp/src/presentation → 0 hit (단, 명시적 fallback-to-home 분기는 예외)
```

**해당 태스크**: be-001, be-002, be-003, be-004, be-005, be-006, be-007, app-001, app-002, app-003, app-004, app-005, app-006, app-007, app-008.

**Active evaluation**: 신규 도메인 DTO (FollowState, Notification, BlockState) 에 대해 실제 DB document + mapper 출력 trace. 응답 값 confidence 는 필수 필드 Zod/class-validator 강제 여부로 판단.

### 2. Dead hook/method/factory 금지 (completeness-009, freq=2, skill candidate)

**Detection**: 신규 hook/service method/factory 의 callsite grep.

**Grep 게이트**:
```
# 예시 (Follow)
rg 'followUser\(' backend/apps/meme-api/src → ≥ 2 hit (controller + service 정의 + usecase callsite)
rg 'useFollowButton\(|useMyBlocks\(|useNotifications\(|useMarkAllRead\(|useNotificationSettings\(' \
  app/apps/MemeApp/src → 각 ≥ 2 hit
```

**해당 태스크**: 전부 (모든 신규 hook/service 필수).

**Active evaluation**: 정의 수 vs 호출 수 비교. `grep -c '^export' + grep -c '{hookName}('` 2개 모두 수집. 정의만 있고 callsite 0 이면 Major.

### 3. Cross-component 전수 명시 (completeness-010, freq=2)

**Detection**: Contract 또는 태스크의 "모든 X" 언급 시 구체 path 목록 요구.

**Round 1 review checklist**:
- Block 필터 반영 엔드포인트: `/v2/users/{userId}/contents`, `/v2/me/likes`, `/v2/feed`, `/v2/users/{userId}/profile (isBlocked 필드)`. 전수 검증.
- ContentReport 필터 반영 엔드포인트: `/v2/feed`, `/v2/users/{userId}/contents`, `/v2/me/likes`. `/v2/me/contents` 는 제외 (본인 콘텐츠 신고 불가 — 본 검증 시 제외 명시 확인).
- `shouldNotify` helper 의 cross-path 사용: 3 listener (Like/Follow/Payback) callsite ≥ 3.
- Settings body 메뉴 canonical order: "알림 설정" → "차단 관리" → "고객센터". app-004 + app-007 양쪽에서 순서 불변.

**해당 태스크**: be-002, be-003, be-004, be-007, app-004, app-006, app-007.

### 4. Cursor $lte (correctness-004, freq=1)

**Grep 게이트**:
```
rg '_id:\s*\{\s*\$lt\s*:' backend/apps/meme-api/src/persistence → 0 hit
```

**해당 태스크**: be-001 (follow list), be-002 (block list), be-005 (notification list).

### 5. E2E flow 구조 명시 (pattern freq=1)

**Round 1 checklist**: 각 app 태스크가 선언한 E2E flow 파일 존재 여부 + 구조 (appId + deeplink + assertVisible) 확인.

**필수 flow**:
- `follow-button-tap.yaml` (app-001)
- `my-profile-follower-list.yaml` + `my-profile-following-list.yaml` (app-002)
- `other-user-profile-block.yaml` (app-003)
- `settings-block-management.yaml` (app-004)
- `swipe-feed-content-report.yaml` (app-005)
- `home-to-notification-center.yaml` (app-006)
- `settings-notification-settings.yaml` (app-007)

app-008 은 Deferred (Maestro 한계) — 수동 QA + unit test 로 대체.

### 6. Storage primitive 정합 (integration, freq=1)

**Grep 게이트**:
```
rg '@react-native-async-storage' app/apps/MemeApp/src/presentation/notification-center \
  app/apps/MemeApp/src/presentation/notification-settings \
  app/apps/MemeApp/src/presentation/shared/hooks → 0 hit
```

**해당 태스크**: app-006, app-007, app-008. MMKV (`@wrtn/mmkv-kit`) 만 허용.

### 7. Cross-path cleanup (integration-002, freq=2)

**Detection**: Block 처리 시 팔로우 양방향 해제 helper 단일 경로:
```
rg 'rollbackFollowByPair\(|unfollowBothDirections\(' backend/apps/meme-api/src → 1 정의 + ≥ 1 callsite
```

**해당 태스크**: be-002.

### 8. Regression Guard (inherited from Phase 1/2)

**Phase 1 (profile, nav)**:
- ProfileScreen, ProfileCountRow, ProfileHeader, SettingsBody canonical order, RootNavigator 기존 screen 등록.
- zzem:// 기존 path (profile, settings, home) 동작.

**Phase 2 (feed, like, payback)**:
- SwipeFeed, PublishToggleRow, MoreSheet (owner/non-owner 분기), Like 버튼, Credit history PaybackHistoryRow.
- be-002 PaybackEventListener, be-004 Like endpoint.

**Cross-spread components**: HomeHeader (app-006 bell 추가), settings-body (app-004/app-007), more-sheet (app-003/app-005).

**Evaluator action**: 수정된 파일의 git diff 를 Round 1 에서 확인. 각 그룹 Contract 에 "영향 받는 shared component 전수 나열" 조항.

### 9. Phase 1 inherited manual QA (carry-forward)

- AC-2.3 (프로필 공유 native sheet)
- AC-7.4 (404 에러 화면)

Phase 5 PR body 에 체크리스트 유지. 머지 전 수행 결과를 PR comment 에 기록 (ugc-platform-002 retrospective lesson).

## Per-Group Focus

### Group 001 (Follow)
- be-001: FollowState 계산 정확 (NONE/FOLLOWING/FOLLOWED_BY/MUTUAL). Persona target 시 event.shouldNotify=false.
- app-001: Optimistic + 403 BLOCKED 처리. Isolation (본인 프로필에 안 보임).
- app-002: 가나다순 정렬 BE 위임. FollowButton inline state 동기화.

### Group 002 (Block & Report)
- be-002: **Integration-002 (cross-path cleanup)** 철저 검증. 팔로우 양방향 삭제 단일 helper. 영향 feed 엔드포인트 전수.
- be-003: idempotent (중복 신고 200). ContentReportedEvent emit. caller 본인 콘텐츠 신고 400.
- app-003: BlockedProfileState 전환 로직 (userPublicProfile.isBlocked 조건). 기존 MoreSheet action 미변경.
- app-004: Settings menu canonical order + Toast 문구 + 팔로우 자동 복원 없음 검증.
- app-005: ReportFilterScreen 미변경 git diff 검증.

### Group 003 (Notification Backend)
- be-004: 3 listener persona/settings gate 단일 helper. PAYBACK 배치 idempotency (daily bucket unique).
- be-005: cursor `$lte` + TTL 1mo + readAll idempotency.
- be-006: shouldPush helper 단일 정의 + 3 listener 각 callsite.
- be-007: write-through default + persona lock + pushAll=false 시 응답 강제 false 계산.

### Group 004 (Notification App)
- app-006: HomeHeader 기존 요소 미변경. PushPermissionBanner 조건부 렌더. Deeplink fallback.
- app-007: Switch value BE 응답 신뢰 (fallback 금지). Persona Toast.
- app-008: 기존 meme-gen-complete/error 회귀 없음. fallback-to-home helper callsite ≥ 2.

## Evaluation Outputs

그룹 단위 평가서 (`evaluations/group-{N}.md`) 필수 섹션:
1. Verdict (PASS / FIX / FAIL)
2. Critical / Major / Minor 이슈 (+ 태스크 ID + 파일/라인 + 재현 단계)
3. Regression check 결과
4. KB pattern 게이트 결과 (8개 각각 per-task)
5. Lessons for Next Group (차기 그룹 Contract 에서 선제 반영할 항목)
