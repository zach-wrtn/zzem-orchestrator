# Group 003 Summary: free-tab-diversification

## Scope
- Tasks: app-001 (무료탭 N그리드 + 배너 + 레드닷 + 스크롤 복원), app-002 (SwipeFeed 무료 전용 모드 + circular scroll + CTA 상태)
- 레포: app-core-packages

## Result: PASS (Fix Loop #1 후)
- Fix loops: 1
- Evaluator verdict: Initial ISSUES (Major 1) → Fix Loop #1 PASS
- Sprint tests: 16 PASS (useTabScrollRestore + free-mode 통합)

## Issues Found & Resolved
| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | Major | `FreeTabScreen.handleCardPress` navigation에 `freeUsedToday` 누락 → SwipeFeed CTA 잘못 분기 (AC 2.6.2) | `freeUsedToday: usage?.freeUsedToday ?? false` passthrough (`d4f338e9`) |
| 2 | Minor | `FREE_ROSTER_MIN_VERSION` 상수 선언만 존재, 참조 없음 | 이월 |
| 3 | Minor | `click_meme_filter`/`imp_meme_filter` payload에 `imp_id` 누락 | 이월 — pre-existing home module 패턴 |
| 4 | Minor | `zzem://swipe-feed/free` deep link 직진입 후 뒤로가기 → recommend tab fallback (AC 2.3.2 edge) | 이월 |
| 5 | Minor | `filters.findIndex` 인상/탭마다 호출 (perf) | 이월 |

## E2E Smoke (Phase 4.3.2)
- `home-tabs.yaml` — PASS (무료탭 그리드 assertVisible)
- `free-tab-grid.yaml` — PASS (deep link + banner state 분기)
- `swipe-feed.yaml` — FAIL (환경 문제: E2E_SEED_FILTER_ID fetch 실패, access token 만료. 스프린트 회귀 아님)
- `swipe-feed-free-circular.yaml` — PASS with warning (circular swipe 완료, current-index testID는 passthrough 없는 deep link 경로에서 렌더 안됨 — 의도됨)
- Dev 빌드: emulator-5554 (Pixel_9_Pro) + RFCY228HDXW 실기기 재설치 완료 (DATADOG_API_KEY export + .env + keystore.properties 복사)

## Lessons for Next Group
- app-003 (확인/크레딧 바텀시트)에서 `FREE_ALREADY_USED` 409 수신 시 크레딧 바텀시트로 전환 필요 (자동 폴백).
- CTA hand-off 브리지 (`navigation.setParams({pendingCtaAction})`) 완성 — app-003에서 해당 bridge event 수신.
- `navigation.navigate` 파라미터에 추가 필드 전달 시 `useCallback` 의존성 배열에도 함께 추가 (Major #1 교훈).
- `freeTabFilters` passthrough가 없는 deep link 경로에서도 app-003의 바텀시트 오픈 흐름이 동작해야 함 (entry point 다양성).
- 스크롤 복원(`useTabScrollRestore`)은 무료/추천 공통 훅. app-004 추천탭에서도 동일 키로 재사용.

## Files Changed (누적, 주요)
- Domain: `domain/meme/entities/free-tab.entity.ts`, `domain/meme/free-tab.constants.ts`, `meme.repository.ts`(ext), `meme.usecase.ts`(ext)
- Data: `data/meme/meme.model.ts`(ext), `meme.mapper.ts`(ext), `meme.repository-impl.ts`(ext), `meme.query-key.ts`(ext), `meme-invalidate-cache.ts`
- Presentation home: `free-tab/free-tab.screen.tsx`, `free-tab/free-roster-banner.tsx`, `free-tab/free-empty-view.tsx`, `free-tab/free-tab-card.tsx`, `home-header/home-header.tsx`(ext), `hooks/useTabScrollRestore.ts`, `home.screen.tsx`(ext), 삭제 `free-body.tsx`
- Presentation swipe-feed: `SwipeFeedScreen` mode 분기, `swipe-feed-free-cta-button`, `build-free-feed-items`, `resolve-free-cta-variant`, `resolve-circular-jump-target`, `resolve-initial-index`
- Routes: `route.types.ts`(ext), `home-routes.ts`(rewriteFreeTabDeeplink), `swipe-feed-routes.ts`(rewriteSwipeFeedFreeDeeplink), `app/navigation/useNavigationLinking.ts`(chained rewrites)
- testIds: `shared/constants/test-ids.ts`(ext)
- E2E: `flows/home-tabs.yaml`(ext), `flows/free-tab-grid.yaml`(new), `flows/swipe-feed.yaml`(ext), `flows/swipe-feed-free-circular.yaml`(new)

## Commits
- `bd74e042` — feat app-001 free tab grid
- merge + `92222f49` — feat app-002 swipe feed free mode
- merge + `0cef7a3b` — merge conflict resolution (route.types, meme.model, useNavigationLinking)
- `d4f338e9` — fix: freeUsedToday passthrough
- merge — Group 003 fix loop #1
- Sprint branch HEAD (app-core-packages): `zzem/free-tab-diversification`
