# Sprint Contract: Group 004 — Notification App (DRAFT — pending Group 003 PASS)

> Sprint Lead 선행 초안. Group 003 의 endpoints / push payload 최종 확정 후 재검증.

## Scope

- **Sprint**: ugc-platform-003
- **Tasks**:
  - `app-006`: NotificationCenter screen + HomeHeaderBellButton + RedDot + PushPermissionBanner + Empty state
  - `app-007`: NotificationSettings screen (4 토글) + Settings "알림 설정" entry activate
  - `app-008`: usePushNotificationHandler 확장 (LIKE/FOLLOW/PAYBACK type)
- **Consumed endpoints**:
  - GET `/v2/me/notifications` (cursor)
  - GET `/v2/me/notifications/unread-count`
  - POST `/v2/me/notifications/read-all`
  - GET / PATCH `/v2/me/notification-settings`

## Cross-group Integration

- **Group 003 종속**: endpoints schema 확정, push payload 의 `data.type` 값 (LIKE/FOLLOW/PAYBACK uppercase 일치), deeplink 필드명 일관 (예: `data.appLink` 기존 유지 or `deeplink` 신규).
- **Phase 2 종속 (회귀 기준)**: 기존 `usePushNotificationHandler.ts` 의 `meme-gen-complete` / `error` type 핸들링 불변.

## Done Criteria

### app-006 (App — NotificationCenter screen + bell)

- [ ] HomeHeaderBellButton at HomeHeader 우상단 (코인 + MyButton 라인). bell icon + `unreadCount > 0` 시 red dot overlay.
- [ ] Bell tap → `navigation.navigate("NotificationCenter")` + `useMarkAllRead().mutate()` (parallel fire). Optimistic unreadCount=0.
- [ ] NotificationCenterScreen: 헤더 "알림", cursor paging list (`useInfiniteQuery(['notifications'])`), empty state "아직 도착한 알림이 없어요".
- [ ] PushPermissionBanner: FCM `hasPermission()` AUTHORIZED/PROVISIONAL 아니면 상단 배너 렌더 "휴대폰의 앱 알림이 꺼져있어요" + "알림 켜기" 버튼 → `Linking.openSettings()`.
- [ ] NotificationListItem: avatar + title + createdAt (relative) + thumbnail (LIKE only). 카테고리 dot: LIKE=primary-pink, FOLLOW=primary-blue, PAYBACK=primary-yellow (임시 — 디자인 확정 대기).
- [ ] Tap → `Linking.openURL(item.deeplink)` + parse 실패 시 `zzem://home` fallback.
- [ ] RootNavigator + link-screens (`NotificationCenter: "notifications"`) + AUTH_REQUIRED_PATHS.

### app-007 (App — NotificationSettings screen)

- [ ] NotificationSettingsScreen: 4 토글 row ("푸시 알림", "좋아요 알림", "소식 알림", "팔로우 알림").
- [ ] NotificationToggleRow: iOS Switch 51×31 (Phase 2 PublishToggleRow 재사용 패턴).
- [ ] pushAll=false 응답 시 하위 3 토글 visually disabled + Switch value=false 로 렌더 (BE 응답 신뢰).
- [ ] Toggle tap → PATCH optimistic + rollback on error. 403 → Toast "페르소나 계정은 설정 변경 불가".
- [ ] Settings body "알림 설정" 메뉴 activate (ComingSoon 에서 제거). Canonical order: "알림 설정" → "차단 관리" → "고객센터" 불변.
- [ ] 크레딧 페이백 토글 UI 미노출.
- [ ] RootNavigator + link-screens (`NotificationSettings: "notification-settings"`) + AUTH_REQUIRED_PATHS.

### app-008 (App — Push handler 확장)

- [ ] 기존 `usePushNotificationHandler.ts` 확장. 기존 `meme-gen-complete` / `error` type 동작 불변.
- [ ] 신규 type `LIKE` / `FOLLOW` / `PAYBACK`:
  - Foreground: Toast 표시 + `queryClient.invalidateQueries(['notifications'])` + `['notifications-unread-count'])`.
  - Background/Killed: `Linking.openURL(data.appLink || data.deeplink)` 또는 기존 navigation 패턴. parse 실패 시 `zzem://home`.
- [ ] `parsePushPayload(message)` helper (또는 inline) — callsite ≥ 2 (foreground + background).
- [ ] Unit test: 5 케이스 (기존 2 type 회귀 + 신규 3 type).
- [ ] E2E Deferred — Maestro native push 한계. 수동 QA 체크리스트 PR body 포함.

## Verification Method

| Criterion | 검증 방법 |
|-----------|----------|
| Bell + red dot conditional | Component test: unreadCount mock 0 / >0 → dot 렌더 toggle |
| Bell tap 동시 2 동작 | Mutation spy: mark-all-read.mutate 호출 확인 |
| Empty state | useInfiniteQuery data.length=0 → empty state 렌더 |
| PushPermissionBanner | FCM hasPermission mock → 배너 conditional |
| deeplink parse fallback | malformed URL input → zzem://home으로 분기 |
| 4 토글 label 정확 | Snapshot test — label text exact |
| pushAll=false visual disabled | BE response pushAll=false → Switch disabled + value=false |
| 403 persona Toast | PATCH mock 403 → Toast 문구 확인 |
| Push handler 기존 동작 | Unit test: meme-gen-complete event → 기존 Toast |
| Push handler 신규 3 type | Unit test: LIKE event → Toast + queryClient.invalidateQueries |

### Default Verification Gates

- [ ] **Mapper fallback 금지** (KB: completeness-008):
  - `rg '\?\?\s*false|\?\?\s*0|\?\?\s*""' app/apps/MemeApp/src/presentation/notification-center app/apps/MemeApp/src/presentation/notification-settings → 0 hit` (단, deeplink fallback-to-home 은 명시적 분기 — 예외).
  - Zod NotificationItem 필수 필드 강제.
- [ ] **Dead hook 금지** (KB: completeness-009):
  - `rg 'useNotifications\(|useUnreadCount\(|useMarkAllRead\(' app/apps/MemeApp/src → 각 ≥ 2 hit`.
  - `rg 'useNotificationSettings\(|useUpdateNotificationSettings\(' app/apps/MemeApp/src → 각 ≥ 2 hit`.
  - `rg 'parsePushPayload\(' app/apps/MemeApp/src → ≥ 2 hit`.
- [ ] **Cross-component 전수** (KB: completeness-010):
  - HomeHeader 수정: bell button 추가만, 기존 코인/MyButton 위치/동작 미변경.
  - usePushNotificationHandler callsite: RootNavigator (기존) — 추가 callsite 없음.
  - settings-body + coming-soon-settings-section: "알림 설정" + "차단 관리" 활성화 (app-004 와 중복 편집 — merge 시 순서 주의).
- [ ] **Storage primitive** (KB: integration — mmkv):
  - `rg '@react-native-async-storage' app/apps/MemeApp/src/presentation/notification-center app/apps/MemeApp/src/presentation/notification-settings app/apps/MemeApp/src/presentation/shared/hooks → 0 hit`.
- [ ] **FE typecheck**: `yarn typescript` 신규 error 0 (pre-existing cascade 제외).

## Edge Cases to Test

- Unread 0 → bell red dot 렌더 안 함.
- Bell tap 직후 markAllRead 에러 → 사용자 경험 영향 없음 (navigate 완료).
- Notification list empty → empty state.
- FCM permission denied → PushPermissionBanner 렌더 + tap → openSettings.
- deeplink malformed → zzem://home fallback.
- pushAll OFF 상태에서 like=true 로 변경 시도 (user tap) → onPress noop (disabled), BE 로 req 안 감.
- 페르소나 계정이 어떻게든 settings 진입 시 403 → Toast.
- Push handler foreground: LIKE event → Toast + invalidate.
- Push handler background (killed app): PAYBACK event → `zzem://credit-history` 로 cold-start 네비.

## Business Rules to Validate

- AC 5.3: 벨 아이콘 진입 + 일괄 읽음 + 시간순 단일 리스트 + 빈 상태 + 푸시 권한 배너.
- AC 5.4: 3 type 템플릿 + fallback zzem://home.
- AC 5.5: 4 토글 + 페이백 토글 미노출 + pushAll OFF 비활성화 UX.

## Regression Guard

- [ ] HomeHeader 코인 아이콘 + MyButton 위치/동작 불변 (bell 추가만).
- [ ] Phase 2 meme-gen-complete push 동작 불변.
- [ ] SettingsBody canonical order 불변 ("알림 설정" → "차단 관리" → "고객센터").
- [ ] app-004 와 settings-body 편집 충돌 시 "알림 설정" + "차단 관리" 둘 다 activate 상태 유지.
- [ ] Root Navigator 기존 screen 등록 불변.

## E2E Flows (required)

- `apps/MemeApp/e2e/flows/home-to-notification-center.yaml` — app-006 (seed notification 존재 상태)
- `apps/MemeApp/e2e/flows/settings-notification-settings.yaml` — app-007 (4 toggle label assertVisible)

Seed: fetch-seed-notifications.mjs (be-004/005 구현 후 test-seed endpoint).

## Sign-off

- Sprint Lead draft: 2026-04-23 (pending Group 003 PASS + push payload 필드명 확정)
- Evaluator review: pending
