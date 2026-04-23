# app-006 · 알림센터 screen + 홈 헤더 벨 아이콘 + Red dot

- **Group**: 004
- **Owner**: fe-engineer
- **Depends on**: be-005 (GET /v2/me/notifications, unread-count, read-all)

## Target

`app/apps/MemeApp/src/` 내:
- 신규 `presentation/notification-center/notification-center.screen.tsx`
- 신규 `presentation/notification-center/components/notification-list-item.tsx`
- 신규 `presentation/notification-center/components/push-permission-banner.tsx`
- 신규 `presentation/notification-center/components/notification-empty-state.tsx`
- 신규 `presentation/notification-center/hooks/use-notifications.ts` (infiniteQuery)
- 신규 `presentation/notification-center/hooks/use-unread-count.ts`
- 신규 `presentation/notification-center/hooks/use-mark-all-read.ts`
- 신규 `presentation/home/componenets/home-header/home-header-bell-button.tsx`
- 기존 `presentation/home/componenets/home-header/home-header.tsx` — bell button 추가 (코인/MyButton 미변경)
- 기존 `app/navigation/root-navigator.tsx` (Stack.Screen 등록)
- 기존 `shared/routes/link-screens.ts` (`NotificationCenter: "notifications"`)
- 기존 `app/navigation/useNavigationLinking.ts` (AUTH_REQUIRED_PATHS)
- 관련 Maestro E2E

## Context

AC 5.3: 홈 헤더 우상단 벨 아이콘 + Red dot (미확인 알림 존재 시) → 탭 시 알림센터 진입 + 일괄 읽음 처리. 단일 시간역순 리스트, 탭 필터 없음. 빈 상태 문구 / 푸시 권한 배너 / 카테고리 dot 색상.

Phase 3 프로토타입 단계에서 카테고리 dot 색상 + 레이아웃 확정. 본 태스크 spec 은 컴포넌트 경계 + 동작 정의.

## Objective

알림센터 screen + 홈 헤더 bell + red dot + 탭 동작 완결.

## Specification

### HomeHeaderBellButton

- Position: HomeHeader 우상단 (기존 코인 아이콘 + MyButton 라인에 합류).
- Icon: bell (svg, 기존 icon set 에 없으면 신규 추가).
- Red dot: `unreadCount > 0` 시 top-right corner 에 small circle (8×8, primary red). 0 이면 렌더 안 함.
- onPress → `navigation.navigate("NotificationCenter")` + `markAllReadMutation.mutate()` (fire-and-forget, invalidate 후 unreadCount=0 로 전환).
- Cross-component 전수: HomeHeader 만 수정. 기존 MyButton, 코인 아이콘 layout 미간섭 (차지 공간 추가).

### NotificationCenterScreen

- 상단 헤더: "알림" + back button.
- 조건부 최상단 `PushPermissionBanner`: FCM `messaging().hasPermission()` 결과 가 `AuthorizationStatus.AUTHORIZED|PROVISIONAL` 이 아니면 렌더. "휴대폰의 앱 알림이 꺼져있어요" + "알림 켜기" 버튼 → `Linking.openSettings()`.
- List: `useInfiniteQuery(['notifications'], ...)` → FlatList/FlashList.
- Empty state: list 길이 0 + loading 아님 시 `NotificationEmptyState` 렌더. 문구 "아직 도착한 알림이 없어요".
- Tap 동작: NotificationItem 의 `deeplink` 사용. Linking.openURL(notification.deeplink).catch(() => Linking.openURL('zzem://home')) 패턴. LIKE→콘텐츠, FOLLOW→프로필, PAYBACK→크레딧 히스토리.

### NotificationListItem

- Layout: left avatar (actorUserId profileImage) + title + createdAt (e.g. "5분 전") + right thumbnail (PAYBACK 은 null 이므로 skip).
- 카테고리 dot: LIKE/FOLLOW/PAYBACK 각 색상 — 프로토타입 확정. (현재 spec: LIKE=primary-pink, FOLLOW=primary-blue, PAYBACK=primary-yellow 임시 — 프로토타입 승인 시 확정).
- `unread === true` 시 배경 tint (subtle) 또는 dot 진한 색. 읽음 시 기본 배경.
- Mapper: BE NotificationItem → view model. Zod 필수 필드 강제 (type, title, unread, deeplink, createdAt). 파싱 실패 시 item skip (fallback 금지 completeness-008).

### markAllRead 로직

- Bell button 탭 시 실행 → BE 호출 + `queryClient.invalidateQueries(['notifications'])` + `queryClient.invalidateQueries(['notifications-unread-count'])`.
- Optimistic: unreadCount 즉시 0 설정.

### Navigation wiring

- RootNavigator: `<Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />`.
- link-screens: `NotificationCenter: "notifications"`.
- Deep link: `zzem://notifications`. 로그인 필수이므로 `AUTH_REQUIRED_PATHS` 에 추가.

### Polling / refetch

- unread-count 는 focus 시 refetch (useFocusEffect 또는 React Query `refetchOnWindowFocus`).
- Push 수신 시 invalidate (app-008 이 담당).

### Out of Scope

- 탭 카테고리 필터 (AC 5.3 명시 제외).
- 알림 삭제 swipe (scope 외).
- 개별 알림 읽음 처리 (read-all 만).
- 소식 알림 UX (기 구현).

## Acceptance Criteria

- [ ] HomeHeaderBellButton 이 HomeHeader 에 추가되어 우상단에 bell + unreadCount>0 시 red dot 노출. 코인 아이콘/MyButton 기존 동작 미변경.
- [ ] Bell 탭 → NotificationCenter 진입 + markAllRead mutation 호출 + unreadCount 0 전환.
- [ ] NotificationCenterScreen: 상단 "알림" + list + empty state "아직 도착한 알림이 없어요".
- [ ] FCM 권한 없을 시 PushPermissionBanner 노출 + "알림 켜기" 탭 → Linking.openSettings().
- [ ] Cursor pagination (useInfiniteQuery) onEndReached 동작 (seed 30건 → 2 page 이상 렌더).
- [ ] NotificationItem tap → deeplink 동작 (LIKE/FOLLOW/PAYBACK 각 타입별 destination 렌더 확인). Malformed deeplink → zzem://home fallback (unit test).
- [ ] Mapper 필수 필드 누락 시 item skip: `rg '\?\?\s*false|\?\?\s*""|\?\?\s*0' app/apps/MemeApp/src/presentation/notification-center → 0 hit` (completeness-008).
- [ ] Dead hook 금지: `rg 'useNotifications\(|useUnreadCount\(|useMarkAllRead\(' app/apps/MemeApp/src → 각 hook ≥ 2 hit` (정의 + callsite).
- [ ] RootNavigator + link-screens + AUTH_REQUIRED_PATHS 등록. zzem://notifications 딥링크 동작.
- [ ] Cross-component 전수 나열: HomeHeader (bell 추가), RootNavigator, link-screens, useNavigationLinking. 외 파일 수정 금지.
- [ ] E2E flow 생성: `apps/MemeApp/e2e/flows/home-to-notification-center.yaml` — appId + zzem://notifications 딥링크 → "알림" title assertVisible + (seed 존재 시) 최소 1 item title assertVisible (CTA 탭 후 deeplink 이동은 코드 트레이스 위임).
- [ ] E2E seed: caller 에게 최소 LIKE/FOLLOW 각 1건 Notification 주입 (e2e-seed-plan.md 반영).
- [ ] lint / typecheck / tsc --noEmit 신규 에러 0.

## Implementation Hints

- FCM permission check: 기존 `usePushNotificationHandler.ts` 이미 FCM import 사용 중 — 권한 util 분리 필요하면 `shared/lib/fcm/push-permission.ts` 로 helper 추가.
- Infinite list: 기존 `meme-collection.screen.tsx` 의 `onEndReached` + cursor 패턴.
- Typo/Text 컴포넌트 및 색상 토큰은 기존 패키지 (wds-tokens symlink) 재사용.
- Red dot 은 `shared/ui/badge` 있다면 재사용. 없으면 absolute positioned View.
- PushPermissionBanner tap → `Linking.openSettings()` (`react-native` Linking API).

## Regression Guard

- HomeHeader 기존 요소 (코인, MyButton) 의 위치/동작/tap 영역 미변경.
- 세로 스와이프 피드, 프로필, 설정, meme-viewer 등 다른 screen 미간섭.
- Phase 2 push (meme-gen-complete) handler 미간섭 (app-008 별도 태스크).
- Cross-component 영향 전수: home-header.tsx (bell button 추가), notification-center/ 신규 디렉토리, root-navigator.tsx (Stack.Screen), link-screens.ts, useNavigationLinking.ts. 외 파일 수정 금지.
