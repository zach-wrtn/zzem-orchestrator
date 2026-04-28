# 회차 3 — Prototype Pipeline v1 → v2 → v2.2

> "어떻게 4 일 만에 unguarded 6-pass 생성 → 4-gate mechanical pipeline + archetype/persona 시스템으로 진화했는가"

**범위**: 2026-04-08 inception 의 v1 (느슨한 6-pass) → 2026-04-24 v2 도입 (4 quality gate + 2-phase 최적화) → 2026-04-25 batch day (archetype/persona/variants/exemplars 동시 land) → v2.2 refinement (6 persona 예외 clauses) → 2026-04-25 qa-2 첫 라이브 dogfood. **이 회차의 4일 압축 진화 가 시스템 전체에서 가장 dense.**

핵심 1차 사료: `docs/superpowers/plans/2026-04-08-hermes-enhancement.md`, `2026-04-24-prototype-pipeline-upgrade.md`, `2026-04-25-{screen-archetype-persona,curated-exemplars,variants-by-default,de-eval-harness,de-archetype-self-reclassification,form-persona-instant-save-clause,modal-picker-exception-clause,detail-blocked-variant-clause,empty-state-prd-copy-conflict-resolution,archetype-enum-nav-list,verify-prototype-selectors}.md`, `.claude/teammates/design-engineer.md`, `.claude/teammates/design-engineer-archetypes/*.md`, `sprint-orchestrator/sprints/ugc-platform-integration-qa-2/retrospective/v2-pipeline-dogfood-retrospective.md`.

---

## TL;DR (5 문장)

1. **v1 (~04-23)**: Step A/B/C 골격은 inception 시점부터 존재. 그러나 Step C 의 6-pass HTML 생성이 **unguarded** — slop 패턴 (raw hex, emoji, 보라 그라디언트, placeholder image) 이 catch 안 됨.
2. **v2 (04-24)**: PTC 2-phase 최적화 (12 → 4 tool calls) + **4 quality gate** (Pass 6 anti-slop / Assumption Preview / verify-prototype / Asset Layer) 동시 도입. 프로토타입 저장 전 mechanical 검증.
3. **04-25 Batch day**: 하루에 archetype enum (6→7) + persona system + curated exemplars + variants mode + DE eval harness 동시 land. Phase 3 가 "judgment-driven → rule-driven" 으로 격상.
4. **v2.2 (04-25 후속)**: qa-2 dogfood 의 6 finding 이 **같은 날** 6 PR 로 즉시 land — DE 자가 재분류 + 4 persona 예외 clauses (form instant-save / modal picker / detail blocked / empty_state PRD copy 충돌).
5. **qa-2 라이브 dogfood (04-25)**: 23 prototypes / Pass 6 99.1% (228/230) / persona 91.3% / Assumption Preview 100% 트리거. **시스템이 production-ready** 임을 확인.

---

## 1. Current shape (orientation)

오늘의 Phase 3 = **3-step DE 프로토콜 + 4 quality gate**.

```
Step A: Context Engine Assembly
  ├─ A.0  DESIGN.md / foundations / components MDX 선행 read
  ├─ A.1  WHY (PRD intent) / WHAT (tokens / components) / HOW (rules)
  ├─ A.4  tokens.css 생성
  └─ A.5  Asset Layer (5 categories: avatars/feed_thumbs/meme/icons/hero)
                         │
                         ↓
Step B: UX Decomposition
  ├─ B.1.1  Archetype 분류 (7 enum)
  ├─ B.2~5  Screen Spec 작성 (Component Tree / Layout / States / Token Map)
  ├─ B.5    Quality Score (extraction_accuracy / fabrication_risk / completeness)
  └─ B.6    Assumption Preview gate (조건부)
                         │
                         ↓
Step C: Prototype Generation (PTC 2-phase)
  ├─ Phase α  Structure + Components → prototype-alpha.html
  ├─ Phase β  Content + States + Interactions + Polish → prototype.html
  ├─ C.2.1   Pass 6 Anti-Slop Audit (10 checks) — fail 시 저장 차단
  └─ C.2.1   Persona forced rules (archetype 별 4 rules) — 동급 STOP 조건
                         │
                         ↓
Phase 3 후처리:
  ├─ verify-prototype  Playwright click-test (sprint-gallery 빌드 시)
  ├─ Capture screenshots (gallery 용)
  └─ approval-status.yaml (사용자 review 추적)
```

---

## 2. v1 Baseline (inception ~ 04-23)

### 2.1 Step A/B/C 골격 — inception 부터 존재

DE 의 3-step 프로토콜은 inception 시점에 이미 정의되어 있었음. 진화는 각 step 의 **constraints** 가 강해진 것 — 골격 자체는 안 바뀜.

- **Step A v1**: WHY/WHAT/HOW 3 layer (ASSETS layer 없음). tokens 매뉴얼 / ad-hoc 발견.
- **Step B v1**: Component Tree + States 작성. **archetype 없음, persona 없음, quality_score / fabrication_risk 추적 없음.**
- **Step C v1**: **6-pass 순차** (Structure → Components → Content → States → Interactions → Polish). Pass 마다 LLM Read+Edit. **12 tool call / prototype.**

### 2.2 v1 의 자유로움이 만든 운영 문제

초기 sprint REPORT.md 기록:

| Sprint | 발견된 slop |
|--------|------------|
| free-tab-diversification | "Placeholder images on feed cards caused low-fidelity feel. User feedback: 'Looks like wireframe, not prototype.'" |
| ai-webtoon | "Emoji icons (🔔, ❤️) instead of proper SVG. Inconsistent with brand SVG library." |
| ugc-platform-001 | Pretendard 외 font-family 혼용 (DE 가 Material 패턴 무의식 차용) |
| ugc-platform-002 | `border-left: 4px solid` Material card slop (Tailwind 영향) |

**공통 패턴**: Pass 6 (Polish) 가 informal — DE 가 "이상하다 싶으면 고침" 수준. mechanical checklist 없음. → v2 의 Pass 6 재정의의 동기.

### 2.3 v1 Frozen Snapshot

inception 시점부터 1-read-upfront. Sprint Lead 가 DESIGN.md + component-patterns.md + KB patterns 을 1회 read 후 TaskCreate Description 에 인라인. teammates 는 별도 read 안 함. **이 부분은 v1 → v2 진화에서 거의 안 바뀜** — Hermes Agent frozen snapshot 패턴이 견고.

---

## 3. v2 도입 (04-24) — 4 Quality Gates + 2-Phase 최적화

**Plan**: `2026-04-24-prototype-pipeline-upgrade.md`. Hermes Agent PTC 패턴 + 4 quality gate **동시 도입**.

### 3.1 PTC 2-Phase 최적화 (12 → 4 tool calls)

```
Phase α (컨텍스트 내 — Screen Spec 해석 필요):
  Pass 1+2  Structure + Components → prototype-alpha.html  (1 Read + 1 Write)

Phase β (단일 Write — 기계적 변환):
  Pass 3~6  Content + States + Interactions + Polish → prototype.html  (1 Read + 1 Write)
```

**효과**: tool call 12 → 4 (67% context 절감). Pass 별 Edit 루프 → final HTML 단일 Write.

### 3.2 Gate 1: Pass 6 Anti-Slop Audit (10 mechanical checks)

`design-engineer.md` §C.2.1 — prototype.html 저장 전 의무 mechanical 체크.

| # | 체크 | 자동화 |
|---|------|-------|
| 1 | hex 색이 tokens.css 외 (`.screen` 후손) | `grep -oE '#[0-9A-Fa-f]{6}'` |
| 2 | Unicode emoji 가 interactive button/tab | grep |
| 3 | `.card` 의 `border-left` (Material slop) | 수동 |
| 4 | font-family ≠ Pretendard (mono 외) | grep |
| 5 | brand 보라 gradient 배경 전면 | 수동 |
| 6 | placeholder-image 가 주 콘텐츠 + needs_real_content: true | 수동 + Asset Layer 연동 |
| 7 | DOM onclick 수 ≠ Spec interactions 수 | DOM parser (verify-prototype) |
| 8 | onclick 안 alert/confirm/prompt | grep |
| 9 | persona forced rules 모두 통과 | 수동 + persona md 참조 |
| 10 | exemplar drift 80%+ 일치 | warning only (STOP 아님) |

**Failure 룰**: 10 중 하나라도 fail (10 제외) → prototype.html **저장 안 됨**, DE 수정 후 재실행.

**v1 vs v2**: v1 Pass 6 는 informal "polish 검사". v2 는 mechanical gate — judgment 제거.

### 3.3 Gate 2: Assumption Preview (`*.intent.md`)

`design-engineer.md` §B.6 — Step B 완료 후, Step C 진입 전 조건부 gate.

**Trigger** (any of):
- `fabrication_risk` ∈ {low, medium}
- `context_coverage.why_linked < 1.0` (UI 영향 AC 중 미연결 존재)
- 태스크 description `preview_required: true`
- 새 컴포넌트 (`(new)` 표시) 2개+

**산출물**: `{ScreenName}.intent.md` — DE 가 추론한 가정 + gate questions.

**Sprint Lead 액션**:
- `proceed`: Step C 진입
- `adjust`: 지정 항목 Spec 반영 후 preview 재생성 (최대 2 루프)
- `stop`: PRD gap 보고

**의도**: 650-line HTML 생성 후 throw-away 비용 회피 — 가정 misalignment 를 Step C 진입 전 조기 catch.

### 3.4 Gate 3: verify-prototype (Playwright click-test)

`sprint-gallery/scripts/verify-prototype.ts` (TS + puppeteer headless) — sprint-gallery 빌드 시 실행.

**동작**:
1. 각 prototype.html 을 puppeteer headless 로 load
2. `console.error` + `pageerror` listener
3. 모든 `[onclick]` + `[data-action]` + `[data-nav]` + `[data-close-sheet]` + `[role=menuitem]` click
4. JS error 발생 시 fail
5. Spec interactions 수 vs DOM binding 수 일치 확인

**hang 방지**: alert/confirm/prompt 자동 dismiss + click 당 2초 timeout. **free-tab/app-002 의 18 분 hang 사례** 가 직접 trigger — Pass 6 #8 의 alert/confirm/prompt 검출과 함께 이중 보호.

### 3.5 Gate 4: Asset Layer (5 카테고리 + needs_real_content)

`design-engineer.md` §A.5 — `context-engine.yaml` 에 `assets:` 블록 추가.

| 카테고리 | fallback chain | placeholder 허용 |
|---------|---------------|-----------------|
| avatars | user → KB sample → app-core-packages/ds → ask | ✗ (주 콘텐츠 위치) |
| feed_thumbnails | user → Figma → ask | ✗ |
| meme_images | user → KB sample → ask | ✗ |
| icons | @wrtn/icons SVG → 기호 (`←⋮♡+`) | ✓ 기호 OK |
| hero_banners | user → ask | ✗ |

**`kind` 필드** (v1.1 추가):
- `real-image`: `<img src>` 필수, placeholder 금지
- `gradient-token`: 토큰화된 그라디언트 (의도된 디자인 — 면제)
- `illustration`: 카테고리별 SVG (디자인 시스템 등재 시 면제)

**Stop-and-ask 룰**: 슬롯 src 미확정 → Sprint Lead 보고. 추측 경로 금지. "placeholder 허용" 명시 승인이 있을 때만 `needs_real_content: false` 로 통과.

**Pass 6 #6 와 직결**: prototype.html 의 주 콘텐츠 슬롯에 `<div class="placeholder-image">` + `needs_real_content: true` → Pass 6 fail.

---

## 4. Batch Day (04-25) — 4 메커니즘 동시 land

하루에 6 plan 작성 + PR #37~#42 머지. Phase 3 가 "rule-driven" 으로 격상.

### 4.1 Archetype Enum (6 → 7)

**Plan**: `2026-04-25-screen-archetype-persona.md` (초기 6) → 같은 날 `2026-04-25-archetype-enum-nav-list.md` (7번째 추가, PR #41).

**최종 7 enum**: `feed | detail | onboarding | form | modal | empty_state | nav_list`

**구현**:
- Screen Spec meta 의 `screen_archetype` 필드 (7 enum)
- DE Step B.1.1 가 분류 의무 — 모호 시 Sprint Lead 질의 (default 금지)
- `.claude/teammates/design-engineer-archetypes/{archetype}.md` 7 파일 생성
- 각 persona = **4 forced rules** + **3-5 recommended rules**
- Step C 가 forced rules 적용 — 미충족 시 prototype.html 저장 차단 (Pass 6 #9 와 동급 STOP)

**7 archetype 의 forced rules 요약**:

| archetype | 4 forced rules |
|-----------|---------------|
| feed | skeleton state / 6+ items viewport / pull-to-refresh / empty handling |
| detail | hero 320px+ / back 1-way / metadata 4 items max / CTA 1+0-2 |
| onboarding | progress indicator / CTA 56px+ / skip option / success state |
| form | inline validation / submit disabled-until-valid / inline error / 1 primary action |
| modal | backdrop 40%+ / close 2-way (X+external) / CTA 1+0-1 / context title |
| empty_state | illustration 80px+ / 1 sentence + 1 CTA / no negative tone |
| nav_list | uniform row height / right affordance / section grouping / 0 primary CTAs |

### 4.2 Curated Exemplars (DE Frozen Snapshot 자동 인라인)

**Plan**: `2026-04-25-curated-exemplars.md`

**큐레이션 자격** (4 충족):
1. Pass 6 anti-slop audit 통과
2. verify-prototype 통과 (clickErrors 0)
3. 사용자 또는 Sprint Lead 명시 승인
4. archetype 분류 동의

**자동 인라인 메커니즘**:
- Sprint Lead 가 `pnpm exemplar:lookup --archetype=feed --exclude-sprint={current}` → top-2 반환
- Frozen Snapshot 의 `## Exemplar References` 섹션에 인라인
- DE 는 exemplar 의 **screenshot + metadata (dimension_focus, why_curated)** 만 참조 — `prototype_path` 직접 read 금지 (구조 모방 방지)
- Pass 6 #10: 본 prototype 이 exemplar 와 80%+ 일치 시 `exemplar_drift_warning: true` (STOP 아님 — warning)

**효과**: "scratch from each screen" 증후군 회피. archetype 별 검증된 패턴이 DE 에 자동 주입.

### 4.3 Variants Mode (A/B/C 평행 생성)

**Plan**: `2026-04-25-variants-by-default.md`

**Variant directives**:

| variant_id | directive | 강제 룰 |
|-----------|-----------|--------|
| A — Conservative | 패턴 기본형 충실 | 새 컴포넌트 금지. tokens.css 외 색 금지. layout 기본 옵션만. |
| B — Expressive | 시각 위계 강조 | hero typography + accent + motion 힌트. (단 보라 그라디언트는 여전히 Pass 6 #5 적용) |
| C — Minimal | 정보 밀도 최저 | spacing 1단계 큰 값. CTA 1-2개로 축소. |

**공유 제약**: 동일 Frozen Snapshot / Pass 6 / Asset Layer / 임의 추가 패턴 인용 금지.

**Trigger** (any of): `fabrication_risk: medium`, 태스크 명시 요청, 사용자 옵션 요청.

**Comparison gate**: 3개 variant 완료 후 Sprint Lead 가 시각 비교 → 사용자 A/B/C 선택 또는 mix.

**qa-2 dogfood 결과**: 0/23 트리거 (medium-risk 화면 부재). **트리거 조건 보수적** — Open Question 으로 남음.

### 4.4 DE Eval Harness (Dormant)

**Plan**: `2026-04-25-de-eval-harness.md`

**6 metric scorer**:
- `token_compliance` (모든 색/spacing 이 tokens.css 안)
- `motion_quality` (transition 힌트 fidelity)
- `archetype_fit` (persona forced rules 통과)
- `interaction_density` (binding 수 vs 화면 복잡도)
- `contrast_ratio` (WCAG AA luma 계산)
- `load_time` (puppeteer DOMContentLoaded)

**Status**: **Dormant** — `ANTHROPIC_API_KEY` 게이트 미해소. CI 에 secret 등록 + Phase 2 baseline freeze 단계 필요. Plan 은 land, 실행은 보류.

### 4.5 verify-prototype CLICK_SELECTORS 확장 (PR #30)

**Plan**: `2026-04-25-verify-prototype-selectors.md`

기존: `[onclick]` + `.state-toggle`
추가: `[data-action]` + `[data-nav]` + `[data-close-sheet]` + `[role=menuitem]`

**효과**: bottom sheet, action sheet, menu 의 click event 가 verify 에 잡힘. v2 의 verify-prototype 이 **실 사용 패턴 전체** coverage.

---

## 5. v2.2 Refinements (04-25 후속) — 6 Persona/Archetype 보정

qa-2 dogfood 의 6 finding 이 **같은 날** 6 PR 로 즉시 land. v2 → v2.2 evolution 이 단일 sprint 안에서 완료.

### 5.1 PR #37 — DE 자가 archetype 재분류 (`2026-04-25-de-archetype-self-reclassification.md`)

**Finding**: task spec `archetype_hint: detail` 인데 DE 분석 결과 feed 가 더 적합한 케이스 발생. 자가 재분류 boundary 필요.

**Resolution**: `design-engineer.md` §B.1.1 자가 재분류 매트릭스:

| Hint → Applied | 자가 재분류 OK | 사유 |
|---------------|:--------------:|------|
| feed ↔ nav_list | ✓ | 동질 list, 의도 (소비 vs 이동) 만 다름 |
| detail ↔ feed | ✓ | 단일 vs 다수 — Snapshot 보면 명확 |
| form ↔ nav_list | ✓ | instant_save toggle vs nav row 혼동 흔함 |
| modal subtype 변경 (dialog↔picker↔action_sheet) | ✓ | meta.modal_subtype 만 변경 |
| 두 단계 이상 (feed → modal, detail → onboarding) | ✗ | **escalated: true** — Sprint Lead 질의 필수 |

자가 재분류 시 `quality-report.archetype_reclassified` 블록 + activity log `archetype_reclassified`.

### 5.2 PR #38 — Form Persona Instant-Save 예외 (`2026-04-25-form-persona-instant-save-clause.md`)

**Finding**: app-022/app-023 (settings) 가 instant-save toggle (no submit). form persona forced rule #2 (submit disabled-until-valid) 가 너무 strict.

**Resolution**: form.md 에 예외 clause:
```
If form.meta.instant_save: true:
  - Forced rule #2 (disabled-until-valid) waived
  - Toggle state 즉시 반영 on blur
  - Error messages 여전히 필수 (rule #3)
  - Primary CTA 여전히 1 (rule #4)
```

`archetype_recommendation_skipped` 로 logging (fatal 아님).

### 5.3 PR #39 — Modal Picker 예외 (`2026-04-25-modal-picker-exception-clause.md`)

**Finding**: app-005/009/012/015 의 date/time picker modal 이 Apply + Clear 2 CTA 필요. modal forced rule #3 (1 primary + 0-1 secondary) 위반.

**Resolution**: modal.md 에 subtype 예외:
- `modal_subtype: picker | dialog | action_sheet | share_sheet` enum 도입
- picker subtype 인 경우 rule #3 면제 (Apply + Clear 허용)
- rule #1 (backdrop) / rule #2 (close 2-way) 는 그대로 적용

### 5.4 PR #40 — Detail Blocked Variant 예외 (`2026-04-25-detail-blocked-variant-clause.md`)

**Finding**: app-014 detail (user profile) 이 차단 사용자 시 "Unblock" CTA 표시, 평상시 hidden. detail rule #4 (CTA 1+0-2) 가 conditional CTA 미고려.

**Resolution**: detail.md 에 conditional 예외:
```
If detail.meta.cta_conditional: true:
  - Rule #4 threshold 는 max-visible state 기준
  - Hidden-state CTAs 면제
```

`[data-state="blocked"]` 가 normal CTAs 숨기고 unblock 표시. Pass 6 #7 (interaction parity) 가 모든 state binding 확인.

### 5.5 PR #41 — nav_list Archetype 추가 (`2026-04-25-archetype-enum-nav-list.md`)

**Finding**: app-023 settings list (Dark Mode / Notifications / Logout) 를 form 으로 분류. 실제로는 navigation destination list — 입력 폼 아님.

**Resolution**: 7번째 archetype `nav_list` 도입.
- Form 과 구분: form 은 submit, nav_list 는 dismiss/back
- Feed 와 구분: feed 는 콘텐츠 items, nav_list 는 destinations
- Forced rules: uniform row height / right affordance / section grouping / 0 primary CTAs

Screen Spec template + DE Step B.1.1 + persona files 동시 갱신.

### 5.6 PR #42 — Empty_state PRD Copy 충돌 해결 (`2026-04-25-empty-state-prd-copy-conflict-resolution.md`)

**Finding**: app-021 empty state 가 PRD 명시 카피 "검색 결과가 없습니다." (negative tone). empty_state persona rule #4 (no negative tone) 와 충돌.

**Resolution**: phase-prototype.md §3.2.5 표준 충돌 해결 프로세스:
1. DE 가 quality-report 에 `rule_conflict` 또는 `prd_copy_conflict` 기록
2. Sprint Lead 가 사용자 query:
   - A) PRD 카피 유지 (PRD `### NEVER DO` 가 priority 1 — default)
   - B) Persona rewrite + 예외 기록
   - C) 사용자 작성
3. 사용자 결정이 `prd_copy_conflict.resolution` 에 기록
4. **같은 sprint 내 동일 패턴 재발생 시 자동 적용** (precedent system)

**Priority 우선순위 (충돌 시)**:
1. PRD `### NEVER DO`
2. Pass 6 Anti-Slop Audit
3. DESIGN.md / tokens.css
4. Persona 강제 룰
5. Persona 권장 룰

상위 룰이 이김. 단 상위 룰 위반 가능성 발견 시 DE 가 자동 Sprint Lead 결정 trigger.

---

## 6. 첫 라이브 Dogfood — qa-2 (04-25)

**Sprint**: ugc-platform-integration-qa-2 / 23 prototypes / 6 archetype 노출 (onboarding 누락 — 별 sprint).

**Source**: `sprint-orchestrator/sprints/ugc-platform-integration-qa-2/retrospective/v2-pipeline-dogfood-retrospective.md`

### 6.1 Summary Metrics

| 지표 | 결과 |
|------|------|
| **Pass 6 compliance** | 228/230 (99.1%) — 2 의도된 skip 기록 |
| **Persona compliance** | 21/23 (91.3%) — form 75% (instant-save 예외 발견 → PR #38) |
| **Assumption Preview gate** | 23/23 (100%) 트리거 |
| **Asset Layer 커버** | avatars 23 / feed_thumbnails 3 / icons 23 / meme/hero 0 |
| **Exemplars 인라인** | 3/23 (feed only — bootstrap 시점이라 1 exemplar 만 등록됨) |
| **Variants mode 트리거** | 0/23 — 조건 보수적 |
| **DE Eval Harness** | dormant (ANTHROPIC_API_KEY 대기) |
| **Avg prototype size** | 28KB / 650 lines HTML |
| **Avg sub-agent time** | 9 min (range 5-12) |
| **Avg token burn** | 130k (range 100-180k) |

### 6.2 Per-Archetype 결과

| archetype | screens | forced 4/4 | 발견 |
|-----------|:-------:|:----------:|------|
| form | 8 | 6 (75%) | app-022/023: instant-save 예외 → PR #38 |
| modal | 7 | 7 (100%) | app-005/009/012/015: picker subtype → PR #39 |
| feed | 3 | 3 (100%) | — |
| detail | 4 | 4 (100%) | app-014: blocked variant → PR #40 |
| empty_state | 1 | 1 (100%) | app-021: PRD copy 충돌 → PR #42 |
| nav_list | 0 | — | qa-2 시점 미존재 → PR #41 (post-qa-2) |
| onboarding | 0 | — | qa-2 미노출 (별 sprint 필요) |

### 6.3 Lessons → 6 PR 즉시 land

dogfood 발견 → plan 작성 → PR 머지가 **같은 날 압축 사이클**. qa-2 retrospective 의 Lessons Learned 섹션 → 6 plan 으로 직접 매핑 → PR #37~#42 동시 land.

**의의**: v2 → v2.2 진화가 별 sprint 가 아니라 **dogfood 회고 단계 안에서 완료** — system 의 self-improving 메커니즘이 작동하는 구체적 사례.

---

## 7. Open Questions

### 7.1 DE Eval Harness 가 왜 dormant?

`ANTHROPIC_API_KEY` provisioning 미해소. 6 metric scorer 의 일부 (`motion_quality`, `archetype_fit` 의 의미적 평가) 가 Claude API 호출 필요. CI runner 의 secret 게이트가 broader team auth 결정 대기. Plan 은 완성 (`2026-04-25-de-eval-harness.md`) — Phase 2 baseline freeze 후 활성화 예정.

### 7.2 7 archetype 으로 충분한가?

다음 분기 후보 (speculative):
- **card_grid**: identical card grid (Masonry, product grid). feed (scroll-driven) 와 구분 — column span / aspect ratio 룰
- **wizard**: branching multi-step flow. onboarding (linear) 와 구분 — conditional steps
- **data_table**: sortable/filterable rows. nav_list (no nav intent) / form (no submission) 와 구분

**결정**: 현재 7 유지. 다음 sprint 에서 missing archetype 발견 시 같은 패턴 (Screen Spec template + DE B.1.1 + persona _index.md 동시 갱신) 으로 enum 확장.

### 7.3 Variants Mode 의 cost vs benefit

**Cost**: 3× HTML 생성 시간 + ~390k token (3 평행).
**Benefit**: 사용자가 동일 토큰 budget 안에서 3 디자인 방향.

qa-2 에서 0/23 트리거 — 조건 (`fabrication_risk: medium`) 이 보수적. 가능성:
- Trigger 더 추가 ("user opt-in" flag)
- medium-risk 측정이 비관적 (대부분 low 평가)

**권장**: 다음 2 sprint 모니터링. 여전히 0 트리거 시 user-opt-in flag 추가. 미사용 메커니즘은 무가치.

### 7.4 Exemplar bootstrap

qa-2 시점 1 exemplar (feed) 만 등록. 6 archetype × 1+ exemplar 부트스트랩 필요. 04-25 이후 추가 exemplars 머지됨 (modal/form/detail/empty_state/nav_list — 6/7 archetype 커버, onboarding 누락).

---

## 8. 더 읽을 자료

- **가장 중요**: `docs/superpowers/plans/2026-04-24-prototype-pipeline-upgrade.md` — v2 의 motivation + 4 gate 설계 한 번에
- **Batch day 6 plan**: `2026-04-25-{screen-archetype-persona,curated-exemplars,variants-by-default,de-eval-harness,verify-prototype-selectors,archetype-enum-nav-list}.md`
- **v2.2 6 plan**: `2026-04-25-{de-archetype-self-reclassification,form-persona-instant-save-clause,modal-picker-exception-clause,detail-blocked-variant-clause,empty-state-prd-copy-conflict-resolution}.md`
- **Persona files (가장 dense 한 운영 룰)**: `.claude/teammates/design-engineer-archetypes/{_index,feed,detail,onboarding,form,modal,empty_state,nav_list}.md`
- **DE 본체 (현재 Step A/B/C 룰 SSOT)**: `.claude/teammates/design-engineer.md`
- **Phase 3 운영 흐름**: `.claude/skills/sprint/phase-prototype.md`
- **dogfood 결과**: `sprint-orchestrator/sprints/ugc-platform-integration-qa-2/retrospective/v2-pipeline-dogfood-retrospective.md`

---

## 9. 회차 3 takeaway

> **Phase 3 의 진화는 "judgment-driven → rule-driven" 의 가장 명확한 사례.** v1 의 informal Pass 6 → v2 의 10 mechanical checks + 4 quality gates → v2.2 의 6 persona 예외 clauses 가 **모두 운영 마찰에서 자생**. 단 4 일 안에 dogfood → finding → plan → PR → 머지 사이클이 완료된 것이 self-improving 메커니즘이 실제로 작동한다는 증거.

---

## 10. 회차 4 예고 — Self-Improving 메커니즘

다음 회차에서는 Phase 6 Retro 의 self-improving 흐름을 단독으로 다룸:

- 3종 승격 의식 (6.7a Rubric / 6.7b Skill placeholder / 6.7c Rule / 6.7d Reflection)
- Rubric v{N} → v{N+1} promotion 알고리즘 + Promotion Log
- Pattern frequency 기반 자동화 (≥2 → rubric 후보, ≥3 → contract template, ≥5 → mandatory)
- Reflexion 1-page 회고의 Reflection 학술적 영향
- Cursor Rule auto-promotion 패턴의 도입 검토 (E1)
- 회차 1 의 5 inflection points 가 어떻게 self-improving 사이클의 결과인가

준비되면 "**회차 4 진행해 줘**" 로 트리거.
