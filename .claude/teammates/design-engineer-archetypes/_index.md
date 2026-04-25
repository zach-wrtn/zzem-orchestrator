# Design Engineer Archetype Personas

Screen Spec 의 `screen_archetype` 필드에 따라 DE 가 추가로 적용하는 persona 룰 모음.

## Index

| archetype | 파일 | 핵심 강제 룰 (요약) |
|-----------|------|------------------|
| feed | [feed.md](feed.md) | skeleton state 필수 / pull-to-refresh 힌트 / 첫 viewport 6+ 아이템 |
| detail | [detail.md](detail.md) | hero 320px+ / back 1-way / 핵심 metadata 4 이내 |
| onboarding | [onboarding.md](onboarding.md) | progress 표시 / primary CTA 56px+ / skip 옵션 |
| form | [form.md](form.md) | inline validation / submit disabled until valid / 1 primary action |
| modal | [modal.md](modal.md) | backdrop / 닫기 2-way (X + 외부 탭) / 1 primary + 0-1 secondary |
| empty_state | [empty_state.md](empty_state.md) | illustration or icon / 1 sentence + 1 CTA / 부정 어조 금지 |
| nav_list | [nav_list.md](nav_list.md) | row 동일 높이 / 우측 affordance / 섹션 그루핑 / primary CTA 0개 |

## 적용 흐름

1. Screen Spec `Meta.screen_archetype` 읽기
2. 해당 archetype md 파일을 Frozen Snapshot 에 인라인 (phase-prototype.md §3.2 Step 1 자동화)
3. Step C HTML 생성 시 DE 가 persona 의 "강제 룰" 모두 충족 — 충족 못하면 Pass 6 와 동일하게 STOP
4. persona 의 "권장 룰" 은 트레이드오프 — 의식적 거절 시 quality-report 에 `archetype_recommendation_skipped` 기록

## 메타 룰

- archetype 분류 자체가 모호하면 Sprint Lead 에 질의 (default 분류 금지)
- persona 룰은 **archetype 한정 추가 룰** — DESIGN.md / tokens.css / Pass 6 Audit 보다 약함 (충돌 시 상위 룰이 이김)
- persona 룰 변경/추가는 본 디렉토리 변경 → 별 PR 로 검토
- 신규 archetype 추가는 8번째 enum 으로 — Screen Spec template + DE Step B.1.1 + 본 _index.md 동시 갱신
