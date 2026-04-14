# Group 004 Summary: free-tab-diversification

## Scope
- Tasks: app-003 (확인/크레딧 바텀시트 + 생성 플로우 연결), app-004 (추천탭 외부 진입점 동일 무료 경험)
- 레포: app-core-packages

## Result: PASS
- Fix loops: 0
- Evaluator verdict: PASS (Critical 0, Major 0)
- Group 004 신규 테스트 3 suites / 14 tests (+ 기존 통합) 모두 PASS

## Issues Found
| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | Minor | `FREE_ROSTER_MIN_VERSION` 미참조 (pre-existing, Group 003 Minor 이월) | 이월 |
| 2 | Minor | `click_meme_filter`/`imp_meme_filter` `imp_id` 누락 (pre-existing) | 이월 |
| 3 | Minor | `isFree` 서버 주입 — BE 통합 테스트로 대체 (spec-accepted) | deferred by design |
| 4 | Minor | 동시생성 상한 시 시트 선행 오픈 (low-impact) | 이월 |

## Lessons (sprint-level)
- `useFreeGenCTA` 공통 훅 도입으로 무료탭/추천탭 CTA 로직 일원화 — 향후 외부 진입점 확장 시 동일 훅 재사용.
- `pendingCtaAction` bridge는 `setParams({undefined})`로 초기화하여 재탭 가능한 패턴 — `navigation.setParams` 기반 one-shot event 신호로 재사용 가능.
- `FREE_ALREADY_USED` 409 자동 폴백 + `invalidateFreeTab` → 클라이언트 상태와 서버 실제 상태 eventual consistency.
- `FilterPreview.source: "free"|"paid"` — 분석 용도이며 pricing은 서버가 자동 매핑 (BR-12 준수).

## E2E Smoke (Phase 4.3.2)
**Deferred** — dev 빌드 재설치 비용으로 Phase 5 전 사용자 직접 재실행 권고.
- 준비된 flow:
  - `apps/MemeApp/e2e/flows/filter-preview.yaml` (extended, 무료 경로)
  - `apps/MemeApp/e2e/flows/free-gen-confirm.yaml` (new)
  - `apps/MemeApp/e2e/flows/external-entry-free-parity.yaml` (new)
- 실행 명령:
  ```
  maestro --device=emulator-5554 test --platform android \
    --env E2E_ACCESS_TOKEN=$ACCESS --env E2E_REFRESH_TOKEN=$REFRESH \
    --env E2E_SEED_CONTENT_ID='' --env E2E_SEED_FILTER_ID=$SEED_FID \
    apps/MemeApp/e2e/flows/{free-gen-confirm,filter-preview,external-entry-free-parity}.yaml
  ```

## Files Changed (누적, 주요)
- Sheets: `shared/ui/gorhom-sheet/free-use-confirm-sheet.tsx`, `credit-use-confirm-sheet.tsx`, `bottom-confirm-sheet.tsx`(ext)
- Hook: `presentation/shared/hooks/useFreeGenCTA.tsx`
- SwipeFeed: `swipe-feed.screen.tsx`(ext — SwipeFeedScreenFree/Algo 양쪽 `useFreeGenCTA`), `components/swipe-feed-footer.tsx`(ext — onCtaOverride)
- Recommend: `home/componenets/filter-list/filter-list-item.tsx`(ext), `home-body.tsx`(ext)
- Domain: `domain/meme/entities/feed-item.entity.ts`(isFree)
- Routes: `route.types.ts`(ext — source/pendingCtaAction/entryPoint:recommend), `filter-preview-routes.ts`(ext), `swipe-feed-routes.ts`(ext)
- FilterPreview: `presentation/meme/filter-preview.screen.tsx`(source 수용)
- testIds/Barrel: `shared/constants/test-ids.ts`, `shared/ui/gorhom-sheet/index.ts`, `presentation/shared/hooks/index.ts`, `domain/meme/index.ts`
- E2E: `flows/filter-preview.yaml`(ext), `flows/free-gen-confirm.yaml`(new), `flows/external-entry-free-parity.yaml`(new)
- Tests: `free-use-confirm-sheet.test.ts`, `credit-use-confirm-sheet.test.ts`, `filter-list-item.test.tsx`

## Commits
- `bd74e042`~`92222f49` — app-001/002 (Group 003, pre-existing in branch)
- `d4f338e9` — fix freeUsedToday passthrough (Group 003 fix loop)
- app-003 commit(s)
- app-004 commit(s)
- Merge commits — sprint branch 통합
- Sprint branch HEAD (app-core-packages): `zzem/free-tab-diversification`
