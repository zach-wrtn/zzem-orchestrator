# Group 002 Summary: ugc-platform-002

## Scope

- **Tasks**: app-001 (SwipeFeed 액션 바), app-002 (더보기 + 삭제), app-003 (CTA 분기 + 재생성 플로우), app-004 (게시 토글 + 공개/비공개 시트)
- **Target**: `app/apps/MemeApp/src/presentation/swipe-feed/` + mapper/entity/usecase/route-types

## Result: PASS

- **Fix loops**: 1 회
- **Verdict (Round 2)**: PASS — Critical 0 / Major 0 / Minor (deferred)
- **Contract sign-off**: Round 2 APPROVED (patches 1~6 반영)

## Commits (on sprint/ugc-platform-002)

| SHA | Message |
|-----|---------|
| 28b1c0ff4 | feat(app-001): SwipeFeed action bar 재구성 + FeedItemEntity 확장 |
| b503a0bc6 | feat(app-002): MoreSheet 소유자 분기 + 삭제 플로우 |
| eabc632ef | feat(app-003): CTA 소유자 분기 + sourceContentId threading |
| b367ce896 | feat(app-004): PublishToggle + UnpublishConfirmSheet + custom-prompt 차단 |
| 51a01d645 | fix(app-group-002-r1): ownership threading + FilterDeletedErrorModal + e2e flows |

## Issues Found & Resolved

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | major | MY profile kind=me 진입 시 `userProfile.id=""` fallback 로 isOwn 항상 false → PublishToggle 미렌더 / CTA 오표시 (핵심 feature 비동작) | `isOwnOverride?: boolean` prop threading — `profileSource.kind === "me"` 시 true. Legacy/user path fallback 유지 |
| 2 | major | FilterDeletedErrorModal 이 Toast 로 fallback (Contract R2 Patch 1 미이행) | filter-deleted-error-modal.tsx 신규 helper + BottomSheetEventManager.emit 경유 single-action modal 호출. domain → shared/ui 경계 준수 |
| 3 | major | 신규 e2e flow 3개 전부 미생성 | swipe-feed-publish-toggle/custom-prompt-block/more-sheet.yaml 신규 (appId + deeplink + assertVisible) |

### Minor Deferred (non-blocking)
- Round 1 Minor m1 (mapper unit test 보강) — 별도 follow-up
- Round 2 Concerns: e2e flow 가 legacy deeplink 사용 (profile variant kind=me path end-to-end 미검증) — Phase 3 profile deeplink 확장 권장

## Lessons for Next Group (Group 003 — 좋아요 + 페이백 + 정리)

1. **Profile source → ownership 전달 패턴**: Group 002 의 `isOwnOverride` threading 은 Group 003 의 좋아요 탭 (`app-006`) 에서도 동일 적용 가능 (liked 탭 내 카드는 본인 콘텐츠 아닐 확률 높음 — 타유저 콘텐츠 좋아요).
2. **mapper fallback 주의**: Group 002 Major 1 (mapper `userProfile.id=""`) 은 entity 확장 시 초기값/fallback 이 semantic 을 깨뜨릴 수 있음. Group 003 의 좋아요 / 페이백 entity 에서도 동일 주의.
3. **Modal vs Toast 명확 구분**: Contract 가 Modal 요구 시 실제 컴포넌트 신설 의무. Group 003 의 PaybackIntroModal (app-007) 은 Modal 컴포넌트 신설 반드시.
4. **Domain → Presentation 경계**: Group 002 는 event bus (`BottomSheetEventManager.emit`) 경유로 해결. Group 003 의 페이백 모달 트리거도 동일 패턴 재사용 권장.
5. **e2e flow 생성 체크**: Contract §Scope 에 명시된 신규 flow 는 FE Engineer 구현 필수. Group 003 의 `payback-intro-modal.yaml` 누락 없도록.
6. **Legacy deeplink limitation**: profile variant 딥링크 확장 필요성 — Phase 5 전 검토.

## Regression Guard 확인

- [x] SwipeFeed discriminated union 3 variant 유지 (me / user / legacy)
- [x] Phase 1 `profile-to-swipe-feed.yaml`, `my-profile-default-landing.yaml` 등 기존 flow 호환 (코드 trace)
- [x] 좋아요 (ko-KR 콤마) vs 재생성 (korean-count 축약) 포매터 분리
- [x] route types 확장 후 callsite typecheck clean

## Next: Group 003 (좋아요 + 페이백 + 정리)

- Tasks: app-005 (좋아요 카운트), app-006 (좋아요 탭), app-007 (페이백 모달), app-008 (크레딧 히스토리 row), app-009 (Deferred items 정리)
- Contract: 다음 단계에서 draft + Evaluator review
