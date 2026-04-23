# Group 004 Summary: ugc-platform-003

**Date**: 2026-04-23
**Result**: PASS / ACCEPTED (Round 2)
**Fix loops**: 1

## Scope
- Tasks: app-006 (NotificationCenter + HomeHeader bell), app-007 (NotificationSettings), app-008 (usePushNotificationHandler 확장)

## Issues Found & Resolved

| # | Severity | Issue | Resolution | Commit |
|---|----------|-------|-----------|--------|
| M1 | Major | app-008 unit test LIKE foreground assertion expected `["notifications"]` / `["notifications-unread-count"]` but handler uses `notificationQueryKey.myNotifications` / `.unreadCount` (`["@notification", ...]`) after reconciliation | Test imports `notificationQueryKey` from `~/data/notification` — drift-proof assertion | `af6aa8125` |

## Minor Deferred (retrospective)

1. **m1 — Foreground malformed-fallback path un-tested**: 5 unit test cases cover 2 regression + 3 new types + 1 PAYBACK malformed (background). Foreground malformed fallback branch (`isFallback → FOREGROUND_PARSE_ERROR_TOAST_MESSAGE`) not directly tested. Low risk — small code block, exercised by branch logic symmetry.
2. **m2 — `useUnreadCount ? 0` style**: HomeHeaderBellButton uses `unreadCount ?? 0` in red dot conditional. Technically matches KB completeness-008 pattern but purpose is render gate (not semantic fallback). Risk if rubric promotion tightens interpretation — annotate with `// Why: render gate, not value fallback`.
3. **m3 — HomeHeaderBellButton location**: Placed under `presentation/notification-center/components/` rather than spec's `presentation/home/componenets/home-header/`. Co-location with other notification components is pragmatic but diverges from task spec. Architectural guideline needed — for retrospective discussion.

## Cross-task Integration Confirmations

- **notificationQueryKey**: exported by app-006 at `data/notification/notification.query-key.ts` → imported by app-008 for push handler invalidation (reconciliation verified).
- **Settings canonical order**: `ComingSoonSettingsSection` renders `topSlot (app-007 "알림 설정") → middleSlot (app-004 "차단 관리") → "고객센터"`. Non-breaking additive design.
- **HomeHeader**: bell button additive — coin + MyButton 위치/testIDs/handlers 불변.
- **usePushNotificationHandler**: existing `meme-gen-complete` / `meme-gen-error` paths byte-identical (regression-free).
- **data.appLink SSOT**: app-008 consumes `message.data.appLink` matching be-006 Kafka payload (NOT `deeplink`).

## Lessons for Next Sprint (retrospective)

1. **Test assertions via typed imports**: hardcoded string-array literals in tests drift from production constants. Always `import { <queryKey> }` from the canonical source — Group 004 M1 fix pattern.
2. **Minor deferred: `?? 0` as render gate vs fallback**: need rubric clarification on render-logic `??` vs semantic fallback `??`. Comment convention (`// Why: render gate`) may need KB pattern doc.
3. **Component co-location vs feature co-location**: HomeHeaderBellButton (notification-center/components/) vs spec's (home-header/). Architectural principle decision needed.
4. **Foreground malformed fallback test**: edge case not directly covered in Group 004. Add to skill checklist — "new type test cases must include {happy, parse-failure} × {fg, bg} = 4 matrix".

## Files Changed

### app (sprint/ugc-platform-003)
- `domain/notification/` (entity, repository interface)
- `data/notification/` (DTO, mapper, repo impl, query keys)
- `domain/notification-setting/` (entity, repository)
- `data/notification-setting/` (DTO, mapper, repo impl, query keys)
- `presentation/notification-center/` (screen + 4 components + 3 hooks)
- `presentation/notification-settings/` (screen + toggle row + 2 hooks)
- `presentation/shared/hooks/usePushNotificationHandler.ts` (extended)
- `presentation/shared/hooks/lib/parse-push-payload.ts` (helper, 3 callsites)
- `presentation/shared/hooks/__tests__/usePushNotificationHandler.test.tsx` (5 cases)
- Modified: root-navigator, useNavigationLinking, link-screens, route.types, test-ids, home-header, settings-body, coming-soon-settings-section
- E2E: `home-to-notification-center.yaml`, `settings-notification-settings.yaml`

## Phase 4 Completion Metrics

- total_groups: 4 (Follow / Block+Report / Notification BE / Notification App)
- first_pass_rate: 0.50 (G2 + G3 first-try)
- avg_fix_cycles: 0.50 (G1=1, G2=0, G3=0, G4=1)
- critical_issues: 0
- major_issues_total: 3 (G1 M1+M2, G4 M1)
- issues_deferred (Minor): 14 (G1:4, G2:4, G3:3, G4:3)
- amendments_applied: 0 (auto-skipped Phase 3)

**Pressure trajectory**: Normal → Caution (G1 fix) → Normal (G1 PASS) → Normal (G2 PASS) → Normal (G3 PASS) → Caution (G4 fix) → Normal (G4 PASS).

## vs ugc-platform-002 (previous sprint)

- first_pass_rate: 0.33 → **0.50** (+0.17)
- avg_fix_cycles: 0.67 → **0.50** (-0.17)
- critical: 0 → 0
- major: 10 → 3 (-7, 큰 폭 감소)

Group 001+002+003 Lessons 선제 반영 효과 입증.
