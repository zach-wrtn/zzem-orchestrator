# Group 003 Summary: ugc-platform-002

## Scope

- **Tasks**: app-005 (Like toggle + count), app-006 (Liked tab), app-007 (PaybackIntroModal), app-008 (CreditHistory PAYBACK row), app-009 (Deferred items 4 sub-fix)

## Result: PASS (First-try)

- **Fix loops**: 0 회 (직전 2 그룹 lessons 누적 효과 — 첫 시도 PASS)
- **Verdict**: PASS — Critical 0 / Major 0 / Minor 3 (non-blocking)
- **Contract sign-off**: Round 2 APPROVED (Patches 1~8 — 10/10 resolved)

## Commits (on sprint/ugc-platform-002)

| SHA | Message |
|-----|---------|
| 67196dd1d | feat(app-005): favorite toggle be-004 재배선 + fallback 금지 |
| 8152f422f | feat(app-006): MY profile liked tab 활성화 |
| (3rd) | feat(app-007): PaybackIntroModal + 1회성 gate hook |
| e0670d931 | feat(app-008): CreditHistory PAYBACK row variant |
| 8d61b872b | chore(app-009): deferred items cleanup (4 sub-fix) |

## Minor Deferred (non-blocking)

| # | Severity | Issue | Deferral Reason |
|---|----------|-------|-----------------|
| m1 | minor | `use-payback-intro.tsx` uses `useBottomConfirmSheet` — shared `enablePanDownToClose=true`. CTA-only close 미완 (backdrop/pan-down dismiss 가능) | 1회성 markShown() 즉시 호출로 regression 안전. UX polish로 다음 스프린트 follow-up |
| m2 | minor | `CreditMapper.EARNED_CHIP_TRANSACTION_TYPES` dead constant (0 callsite) | BE chip aggregation 의존 — Phase 3 (socio) 에서 BE 선례 확정 후 wiring |
| m3 | minor | Primary trigger `showPaybackIntro()` after `generateMeme(...)` 무조건 호출 (`result.isPublished === true` 조건 미체크) | 현행 auto-publish 정책 (AC 1.1) 전제에서 정상. 향후 "공개 옵션 disable" 사용자 옵션 도입 시 보강 |

## Top 3 Confirmations (what worked)

1. **Critical grep gates 모두 clean**:
   - `likeCount ?? 0 / liked ?? false` 0 hit (Group 002 M1 lesson)
   - `/reactions|REACTION.LIKE` 0 hit (app-005 endpoint migration)
   - `isLikedPhase1` 0 hit (app-006)
   - Clipboard from `react-native` 0 hit (app-009 sub-fix 3)
   - `usePaybackIntro()` 4 callsite (1 def + 3 trigger — filter-preview-footer, swipe-feed-footer, publish-toggle-row) — Dead-hook lesson adopted

2. **Cross-variant mapper + enabled gate integrity (rubric C12)**:
   - 3 진입 path 경유 `MemeMapper` 확인: legacy → `toFeedItemEntityCollection`, profile me/user → `toFeedItemEntityCollectionFromContentSummary`
   - `useGetProfileSwipeFeedUseCase` me/user 2-variant enabled gate + screen-level `isProfileVariant` 이중 게이트
   - Liked 는 me-variant 의 `visibility:'liked'` 로 분화
   - `isOwnOverride` threading (Group 002 패턴) 재사용

3. **userStorage MMKV + zod 필수 필드**:
   - `createStorageBuilder(userStorage).primitive("boolean").build()` 동기 I/O (AsyncStorage 0, Provider preload 없음)
   - `likeToggleResponseEntitySchema` 3 필드 필수 (contentId / liked / likeCount nonnegative int)
   - `FeedItemEntity / ContentSummary` likeCount/liked required — parse 실패 시 item skip

## Lessons for Next Sprint (ugc-platform-003)

1. **Lessons 누적 효과 검증**: Group 001 → 002 → 003 로 fix loop 횟수 감소 (1 → 1 → 0). Contract 에 이전 스프린트 패턴 patches 적극 적용하면 구현자 해석 폭 축소 효과 확인. 재사용 권장.
2. **Shared component 제약 인지**: Group 003 m1 (`useBottomConfirmSheet` panDown 하드코딩) 과 같은 shared UI 제약은 Contract 작성 시 "shared component 재사용 + 옵션 override 가능 여부" 사전 확인 필요.
3. **BE 의존성 명시**: Group 003 m2 (CreditMapper chip aggregation) 은 BE chip contract 가 다음 스프린트에서 확정되는 사례 — Contract 에 "BE 선행 의존" 명시 시 dead constant 방지 가능.
4. **Auto-publish 정책 결합도**: Group 003 m3 (PaybackIntro trigger 의 `isPublished` 조건 생략) 은 auto-publish 정책 (AC 1.1) 전제로 정당화 — 향후 사용자 publish 옵션 disable 도입 시 trigger 조건 보강 필요.

## Regression Guard

- [x] Phase 1 `my-profile-default-landing.yaml`, `other-user-profile.yaml`, `home-header-elements.yaml` 회귀 없음 (코드 trace)
- [x] Group 001 (be-003 payback / be-004 likes) endpoint consume 정합
- [x] Group 002 좋아요 (ko-KR 콤마) vs 재생성 (korean-count 축약) 포매터 분리 유지
- [x] SwipeFeed 4 variant (me.public|private|liked / user / legacy) 동작
- [x] Credit history 기존 row (충전/차감/환불) 회귀 없음

## Phase 4 Gate → Phase 5

- [x] 모든 그룹 ACCEPTED (Evaluator PASS × 3)
- [x] FAILED 그룹 0
- [x] 모든 checkpoint 생성 (group-001, group-002, group-003)
- [x] sprint 브랜치에 모든 커밋 반영 (BE 6 commits + FE 9 commits = 15 커밋)

→ Phase 5 (PR) 진입 가능.
