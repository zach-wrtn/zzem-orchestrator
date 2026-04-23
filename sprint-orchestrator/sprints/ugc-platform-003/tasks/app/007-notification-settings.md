# app-007 · 알림 설정 screen (4 토글)

- **Group**: 004
- **Owner**: fe-engineer
- **Depends on**: be-007 (GET/PATCH /v2/me/notification-settings)

## Target

`app/apps/MemeApp/src/` 내:
- 신규 `presentation/notification-settings/notification-settings.screen.tsx`
- 신규 `presentation/notification-settings/components/notification-toggle-row.tsx` (iOS-style Switch row)
- 신규 `presentation/notification-settings/hooks/use-notification-settings.ts` (GET)
- 신규 `presentation/notification-settings/hooks/use-update-notification-settings.ts` (PATCH mutation + optimistic)
- 기존 `presentation/settings/components/settings-body.tsx` — "알림 설정" 메뉴 항목 활성화 (ComingSoon → 실제 screen 연결)
- 기존 `presentation/settings/components/coming-soon-settings-section.tsx` — "알림 설정" 제거
- 기존 `app/navigation/root-navigator.tsx` (Stack.Screen 등록)
- 기존 `shared/routes/link-screens.ts` (`NotificationSettings: "notification-settings"`)
- 기존 `app/navigation/useNavigationLinking.ts` (AUTH_REQUIRED_PATHS)
- 관련 Maestro E2E

## Context

AC 5.5: 4 토글 (푸시 알림 전체 / 좋아요 / 소식 / 팔로우). 디폴트 전부 ON. 크레딧 페이백은 토글 없음 (UI 미노출). pushAll=false 시 하위 3 토글 **disabled** (BE 가 응답 상 false 강제 표시 — FE 는 그 값을 그대로 신뢰하여 렌더, fallback 금지).

기존 Phase 2 PublishToggleRow 에서 iOS-style Switch 51×31 패턴 사용 — 동일 visual 시스템 재사용.

## Objective

알림 설정 screen 완결. settings body canonical order 불변 + ComingSoon 에서 "알림 설정" 제거.

## Specification

### NotificationSettingsScreen

- 상단 헤더: "알림 설정" + back button.
- Body: `NotificationToggleRow` 4개.
  1. `pushAll` — 라벨 "푸시 알림" (sub: "전체 알림 on/off"). 최상단 section.
  2. `like` — 라벨 "좋아요 알림".
  3. `news` — 라벨 "소식 알림".
  4. `follow` — 라벨 "팔로우 알림".
- 2~4 는 pushAll=false 시 opacity 0.4 + onPress noop (시각 disabled, tap 비활성). BE 응답이 이미 false 강제 표시이므로 Switch value=false 로 렌더됨.
- 크레딧 페이백 토글은 UI 미노출 (AC 5.5 명시).

### NotificationToggleRow

- Props: `{ label: string, sublabel?: string, value: boolean, onToggle: (next: boolean) => void, disabled?: boolean }`.
- Layout: label + Switch 우측.
- Switch: iOS-style 51×31 (Phase 2 PublishToggleRow 참조).
- disabled=true → Switch pointerEvents="none" + opacity 0.4.

### GET 조회

- Screen mount 시 `useQuery(['notification-settings'])` → BE 응답 그대로 state 초기화. Fallback 금지 (필드 누락 시 Zod parse 실패 → retry 또는 error 분기).
- Loading: skeleton row.
- Error: standard error banner.

### PATCH mutation

- Toggle onPress → `updateSettings.mutate({ [field]: !currentValue })`.
- Optimistic update: React Query `onMutate` 에서 cache 업데이트. `onError` rollback.
- Server response (200) 로 cache 교체.
- 403 PERSONA_NOTIFICATION_LOCKED → "페르소나 계정은 설정 변경 불가" Toast.

### Navigation wiring

- RootNavigator: `<Stack.Screen name="NotificationSettings" component={...} />`.
- link-screens: `NotificationSettings: "notification-settings"`.
- Deep link: `zzem://notification-settings`.
- AUTH_REQUIRED_PATHS 에 "notification-settings" 추가.
- SettingsBody 의 "알림 설정" onPress → navigate.

### Out of Scope

- 크레딧 페이백 토글 (PRD 명시 제외).
- 시간대 DND / 방해 금지.
- 개별 알림 카테고리 세부 설정.

## Acceptance Criteria

- [ ] NotificationSettingsScreen 이 zzem://notification-settings 딥링크 + Settings → 알림 설정 양쪽 진입에서 정상 렌더.
- [ ] 4 토글 라벨 exact: "푸시 알림", "좋아요 알림", "소식 알림", "팔로우 알림".
- [ ] 크레딧 페이백 토글 UI 미노출 (AC 5.5).
- [ ] pushAll=false 시 하위 3 토글 disabled visual (opacity + noop onPress) + Switch value=false 로 렌더 (BE 응답 그대로 신뢰).
- [ ] Toggle tap → PATCH mutation + optimistic update 동작. 실패 시 rollback.
- [ ] 403 PERSONA_NOTIFICATION_LOCKED 시 Toast "페르소나 계정은 설정 변경 불가".
- [ ] Mapper fallback 금지 grep: `rg '\?\?\s*true|\?\?\s*false|\|\|\s*false|\|\|\s*true' app/apps/MemeApp/src/presentation/notification-settings → 0 hit` (completeness-008).
- [ ] Dead hook 금지 grep: `rg 'useNotificationSettings\(|useUpdateNotificationSettings\(' app/apps/MemeApp/src → 각 ≥ 2 hit`.
- [ ] Settings body canonical order 회귀 없음: "알림 설정" → "차단 관리" (app-004) → "고객센터" 순서. ComingSoon 에서 "알림 설정" 제거 확인.
- [ ] Cross-component 영향 전수: settings-body.tsx (메뉴 activate), coming-soon-settings-section.tsx (알림 설정 제거), root-navigator.tsx, link-screens.ts, useNavigationLinking.ts + notification-settings/ 신규. 외 파일 수정 금지.
- [ ] E2E flow 생성: `apps/MemeApp/e2e/flows/settings-notification-settings.yaml` — appId + zzem://notification-settings 딥링크 → 4 토글 라벨 assertVisible. Switch tap 은 Maestro 한계 (assertVisible 만 — 토글 결과는 Evaluator 코드 트레이스).
- [ ] lint / typecheck / tsc --noEmit 신규 에러 0.

## Implementation Hints

- Switch: 기존 Phase 2 `PublishToggleRow` 컴포넌트 패턴 참조 (iOS-style 51×31).
- 라벨 + subtext layout 은 기존 settings menu row 패턴 참조.
- Optimistic mutation: React Query `onMutate` / `onError` / `onSettled` 표준 패턴.
- Toast: 기존 Toast 컴포넌트 재사용.
- Zod schema: `z.object({pushAll: z.boolean(), like: z.boolean(), news: z.boolean(), follow: z.boolean()})` — 필수 4 필드 강제.

## Regression Guard

- Settings body canonical order 불변.
- "차단 관리" 메뉴 (app-004 담당) 연결 상태 유지.
- "고객센터" ComingSoon stub 유지.
- Phase 2 PublishToggleRow 동작 회귀 없음 (같은 Switch visual 재사용하되 기존 컴포넌트 수정 금지).
- Cross-component 영향 전수: notification-settings/ 신규 + settings-body.tsx + coming-soon-settings-section.tsx + root-navigator.tsx + link-screens.ts + useNavigationLinking.ts. 외 파일 수정 금지.
