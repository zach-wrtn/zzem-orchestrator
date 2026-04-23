# app-008 · Push deeplink handler 확장 (LIKE/FOLLOW/PAYBACK)

- **Group**: 004
- **Owner**: fe-engineer
- **Depends on**: be-006 (push payload 규격 확정)

## Target

`app/apps/MemeApp/src/` 내:
- 기존 `presentation/shared/hooks/usePushNotificationHandler.ts` — 확장 (기존 meme-gen-complete / error 핸들링 회귀 없음)
- 신규 `presentation/shared/hooks/lib/parse-push-payload.ts` (순수 helper) — 가능 시 분리. 현 handler 가 소규모면 inline 유지 가능.
- 관련 unit test

## Context

AC 5.4: Push 3종 — LIKE (실시간, `zzem://contents/{contentId}`), FOLLOW (실시간, `zzem://profile/{userId}`), PAYBACK (배치, `zzem://credit-history`). Fallback: 파싱 실패 시 `zzem://home`.

기존 `usePushNotificationHandler` 는 Phase 2 까지 meme-gen-complete/error 2 type 을 처리 중. 본 태스크는 **확장** 만 수행 — 기존 type 핸들링은 회귀 금지.

Maestro native push simulation 한계 — e2e Deferred. 대체 검증: unit test (mocked FCM event) + 수동 QA (실제 device 에서 3 type push 수신 → navigation).

## Objective

Push payload type 분기 확장. 기존 동작 회귀 없음 + 새 3 type navigation + fallback 처리.

## Specification

### 기존 payload 구조 (회귀 기준)

- `message.data.appLink` (deep link string)
- `message.data.type` (기존: `meme-gen-complete` | `error`)
- `message.data.wrtn` (JSON extra data)

### 확장 type (BE be-006 와 일치)

- 신규 type 값: `LIKE`, `FOLLOW`, `PAYBACK` (uppercase enum — be-006 payload 참조).
- 각 type 의 `appLink` (또는 be-006 의 `deeplink` — 필드 이름 확정 후 통일):
  - LIKE → `zzem://contents/{contentId}`
  - FOLLOW → `zzem://profile/{userId}`
  - PAYBACK → `zzem://credit-history`

### Handler 동작

- **Foreground**: FCM `onMessage` 이벤트 수신.
  - 기존 meme-gen-complete/error → 기존 Toast 동작 유지.
  - 신규 3 type → Toast (title/body 사용) + `queryClient.invalidateQueries(['notifications'])` + `['notifications-unread-count'])` 로 red dot 즉시 갱신.
  - Navigation 자동 수행 안 함 (foreground 는 사용자가 앱을 보고 있으므로).
- **Background / Killed**: FCM `onNotificationOpenedApp` / `getInitialNotification` 에서 수신.
  - 기존 appLink 기반 네비 유지.
  - 신규 3 type 도 동일 appLink 네비 로직. `Linking.openURL(appLink)` 또는 navigation.navigate (기존 패턴 유지).
  - Parse 실패 (appLink undefined 또는 malformed) → `Linking.openURL('zzem://home')` fallback.

### parse-push-payload helper (optional)

- `parsePushPayload(rawData: FirebaseMessage): { type: string, appLink: string }`:
  - `appLink` 가 유효한 zzem:// URL 인지 검증 (regex). 아니면 `'zzem://home'` 반환.
  - `type` 이 known set 에 없으면 log warning + generic handling.
- helper 는 호출 경로 ≥ 2 (foreground, background) — dead 금지 (completeness-009).

### Out of Scope

- Push 발송 BE 로직 (be-006 담당).
- Notification 도메인 persistence (be-004 담당).
- Red dot 렌더 (app-006 담당 — 본 태스크는 invalidate trigger 만).
- 소식 알림 type (기 구현).

## Acceptance Criteria

- [ ] 기존 `meme-gen-complete` / `error` type 핸들링 회귀 없음 (unit test: 기존 event mock → 기존 동작 유지).
- [ ] 신규 `LIKE` / `FOLLOW` / `PAYBACK` type 에 대해:
  - [ ] Foreground: Toast 렌더 + queryClient invalidate `['notifications']` + `['notifications-unread-count']`.
  - [ ] Background: appLink 로 navigation.
- [ ] Malformed appLink (undefined, 비-zzem URL) → `zzem://home` fallback.
- [ ] `parsePushPayload` helper (또는 inline 로직) callsite ≥ 2 (foreground + background) — `rg 'parsePushPayload\(' app/apps/MemeApp/src → ≥ 2 hit` (정의 + ≥ 2 callsite, completeness-009).
- [ ] Cross-component 전수: `usePushNotificationHandler.ts` 만 수정. callsite 는 `root-navigator.tsx` (기존) — 변경 없음. 외 파일 수정 금지 (completeness-010).
- [ ] MMKV only — AsyncStorage import 금지: `rg '@react-native-async-storage' app/apps/MemeApp/src/presentation/shared → 0 hit` (integration storage primitive).
- [ ] Mapper fallback 금지 grep: `rg '\?\?\s*""|\?\?\s*false|\|\|\s*""' app/apps/MemeApp/src/presentation/shared/hooks/usePushNotificationHandler.ts → 0 hit` (except fallback-to-home 은 명시적 분기이므로 제외).
- [ ] Unit test 커버: 5 케이스 (기존 2 type × 동작 유지, 신규 3 type × 동작).
- [ ] E2E: Deferred — Maestro 한계로 native push simulation 불가. e2e-flow-plan.md 에 명시.
- [ ] lint / typecheck / tsc --noEmit 신규 에러 0.

## Implementation Hints

- 기존 handler 구조를 `switch (type)` 또는 `if-else` chain 으로 확장 — 기존 가독성 유지.
- `@react-native-firebase/messaging` import 경로 + event API 는 기존 코드 그대로 사용.
- `queryClient.invalidateQueries(['notifications'])` 는 React Query v5 API — 프로젝트 v4 사용 시 `invalidateQueries({queryKey: ['notifications']})`. 기존 사용 패턴 grep 으로 확인.
- Toast: 기존 toast util 재사용 (meme-gen-complete 와 동일 경로).
- FCM permission 상태 변경 감지는 본 태스크 scope 외 (app-006 의 PushPermissionBanner 가 focus 시 refetch).

## Regression Guard

- 기존 meme-gen-complete / error type 핸들링 불변: 파싱, Toast 문구, navigation (unit test 로 검증).
- message.data.wrtn JSON extra 파싱 (기존) 미간섭.
- Root navigator hook 호출부 미변경 (callsite 추가 없음).
- AsyncStorage 도입 금지 (storage primitive 오용 방지, Phase 2 교훈).
- Cross-component 영향 전수: `usePushNotificationHandler.ts` 만. 외 파일 수정 금지.
