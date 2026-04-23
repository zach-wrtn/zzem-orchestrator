# Evaluation: group-004 — Notification App

- Round: 1
- Verdict: ISSUES
- Date: 2026-04-23

## Summary

app-006 (NotificationCenter + bell + red-dot + PushPermissionBanner + empty state), app-007 (4-토글 + pushAll disabled + 403 Toast + single mutation hook), app-008 (push handler 확장 + parsePushPayload helper + 2 callsite) 의 핵심 AC 는 구현으로 확인됨. 네비 배선(RootNavigator + link-screens + AUTH_REQUIRED_PATHS), Settings canonical order (topSlot + middleSlot) 유지, mapper fallback 0 hit, AsyncStorage 0 hit, dead-hook ≥ 2 각각 통과. 그러나 app-008 unit test 의 assertion 이 실제 invalidate queryKey shape 와 불일치하여 as-shipped 로는 실패한다.

## Critical

(없음)

## Major

**M1 — app-008 unit test assertion mismatch (test-code 불일치, AC 위배)**
- 파일: `apps/MemeApp/src/presentation/shared/hooks/__tests__/usePushNotificationHandler.test.tsx:215-220`
- 현상: 테스트는 `invalidatedKeys` 가 `expect.arrayContaining([["notifications"], ["notifications-unread-count"]])` 를 만족하길 요구. 그러나 실제 handler (`usePushNotificationHandler.ts:111-115`) 는 `notificationQueryKey.myNotifications = ["@notification", "getMyNotifications"]` 및 `notificationQueryKey.unreadCount = ["@notification", "getUnreadCount"]` 로 invalidate. literal array 가 다르므로 `arrayContaining` 은 통과 불가 → **LIKE foreground test fail**.
- 원인: Sprint Contract 는 `['notifications']` 를 명시했으나 구현은 프로젝트 컨벤션 `@notification` prefix 를 채택. query-key 파일(`data/notification/notification.query-key.ts:13`) 은 그 1:1 를 주석화 했지만 테스트는 contract literal 을 그대로 사용.
- 수정 방향(택 1): (a) 테스트 assertion 을 `[["@notification", "getMyNotifications"], ["@notification", "getUnreadCount"]]` 로 교체, (b) 또는 `notificationQueryKey.myNotifications / .unreadCount` import 후 구조 매칭. (b) 권장 — 컨벤션 drift 재발 방지.
- AC 위배: app-008 §Acceptance Criteria "Unit test 커버: 5 케이스" — 실패하는 케이스 1 건.

## Minor

**m1 — 테스트 isNewPushType foreground fallback 미검증**
- `usePushNotificationHandler.ts:41-49` 는 `isNewPushType(type)` 일 때만 foreground fallback handleLinking 을 수행하는 분기를 포함하나 unit test 5 케이스 중 이 foreground malformed fallback 경로는 미커버. 재설계 시 보강 고려 (retrospective 이월).

**m2 — useUnreadCount render-gate coalesce 스타일**
- `use-unread-count.ts:36` 의 `data ? data.unreadCount : 0` 은 render-gate 목적(주석으로 명시) 이며 mapper fallback 이 아니므로 규칙 위반은 아님. 다만 grep 대상 패턴에 가까워 향후 completeness-008 승격 시 오탐 가능 — 주석 유지 + 또는 `unreadCount = data?.unreadCount` + conditional render 로 전환 고려.

**m3 — HomeHeaderBellButton 위치 (파일 경로)**
- 태스크 spec 은 `presentation/home/componenets/home-header/home-header-bell-button.tsx` 를 지정했으나 실제는 `presentation/notification-center/components/home-header-bell-button.tsx`. 기능/콜사이트는 정상이나 co-location 가이드라인 상 재배치 또는 barrel re-export 유지가 나음 (retrospective 언급).

## Regression Check

- `home-header.tsx` — 기존 coin + MyButton row 에 `<HomeHeaderBellButton />` 만 추가. testID / handler 불변. PASS.
- `usePushNotificationHandler.ts` — 기존 `meme-gen-complete` / `meme-gen-error` Toast(confirm) + onPressConfirm→handleLinking 블록(L67-95) 보존. 신규 3 type 분기는 이후 블록에 추가. PASS (로직 보존). 단위 테스트의 기존 2 회귀 케이스 2건은 assertion 정상.
- Settings body canonical order "알림 설정" → "차단 관리" → "고객센터" 유지 (topSlot=app-007 + middleSlot=app-004 + 본 섹션의 고객센터). PASS.
- Phase 1/2 shared (ProfileHeader, PublishToggleRow, MoreSheet) 미수정. PASS.
- Group 002 BlockManagement middleSlot + app-003 BlockConfirmSheet 미수정. PASS.

## KB Pattern Gates

- **completeness-008 (mapper fallback)**: `?? 0 | ?? false | ?? "" | || false | || true` grep → notification-center / notification-settings / data/domain notification-* 내 0 hit. PASS. (render-gate in use-unread-count 는 mapper 밖 — m2 참조.)
- **completeness-009 (dead hook ≥2)**: `useNotifications` (def + screen), `useUnreadCount` (def + bell), `useMarkAllRead` (def + bell), `useNotificationSettings` (def + screen), `useUpdateNotificationSettings` (def + screen), `parsePushPayload` (def + 2 callsites in handler). 각각 PASS.
- **completeness-010 (cross-component 전수)**: settings-body + coming-soon-settings-section 가 app-004 (middleSlot) + app-007 (topSlot) 양쪽을 올바르게 수용. canonical order backward-compat PASS.
- **Storage primitive**: `@react-native-async-storage` grep 0 hit in notification-center / notification-settings / presentation/shared/hooks. PASS.
- **E2E structure**: `home-to-notification-center.yaml` + `settings-notification-settings.yaml` 2개 생성, 양쪽 모두 `appId: com.wrtn.zzem.dev`. `assertVisible: "알림"` + 4 토글 라벨 검증 포함. PASS.
- **push field name**: `message.data.appLink` 사용 확인 (`deeplink` 미사용). Group 003 SSOT 준수. PASS.

## Cross-task Integration

- app-006 의 `notificationQueryKey.myNotifications / .unreadCount` partial key 가 app-008 에서 import 되어 invalidate 에 사용됨 — reconciliation 확인.
- NotificationSettings + NotificationCenter 두 screen 이 RootNavigator L189-194 에 각각 등록. link-screens 는 `notifications` / `notification-settings` 로 충돌 없음.
- AUTH_REQUIRED_PATHS 에 두 경로 모두 포함.
- HomeHeaderBellButton 이 `useAuthGuardUseCase().isGuest` 체크 후 guest 는 Login navigate + mutation 미호출 — 회귀 안전 처리.

## Lessons (for retrospective Phase 6)

1. **테스트 assertion 을 import 기반으로 작성** — contract literal (`['notifications']`) 로 테스트를 적고 구현은 컨벤션(`@notification` prefix)을 쓰는 drift 가 발생. 테스트가 `notificationQueryKey.myNotifications` 를 직접 import 했다면 자동 동기화. 차기 스프린트 테스트 가이드에 "query-key 검증 시 literal 대신 export 상수 import" 명문화.
2. **Contract 의 query-key literal 을 convention 과 동기화** — Group 003 Contract 는 `['notifications']` / `['notifications-unread-count']` 를 지정했으나 프로젝트 컨벤션은 `@<domain>` prefix. Contract 작성 시 실제 구현 컨벤션 기준으로 기술하거나 "project prefix 적용 후 consume" 을 명시.
3. **Shared test-mocks 로 `notificationQueryKey` 재사용** — app-008 테스트가 `~/data/notification` 전체 mock 대신 실물 `notificationQueryKey` 를 사용하면 invalidate shape drift 즉시 감지 가능. 현재 테스트는 mock 미사용이라 실제 key 를 읽어도 되나 literal 하드코딩이 문제.
4. **Bell button 배치 관례** — task spec 의 예상 경로(`presentation/home/...`) 대신 `presentation/notification-center/components/` 채택은 feature co-location 관점에선 타당하나 spec 과 괴리. 차기 스프린트에서 cross-feature 컴포넌트 경로 결정 원칙 기록.
5. **Switch pointerEvents 리뷰** — `notification-toggle-row.tsx:76` pointerEvents 속성이 Switch wrapper 전반에 전파되는지(내부 TouchableOpacity 까지 막는지) 런타임 QA 필요. 현 구조는 의도대로 동작할 가능성이 높으나 Phase 2 PublishToggleRow 패턴과의 회귀 비교 권장.

---

Verdict: **ISSUES** (Critical 0 + Major 1). app-008 unit test assertion (M1) 을 `notificationQueryKey` import 기반으로 교체하는 단일 fix 로 PASS 전환 가능.

---

## Round 2 Re-Evaluation (2026-04-23)

- **Verdict**: PASS
- **Fix verified**:
  - M1 (test assertion): ✓ — `af6aa8125` adds `import { notificationQueryKey } from "~/data/notification";` (L19) and replaces literal keys at L218-219 with `notificationQueryKey.myNotifications` / `notificationQueryKey.unreadCount` (drift-proof per Round 1 Lesson #1). Handler (`usePushNotificationHandler.ts:110-114`) unchanged and still invalidates the same 2 partial keys via `notificationQueryKey`; `notification.query-key.ts:30-31` confirms `myNotifications = ['@notification', 'getMyNotifications']` and `unreadCount = ['@notification', 'getUnreadCount']` — assertion shape now matches production at type level. Other 4 test cases (meme-gen-complete, meme-gen-error, FOLLOW background, PAYBACK malformed fallback) intact (lines 138-186, 227-271).
- **New issues**: none
- **Regression**: ✓ — `git diff af6aa8125^ af6aa8125 --stat` shows single file touched (`usePushNotificationHandler.test.tsx`, +4/-2), exactly matching the expected 2-edit scope (import + assertion block). No production code or other tests affected.
- **Final status**: ACCEPTED
