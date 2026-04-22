# Group 002 Contract Review — Round 1

## Verdict
APPROVE with revisions

## Issues (by severity)

### Critical
없음.

### Major

1. **E2E flow divergence from `e2e-flow-plan.md`.** The plan (`e2e-flow-plan.md:72`, `:80`) lists **4 new flows** for the Group 002 smoke gate, including a dedicated `explore-tab.yaml`. The contract (`group-002.md:53`, `:144`) collapses Explore verification into `bottom-tab-nav.yaml` ("bottom-tab-nav.yaml 확장"). Either update the plan to reflect the consolidation, or split out `explore-tab.yaml`. Mismatch today makes group gate ambiguous.
2. **Missing AC coverage: `home-to-settings.yaml` regression.** Baseline flow `home-to-settings.yaml` (`e2e-flow-plan.md:21`) depends on Home → Settings path; after app-003 moves the 톱니바퀴 entry to the MY tab, this flow will break. Contract V5 regression bullet (`group-002.md:147`) only says "로컬 실행 시 green" without enumerating impacted flows. Add explicit action: update or deprecate `home-to-settings.yaml`, + list other Home-rooted flows expected to shift.
3. **AC 2.5 / 7.x navigation param not covered.** app-003 task (`003-my-profile-screen.md:54`) requires tap-to-SwipeFeed preserving source context (covered by `profile-to-swipe-feed.yaml` in Group 003), but contract's §app-003 Done Criteria omits "공개/비공개 탭 아이템 tap → 세로 스와이프 피드 진입" as a visible AC. Task AC lines 60-64 imply grid render only — add one bullet confirming tap-through wires to existing SwipeFeed route so Group 003's `profile-to-swipe-feed.yaml` has a precondition.

### Minor

4. **Over-specification risk in V1 grep** (`group-002.md:126`): `"\"둘러보기\"|\"생성\""` scoped to `navigation/` is fine, but canonical-label enforcement should probably extend to `presentation/` tab headers too (ExploreScreen "탐색" title). Consider widening or noting scope intent.
5. **Edge Case 4** (`group-002.md:156`): "Counts API 실패 → 공개 탭 fallback" is a behavioral spec not present in task file app-003 AC. OK to keep as resolution of ambiguity, but flag it as contract-added (not PRD-derived) so Engineer doesn't over-interpret.

## Missing AC Coverage

| Task AC | Source | Contract Done Criterion | Status |
|---|---|---|---|
| app-001 AC1 (3 탭 부팅) | `001:51` | `group-002.md:27-31` | Covered |
| app-001 AC2 (탭 이동) | `001:52` | `group-002.md:27` | Covered |
| app-001 AC3 (`zzem://profile` auth) | `001:53` | `group-002.md:36`, `:38` | Covered |
| app-001 AC4 (`zzem://profile/:userId`) | `001:54` | `group-002.md:37` | Covered |
| app-001 AC5 (`RootTabParamList`) | `001:55` | `group-002.md:32` | Covered |
| app-001 AC6 (Maestro) | `001:56` | `group-002.md:41` | Covered |
| app-002 AC1-4 | `002:39-42` | `group-002.md:49-53` | Covered |
| app-003 AC1-3 (프로필/3탭/디폴트) | `003:58-61` | `group-002.md:59-67` | Covered |
| app-003 AC4 (좋아요 빈) | `003:62` | `group-002.md:72` | Covered |
| app-003 AC5-6 (생성후 routing) | `003:63-64` | `group-002.md:68-71` | Covered |
| app-003 AC7 (톱니바퀴→Settings) | `003:65` | `group-002.md:60` | Covered |
| app-003 AC "탭 아이템 → SwipeFeed" | implicit (`003:26`) | — | **Gap (Major #3)** |
| app-003 AC9 (숫자 포맷) | `003:67` | `group-002.md:73-79` | Covered |
| app-004 AC1 (8 메뉴 순서) | `004:52` + DRIFT-01 | `group-002.md:89-99` | Covered |
| app-004 AC2 (placeholder) | `004:53` | `group-002.md:100` | Covered |
| app-004 AC3 (기존 유지) | `004:54` | `group-002.md:95-97` | Covered |
| app-004 AC4 (Maestro) | `004:55` | `group-002.md:102-105` | Covered |

## Sign-off recommendation

Resolve Major 1-3 (align e2e-flow-plan, flag Home-rooted regression flows, add tap-to-SwipeFeed Done Criterion) in a short Round 2; then APPROVE for FE dispatch.

## Round 2

**Verdict**: APPROVE.

Patch verification:

1. **Major 1 — RESOLVED.** `explore-tab.yaml` is now a standalone flow in app-002 Done Criteria (`group-002.md:53`) and V5 checklist (`:146`), with explicit `e2e-flow-plan.md:36,72` citation. 4-flow count matches plan.
2. **Major 2 — RESOLVED.** V5 Regression bullet (`:149-152`) names `home-to-settings.yaml`, locks option (b) tap-path update (MY 탭 → 톱니바퀴) with rationale (삭제 시 회귀 커버리지 상실), and extends the same rule to other Home-rooted flows.
3. **Major 3 — RESOLVED.** app-003 (`:73`) adds explicit "공개/비공개 그리드 tap → SwipeFeed, FeedOrigin 재사용, 신규 경로 금지" bullet. Precondition for Group 003 `profile-to-swipe-feed.yaml` satisfied.
4. **Minor 4 — RESOLVED.** V1 grep (`:127`) extends scope to `presentation/explore/`.

FE Engineer 착수 허가.
