# Phase 4 Summary: free-tab-diversification

## Result: ALL GROUPS ACCEPTED

| Group | Scope | Fix Loops | Verdict |
|-------|-------|-----------|---------|
| 001 | be-001 (schema), be-002 (scheduler) | 0 | PASS |
| 002 | be-003 (/free-tab + filters v2), be-004 (slot mapping + quota) | 1 | PASS (after fix) |
| 003 | app-001 (grid), app-002 (swipe-feed free mode) | 1 | PASS (after fix) |
| 004 | app-003 (confirm sheets), app-004 (external entry parity) | 0 | PASS |

## Sprint Branches
- wrtn-backend: `zzem/free-tab-diversification` — 4 groups 머지 완료
- app-core-packages: `zzem/free-tab-diversification` — 4 app tasks 머지 완료

## Tests
- Backend: 83 suites / 673 tests PASS (통합 검증)
- App: Group 004 범위 5 suites / 30 tests PASS, pre-existing `@wrtn/*` module resolution fail 10 suites (`feedback_monorepo_precommit.md` 허용)

## E2E Smoke (Phase 4.3.2)
- Group 003: 3/4 flows PASS (`home-tabs`, `free-tab-grid`, `swipe-feed-free-circular` with warning). `swipe-feed.yaml` 환경 문제(token 만료) fail — 스프린트 회귀 아님.
- Group 004: **deferred** — dev 빌드 재설치 비용으로 Phase 5 전 사용자 직접 재실행 권고.
  - 준비 flow: `free-gen-confirm.yaml`, `external-entry-free-parity.yaml`, `filter-preview.yaml`(ext)

## Phase 5 Gate Check
- [x] 모든 그룹이 ACCEPTED (4/4)
- [x] FAILED 그룹 0개
- [x] Worktree 정리 완료 (be-001~004, app-001~004, fix worktrees 전부 remove/branch -D)
- [x] Sprint 브랜치 모든 머지 커밋 반영
- [x] 모든 그룹 checkpoint summary 생성 (group-001~004)
- [ ] Phase 5 전 사용자 확인: Group 004 e2e 실행 여부

## Key Decisions (sprint-level)
- BE: `FreeFilterSlot` 별도 컬렉션(SSOT), `UserFreeQuota` partial unique (status==ACTIVE), KST 자정 cron 3단계 + fallback chain.
- App: `useTabScrollRestore` 무료/추천 공통, `useFreeGenCTA` 공통 훅, `pendingCtaAction` one-shot bridge, `X-App-Version >= 1.3.0` 임계로 신규 UI 활성, 구앱 경로 미변경.
- Contract SSOT 준수: `api-contract.yaml` 필드명 정확 일치(KB integration-001).
- BR-12 준수: `slotId`는 API 입출력 노출 금지, 서버가 자동 매핑.

## Deferred (이월 Minor 이슈)
- Backend: `computeFreeUsedToday` UserFreeQuota 통합 (현재 content 테이블 기반), Mongoose duplicate index warning, race window 문서화.
- App: `FREE_ROSTER_MIN_VERSION` 참조 처리, `imp_id` 이벤트 payload, deep link 뒤로가기 edge, `filters.findIndex` perf, `isFree` 서버 주입(BE 통합 테스트로 대체).

## Next: Phase 5 (PR)
사용자 확인 필요 (PR 생성 + push는 Sprint Lead 전담, 원격 작업 전 승인 필수).
