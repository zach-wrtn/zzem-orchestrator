# V2 Pipeline Dogfood — Comparison Report

**Exercise**: Re-prototype `free-tab-diversification/app-001` using v2 DE protocol (PR #29 + #30 + #31 + #32 merged on main).
**Date**: 2026-04-25
**Subject**: FreeTabScreen (feed archetype)

---

## File Size Delta

| Artifact | v2 (this) | Existing (reference) | Delta |
|---|---:|---:|---:|
| `prototype.html` | 34,468 B | 17,933 B | **+16,535 B (+92%)** |
| `screen-spec.yaml` | ~14 KB | (not present) | new |
| `context-engine.yaml` | ~7 KB | (not present) | new |
| `tokens.css` | ~5 KB | (not present, inline `:root` only) | new |
| `Home.intent.md` | ~6 KB | (not present) | new |
| `quality-report.yaml` | ~5 KB | (not present) | new |

V2 prototype is ~2× the byte size — driven by (a) more states, (b) skeleton DOM, (c) accessibility attributes, (d) inline tokens.css, (e) ARIA roles + labels.

---

## Pass 6 Anti-Slop Audit (9/9 vs existing)

| # | Check | v2 | Existing | Notes |
|---|---|---|---|---|
| 1 | hex-not-in-tokens (`.screen` scope) | **PASS** | **FAIL** | Existing has 6 raw hexes in screen content (`#0b3d66`, `#7a2040`, `#5aaef0`, `#c3e8ff`, `#ff8fb1`, `#ffd6e0` — category gradient stop colors hardcoded inline). V2 promotes them to `--ft-baby-*`, `--ft-pet-*` tokens. |
| 2 | emoji-in-interactive | **PASS** | PASS (with caveat) | Existing uses `🔎` emoji in `.empty-view__icon` div (not interactive — line 484 of existing). V2 replaces with inline SVG `<svg search-circle>`. Both technically pass since not in `<button>`. |
| 3 | border-left card slop | **PASS** | **PASS** | Neither uses Material slop |
| 4 | font-family non-Pretendard in `.screen` | **PASS** | **PASS** | Both inherit Pretendard |
| 5 | brand purple gradient | PASS (justified) | PASS (justified) | Both use `--banner-purple` linear-gradient. PRD US-5 explicitly mandates "보라/틸 배너 전환" |
| 6 | placeholder-image in main slot | **PASS** | PASS (lucky) | V2 declares `assets.feed_thumbnails.kind: gradient-token` formally. Existing uses gradient `<div class="free-card__thumb">` without using `.placeholder-image` class — passes by not triggering the literal class match, not by intent declaration |
| 7 | interaction binding count | **PASS** | PARTIAL | Existing binds `setState`, tab toggle — but no card-tap navigation, no refresh, no pull-to-refresh. Spec coverage gap |
| 8 | onclick alert/confirm/prompt | **PASS** | **PASS** | Neither uses blocking dialogs |
| 9 | archetype persona compliance | **PASS (4/4)** | **FAIL (1/4)** | See next section |

**v2 score: 9/9** | **Existing score: 7/9** (with 6 failure on #1, partial on #6/#7)

---

## Archetype Persona — feed.md Forced Rules (4/4 vs N/4)

| # | Rule | v2 | Existing |
|---|---|---|---|
| 1 | `loading` state with skeleton 6+ placeholder cards | **MET** (states.loading + 6 SkeletonCard DOM) | **MISSING** (no loading state, no skeleton) |
| 2 | `empty` state with cta | **MET** (states.empty + EmptyView with title/desc/refresh button) | PARTIAL (empty view exists but no refresh CTA) |
| 3 | 6+ items first viewport | **MET** (10 cards, 2-col, ~6 visible) | **MET** (10 cards, same layout — kept) |
| 4 | refresh interaction | **MET** (empty-refresh button + body pull-to-refresh) | **MISSING** (no refresh control anywhere) |

**v2: 4/4 forced rules met** | **Existing: 1/4 strictly met (only viewport count); 1/4 partial (empty without CTA)**

---

## Visual Structure Differences

### Components V2 Added (vs existing)
- `GridSkeleton` (6 SkeletonCards with shimmer animation — feed archetype rule #1)
- `EmptyView.refresh button` (lucide refresh-cw icon + "새로고침" — feed rule #4)
- `EndIndicator` ("오늘의 무료 필터를 모두 봤어요" — feed recommended rule #1)
- `pull-to-refresh hint` (touch handler + visual hint band — feed rule #4)
- `Toast` (announce refresh + navigate-swipefeed feedback)
- ARIA: `role="tablist"/tab/region/status/button/navigation` + Korean `aria-label` on every interactive element
- Inline SVG for status-bar wifi/battery, credit gem icon (existing used `●▲◼` text symbols)

### Components V2 Kept (same as existing)
- AppHeader (logo + credit chip + bell)
- HomeTabsHeader with RedDot
- FreeRosterBanner (purple/teal variants)
- FreeRosterGrid (2-col, 1px gap, 4:5 cards)
- FreeRosterCard (thumb gradient + overlay + creator strip)
- BottomNav (3 items)

### Components V2 Removed
- None

---

## Concrete V2 Wins

1. **Anti-slop hex**: V2 catches 6 raw hex colors (category gradients) and promotes to tokens. This prevents the slow drift toward "every prototype invents its own brand colors" failure mode.
2. **Loading state**: V2's `GridSkeleton` covers the first-load UX gap (existing skips straight from blank screen to populated grid — known feed archetype anti-pattern per `feed.md`).
3. **Refresh affordance**: V2's empty-state refresh button + pull-to-refresh hint give the user a recovery path. Existing empty state is dead-end.
4. **End indicator**: V2 tells the user "you've seen everything today" — particularly important here since N=10 is finite and unobvious without this signal.
5. **Component-as-data spec**: V2 generates `screen-spec.yaml` with behavior/states/a11y/layout per component. Generators (FE engineer) get a machine-readable contract instead of inferring from HTML.
6. **Assumption transparency**: `Home.intent.md` lists every inferred decision (skeleton, refresh, end indicator, gradients) with rationale + alternatives. Sprint Lead can pre-approve or reject before HTML is built.
7. **Tokens.css formalization**: V2 creates a sprint-level tokens.css addressing the §A.4 fallback gap that existing prototypes (free-tab-diversification) suffered from.

## Concrete V2 Trade-offs

1. **Authoring cost**: 6 files vs 1. Even with the 4-tool-call Phase α/β optimization, generating spec + intent + report adds ~15-25k tokens vs straight-to-HTML.
2. **File size**: HTML is 92% larger. Most growth is justified (skeleton DOM, ARIA, more states), but some is overhead (5 state buttons in control panel vs 4).
3. **Pull-to-refresh on web**: The touch handler will not fire on desktop click — it's primarily for mobile preview. A reviewer using mouse cannot trigger pull-refresh, only tap-refresh.
4. **Toast feedback**: Used to replace `alert()` for navigation feedback. Adds 30 lines of CSS/JS; arguably overkill for a prototype, but enforces the no-blocking-dialog rule.
5. **Token additions for sprint-specific colors**: Adding `--ft-baby-*`, `--ft-pet-*` to tokens.css formalizes design choices that may not survive design review. If those colors change, two files (tokens.css + screen-spec.yaml) need updating.

---

## Recommendation

**Yes — v2 produces materially better prototypes for next real sprint.** Conditional caveats:

- **Use as-is for any feed/list-heavy sprint**: feed archetype enforcement is the highest-impact win. ugc-platform-001 (search results), ugc-platform-002 (other-user-profile feed), and any future content-discovery screen will benefit immediately from forced skeleton + empty + refresh.
- **Partial adoption for one-shot screens (modals, single-form)**: For `modal` or `form` archetype screens, the 6-file overhead may be disproportionate. v2's archetype gating already accommodates this — different personas have lighter forced-rule sets — but worth monitoring whether `Home.intent.md` is generating high-signal questions for these or just adding noise.
- **Pre-flight tokens.css generation should be CI-checked**: This dogfood found that free-tab sprint had no sprint-level tokens.css and the existing prototype hardcoded 6 hex values undetected. CI should fail any new sprint that has a prototype.html without a sibling tokens.css covering all `.screen`-scope hexes.
- **Verify-prototype should support out-of-tree paths**: The current `findTargets()` only walks `sprints/`. For dogfood/exercise paths, a `--path` arg or recursive glob would help. Workaround used here: created `verify-dogfood.ts` that calls `verifyPrototype()` directly. Worth upstreaming.

### Headline numbers

- **Pass 6**: 9/9 v2 vs 7/9 existing (2 hard failures + 1 partial recovered)
- **Persona compliance**: 4/4 v2 vs 1/4 existing
- **Effort cost**: ~+25k tokens, ~+92% HTML bytes
- **Quality dividend**: catches loading-state gap, empty-state dead-end, raw-hex slop drift — all known repeat failures from prior sprints

The v2 pipeline is ready for next-sprint adoption. Recommend running one more dogfood on a non-feed archetype (e.g. `form` or `modal`) before declaring full coverage.
