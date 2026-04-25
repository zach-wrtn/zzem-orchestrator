# Assumption Preview: BlockManagementUnblockedScreen (app-019)

> Trigger: `fabrication_risk = low` + 1개 핵심 archetype 결정 (feed vs detail) 발생.
> Sprint Lead 가 Step C(HTML 생성) 진입 전 검토할 결정 사항만 기록.

## Meta

```yaml
task_id: "app-019"
screen_name: "BlockManagementUnblockedScreen"
generated_at: "2026-04-25T00:00:00Z"
spec_fabrication_risk: "low"
spec_context_coverage: "1.0"
figma_frame: "37290:170246"
chosen_archetype: "feed"
chosen_archetype_alternative: "detail (Figma frame 명목상)"
```

## Archetype Decision (가장 중요)

| 결정 | feed |
| --- | --- |
| Figma frame title | "차단관리_해제완료" — detail 처럼 보임 |
| 실제 UI 구조 | app-017 의 N-1 갱신 list + Toast 오버레이 |
| detail 강제 룰 충돌 | hero 320px+ / primary CTA 1개 → list-row 패턴과 호환 안 됨 |
| feed 강제 룰 적합 | skeleton/empty/refresh/6+ items 모두 동일 적용 가능 |
| Sprint Lead 가이드 | task 본문 "권장: feed (차단관리 리스트 archetype 유지) — toast 만 추가" |
| **선택** | **feed** (task 권장 일치) |

**Reject 시**: detail 로 재분류하면 hero 영역(예: "1명 해제 완료" 큰 confirmation 카드) 추가 + list 자체는 보조 섹션으로 강등 — Figma 의 의도(리스트 갱신 결과)와 결이 다름.

## Inferred Layout Decisions

```yaml
inferred_layout:
  - decision: "app-017 의 list-row 구조 그대로 재사용 — 6 rows (7→6, '달리는토끼' u-001 제외)"
    rationale: "AC: 해제 사용자 row 제거. 동일 화면의 'before/after' 시각 일관성 위해 다른 6명은 닉네임/날짜 동일 유지."
    alternatives:
      - "전체 닉네임 셔플 (시각 demonstration 약화)"
      - "1 row 만 표시 + '나머지 펼치기' (UX 과잉)"
    would_break_if: "app-017 reference 가 없으면 fabrication risk 상승"

  - decision: "Toast 자동 노출 (auto-show on mount), 3000ms 후 dismiss"
    rationale: "AC-2.5 '결과를 즉시 확인하게 한다' 목적. 사용자 trigger 없이 진입 시점에 표시하는 것이 가장 자연스러움."
    alternatives:
      - "Toast 를 control-panel state 토글로만 노출 (현실 사용자 동선과 거리)"
      - "Toast 영구 표시 (3s auto-dismiss AC 위반)"
    would_break_if: "auto-show 가 verifier DOM 검증과 충돌하면 setTimeout 만 제거"

  - decision: "BlockCountSummary '차단된 사용자 6명' (이전 7 → 현재 6)"
    rationale: "1명 해제됨 변화 시각화 + feed 강제 룰 #3 (6+ items) 충족."
    alternatives:
      - "count 생략 (변화 인지 약화)"
    would_break_if: "사용자가 count UI 불필요하다면 1줄 제거"

  - decision: "empty state 별도 control-panel 토글 — '마지막 1명 해제 시' 시나리오 demonstrate"
    rationale: "AC: 0건 도달 시 empty placeholder 표시 — Sprint Lead 가 별도 시나리오 verify 가능"
    alternatives:
      - "empty 항상 노출 (default state 와 충돌)"
    would_break_if: "0건 분기 시연이 PRD 외 요구사항이라 판단되면 control-panel 옵션만 유지"
```

## Placeholder / Content Choices

```yaml
placeholders:
  - component_id: "#user-avatar-{0..5}"
    kind: "avatar"
    current: "이니셜 1글자 + neutral fill"
    source: "pattern-default — Pass 6 #6 의 '주 콘텐츠' 아님 (닉네임/액션이 주 콘텐츠)"
    needs_real_content: false
    note: "차단된 타유저 아바타 실 데이터 미공급. 행 list 의 보조 정보."

  - component_id: "#blocked-list li (× 6)"
    kind: "list-item"
    current: "신규 한국어 닉네임 6건 (app-017 의 7건 중 '달리는토끼' 제외)"
    source: "hardcoded — exemplar reuse 금지"
    needs_real_content: true
    note: "실제 데이터는 GET /v2/me/blocked-users 응답으로 대체. 본 화면은 mock prototype."

  - component_id: "#empty-view illustration"
    kind: "icon"
    current: "Lucide shield-check inline SVG (32px)"
    source: "Lucide pack — task hint '#PR 31 Lucide 패턴'"
    needs_real_content: false

  - component_id: "#toast"
    kind: "feedback-text"
    current: "달리는토끼님 차단 해제했어요"
    source: "AC-2.5 명시 + unblocked_user.nickname (app-017 첫 행 = 가장 최근 차단)"
    needs_real_content: false
```

## Interactions Not In PRD (보강)

```yaml
implicit_interactions:
  - interaction: "auto-mount → showToast(3000ms)"
    rationale: "AC-2.5 의 'Toast 표시 후 3s 내 auto-dismiss' 를 진입 시점에 자동 트리거 — 사용자 결과 즉시 확인 (PRD 의도)"
    removable: false

  - interaction: "tap #refresh-button → toggle-state loading"
    rationale: "feed 강제 룰 #4"
    removable: true

  - interaction: "swipe-down on #body-scroll → toggle-state loading"
    rationale: "모바일 표준 pull-to-refresh"
    removable: true

  - interaction: "tap #empty-action → go-back"
    rationale: "empty state 의 dead-end 회피"
    removable: false
```

## Anti-Slop Pre-Check (예상)

```yaml
anti_slop_risks:
  - item: "#1 (raw hex)"
    risk: "skeleton shimmer 또는 toast 배경의 mid-layer hex 누출"
    mitigation: "tokens.css var() 만 사용. control-panel 셀렉터 (#1a1a2e 등) 는 audit 제외 영역."

  - item: "#6 (placeholder-image on main content)"
    risk: "차단 리스트 avatar 가 주 콘텐츠로 간주될 위험"
    mitigation: "이니셜 텍스트 fallback. avatar 는 보조 정보 (닉네임/액션이 주)"

  - item: "#9 (feed persona 4 rules)"
    risk: "loading/empty/refresh 누락"
    mitigation: "states.loading/empty 명시 + RefreshButton + 6 rows (≥6) 보장"

  - item: "#10 (exemplar drift)"
    risk: "exemplar (free-tab) 의 카드 grid 패턴 무의식 모방"
    mitigation: "list-row 구조 (수직 1열 72px) 채택. 카드 grid CSS 일체 미재사용. drift < 30%."
```

## Gate Questions for Sprint Lead

```yaml
gate_questions:
  - "feed archetype 결정 OK? (Figma frame 은 detail 같지만 task 권장 + 구조적 적합성 모두 feed 지지)"
  - "Toast auto-show on mount 채택 OK? (사용자 trigger 없이 진입 시 3s 노출)"
  - "list_items 6명 = app-017 의 7명에서 '달리는토끼' 1건 제외 — before/after 일관성 OK?"
  - "empty state 시나리오를 control-panel 토글로 demonstrate 하는 것 OK? (AC: 0건 분기 명시이지만 default 진입은 6명)"
```

## User Action

| 선택 | 동작 |
|------|------|
| **proceed** | Step C(HTML 생성) 진행. 본 가정 모두 승인. |
| **adjust** | 위 inferred_layout 또는 placeholders 항목 변경 지시. DE 가 spec 수정 후 preview 재생성 (최대 2회). |
| **stop** | 본 화면 prototype 생성 중단. PRD 보강 필요. |

---

**Status**: Step C 진행 (proceed assumed unless Sprint Lead 가 adjust/stop 보냄).
