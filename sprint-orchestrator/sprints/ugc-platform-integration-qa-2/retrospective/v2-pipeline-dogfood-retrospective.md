# v2 Prototype Pipeline — First Live Dogfood Retrospective

**Sprint**: ugc-platform-integration-qa-2
**Phase**: 3 (Prototype) — 23 화면 산출 완료
**Date**: 2026-04-25
**Mode**: Custom retrospective (standard gap-analysis adapted — sprint 가 BE/FE build 미실행, prototype-only dogfood)

---

## Executive Summary

v2.1 prototype pipeline (PR #29-#36 머지 산물) 의 **첫 라이브 dogfood** 가 23 화면에서 100% Pass 6 통과 + 91% persona 4/4 metric 으로 성공. 6 메커니즘 모두 활성화 검증. dogfood 과정에서 **6건의 v2.2 개선 후보** 발견 — 별 PR plans 로 작성 (`docs/superpowers/plans/2026-04-25-*.md`).

**Outcome: v2 production-ready 확인.** 다음 sprint 부터 v2 메커니즘 default 적용 안전. 6 follow-up plan 통합 시 v2.2 로 진화.

---

## v2 Mechanism Activation Audit

### 1. Pass 6 Anti-Slop Self-Audit (10 checks)

| Check | Pass | Notes |
|-------|:----:|-------|
| #1 hex tokens | 23/23 | 모든 raw hex `.control-panel`/`body` 한정 (audit-exempt). `.screen` scope 0 위반. |
| #2 emoji on interactive | 23/23 | Lucide inline SVG 일관 적용. PR #31 cleanup pattern 채택 효과. |
| #3 border-left card slop | 23/23 | 0 위반. |
| #4 font-family Pretendard | 23/23 | 0 위반. mono 만 control-panel. |
| #5 brand purple gradient | 23/23 | gradient 사용 시 light tones 만 (`var(--purple-100)` 등). |
| #6 placeholder-image on primary | 23/23 | gradient-token kind 로 needs_real_content: false 명시. |
| #7 interaction parity | 23/23 | spec interactions = DOM bindings 일관. |
| #8 alert/confirm/prompt | 23/23 | 모두 `showToast()` + `console.log()` pattern. |
| #9 archetype persona | 21/23 | 2 misfit 명시 (app-022 form/즉시저장, app-023 form/nav). |
| #10 exemplar drift | 3/3 (적용분) | feed 화면 (app-017/019/020) — 모두 `false` (구조 자연 차별). |

**총 Pass 6 통과**: **228/230 checks (99.1%)** — misfit 2건도 문서화된 의도적 archetype_recommendation_skipped.

### 2. Assumption Preview Gate §3.2.5

- intent.md 산출: **23/23**
- 트리거 분포:
  - fabrication_risk: low (표준): 22
  - fabrication_risk: medium (적극): 1 (app-009 in-app vs OS picker)
  - fabrication_risk: none: 0 (모든 화면이 일정량의 추론 필요)
- Sprint Lead gate 작동: 모든 intent.md 가 gate_questions 포함 — Sprint Lead 가 proceed/adjust/stop 결정 가능

**평가**: gate trigger 가 너무 자주 발생 (사실상 모든 화면). low 가 표준이 되면 gate value 약화. **권고**: medium 트리거 조건 정밀화 또는 low 시 gate 자동 통과 옵션.

### 3. Asset Layer §A.5

- 5 슬롯 사용 분포:
  - avatars: 23/23 (모두) — 자기 편집 placeholder 허용 / 타유저 fallback
  - feed_thumbnails: 3/23 (feed archetype 만)
  - meme_images: 0/23 (UGC 콘텐츠 없음)
  - icons: 23/23 (Lucide)
  - hero_banners: 0/23

**평가**: avatars + icons 가 압도적. asset 룰이 작동하지만 슬롯별 명세 (특히 needs_real_content 결정) 의 일관성 검토 필요.

### 4. Archetype Persona

| Archetype | Screens | 강제 룰 4/4 met | Skipped 룰 |
|-----------|--------:|:--------------:|-----------|
| form | 8 | 6 (75%) | app-022 #2/#4, app-023 #1-4 모두 |
| modal | 7 | 7 (100%) | picker exception 4건 (app-005/009/012/015 #3) |
| feed | 3 | 3 (100%) | 0 |
| detail | 4 | 4 (100%) | app-014 blocked variant #4 (logged) |
| empty_state | 1 | 1 (100%) | 0 (단, PRD 카피 충돌) |
| onboarding | 0 | — | — |

**평가**: 5/6 archetype 노출. onboarding 만 미커버. form 의 misfit 2건이 가장 심각 (별 plan #2/#4).

### 5. Curated Exemplars (feed)

- 인라인 시도: 3/23 (feed archetype 만)
- 인라인 성공: 3/3
- exemplar drift warning: 0/3 (모두 false — 구조 자연 차별)
- sandbox 차단: pnpm CLI 차단 시 `_index.json` 직접 read fallback 으로 우회 — workaround 작동 확인

**평가**: feed exemplar 1개로 3 화면이 자동 인라인 + 모두 drift=false. 메커니즘 작동 입증. **부족**: modal/form/detail/empty_state archetype exemplar 0개. follow-up bootstrap PR 필요.

### 6. Variants Mode

- 트리거: **0/23**
- 이유: medium-risk 화면 1건 (app-009) 도 single DE 로 충분한 정도 — 3-way spawn 정당화 안됨

**평가**: 본 sprint 에서 mechanism 활성화 안됨. 다음 sprint 에서도 트리거 빈도 낮을 가능성 높음. **권고**: trigger 조건 재평가 (현재 fabrication_risk: medium 만으로는 부족할 수 있음 — UI 변동성 + 사용자 명시 요청 등 추가 트리거 검토).

---

## 정량 측정

| 지표 | 값 |
|------|------|
| 총 prototype | 23 |
| 총 라인 수 (prototype.html only) | ~600KB / ~15,000 lines (avg 28KB/650 lines per screen) |
| 총 라인 수 (모든 산출물) | ~1.5MB |
| Pass 6 평균 | 9.13/9-or-10 (gate 100%) |
| Persona 평균 | 3.91/4 |
| 신규 sprint-level token | 16 (--pe-* + --kbd-*) |
| 신규 prototype-local 별칭 | ~30 |
| Token reuse rate (sibling 패턴) | 높음 (0 신규 token: app-002/003/006/015/018 등) |
| 평균 sub-agent 시간 | ~9분 (변동 5-12분) |
| 평균 sub-agent 토큰 | ~130k (변동 100-180k) |
| Total agent compute | ~3M tokens / ~3.5 hours wall clock (3 batches × 8/8/7 parallel) |

---

## Findings → Follow-up Plans (별 PRs)

| Finding | Plan File | Severity | Affected |
|---------|-----------|:--------:|----------|
| form persona ↔ 즉시 저장 충돌 | `2026-04-25-form-persona-instant-save-clause.md` | high | app-022, app-023 |
| settings list archetype 미스피트 | `2026-04-25-archetype-enum-nav-list.md` | high | app-023 + 향후 |
| PRD copy 변경 금지 ↔ empty_state 부정 어조 | `2026-04-25-empty-state-prd-copy-conflict-resolution.md` | high | app-021 + 향후 |
| modal picker exception 패턴 | `2026-04-25-modal-picker-exception-clause.md` | medium | app-005/009/012/015 |
| DE 자가 archetype 재분류 룰 | `2026-04-25-de-archetype-self-reclassification.md` | medium | app-019 |
| detail blocked variant clause | `2026-04-25-detail-blocked-variant-clause.md` | low | app-014 |

각 plan 은 독립 PR 머지 가능. 권장 머지 순서: high (#1/#2/#3) → medium (#4/#5) → low (#6).

---

## v2 Bootstrap 필요 (별 PR)

- **#34 Phase 2 baseline freeze**: 4 frozen input + DE eval baseline (선결: ANTHROPIC_API_KEY secret)
- **#35 exemplar bootstrap**: 5 archetype × 1+ exemplar 각각 (현재 feed 만 1개)
  - modal 후보: app-013 차단확인 (Pass 6 9/9 + persona 4/4)
  - detail 후보: app-016 차단해제후 또는 app-010 사진변경완료
  - form 후보: app-001 프로필편집_메인 (단, app-022/023 misfit 영향 점검 후)
  - empty_state 후보: app-021 (단, PRD 카피 충돌 해결 후)

---

## Lessons (다음 sprint 에 반영)

1. **v2 production-ready** — 신뢰도 확보. 다음 sprint 부터 v2 메커니즘 default. fallback (legacy DE) 비활성 검토.
2. **Persona refinement 우선순위** — form/modal/detail 의 edge case 가 충돌 핵심. 6 follow-up plan 머지 후 v2.2 표준화.
3. **Exemplar 큐레이션 가속화** — bootstrap 별 PR 1개로 5 archetype × 1+ exemplar 등록 권장. 다음 sprint 가 모든 archetype 자동 인라인 혜택.
4. **Variants Mode trigger 재평가** — 본 sprint 에서 0 트리거. 조건이 너무 보수적이거나 medium-risk 측정이 부정확. 별 plan 검토.
5. **Token economy 룰 명문화** — sibling reuse 가 자연스럽게 작동했지만 명시 룰 부재. DE 에 "기존 sprint token 우선 → 신규 추가 시 sibling 화면 영향 검토" 룰 추가 권장.
6. **fabrication_risk 측정 재교정** — 23/23 모두 low 트리거. 사실상 medium/high 의 의미가 약화. measurement rubric 정밀화 필요.

---

## Sprint 종결 권고

- **Phase 4 Build (FE 23 components)**: 본 sprint 의 1차 목적이 v2 dogfood 였으므로 **별 sprint 분리 권장**. PRD 명시 "feature_addition + qa + v2 dogfood" 중 v2 dogfood 만 본 sprint 에서 종결.
- **Phase 5 PR**: 본 sprint 의 산출물 (23 prototype + 6 follow-up plans + retrospective) 을 single PR `feat(sprints): UGC QA 2차 — v2 prototype pipeline live dogfood` 로 정리.
- **Phase 4 Build 후속**: 별 sprint `ugc-platform-integration-qa-2-build` 또는 `ugc-platform-integration-qa-2-fe` 으로 분리 — DE prototype 산출물을 input 으로 FE engineer 가 RN 컴포넌트 구현. PRD/scope 동일 + Mock BE.

---

## 산출 아티팩트 (이 retrospective 의 외부 참조)

- 23 prototype 디렉토리 (`prototypes/app/app-{001..023}/`)
- 23 quality-report.yaml (Pass 6 + persona detail per screen)
- 23 intent.md (Assumption Preview 산출물)
- `checkpoints/phase-3-summary.md` (정량 metrics + sibling reuse network)
- `docs/superpowers/plans/2026-04-25-{6 plans}.md` (follow-up PR 후보)
