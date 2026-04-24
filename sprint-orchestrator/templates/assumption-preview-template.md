# Assumption Preview: {ScreenName}

> Design Engineer가 Step C(HTML 생성) 시작 전에 공개하는 가정·선택 근거 문서.
> Sprint Lead는 이 문서를 사용자에게 제시하여 조기 승인/보정을 받는다.
> YAML/테이블만 — 산문 금지.

## Meta

```yaml
task_id: "{task-id}"
screen_name: "{ScreenName}"
generated_at: "{ISO8601}"
spec_fabrication_risk: "{none | low | medium}"
spec_context_coverage: "{why_linked 비율}"
```

## Inferred Layout Decisions

PRD/태스크에 명시적으로 없지만 DE가 컴포넌트 배치/계층을 추론한 항목. 각 항목은 근거와 대체 옵션을 동반한다.

```yaml
inferred_layout:
  - decision: "{레이아웃 결정 요약}"
    rationale: "{왜 이 선택 — DESIGN.md §N 또는 pattern {key} 근거}"
    alternatives:
      - "{대안 1 — 이 선택이 맞지 않을 때 사용자가 고를 수 있는 옵션}"
      - "{대안 2}"
    would_break_if: "{이 가정이 틀린 경우 수정 범위 — 예: 'Body 스크롤 구조 전체 재작업'}"
```

## Placeholder / Content Choices

실제 콘텐츠가 없어 DE가 placeholder 또는 샘플 데이터로 채운 위치. 진짜 콘텐츠로 채워야 하는 곳을 명시.

```yaml
placeholders:
  - component_id: "{#html-id}"
    kind: "{image | text | avatar | list-item | ...}"
    current: "{현재 채워진 값 요약}"
    source: "{context-engine.assets.{key} | hardcoded | pattern-default}"
    needs_real_content: "{true | false}"
    note: "{특이사항}"
```

## Interactions Not In PRD

Screen Spec interactions 중 PRD AC에서 직접 도출되지 않은 항목. DE가 패턴/관례로 추가한 것.

```yaml
implicit_interactions:
  - interaction: "{spec interactions[] 의 trigger+target+action 요약}"
    rationale: "{왜 추가 — 예: '리스트는 관례상 pull-to-refresh 필수'}"
    removable: "{true | false — 사용자가 빼라고 했을 때 제거 가능한가}"
```

## Anti-Slop Pre-Check (예상)

Pass 6 audit에서 걸릴 가능성이 있다고 DE가 self-flag한 항목.

```yaml
anti_slop_risks:
  - item: "{체크리스트 번호 1~7}"
    risk: "{예상 실패 원인}"
    mitigation: "{Pass 6 전에 어떻게 해결할지}"
```

## Gate Questions for Sprint Lead

사용자에게 물을 항목 (Sprint Lead가 요약하여 질의).

```yaml
gate_questions:
  - "{질문 1 — yes/no 또는 a/b/c 형식}"
  - "{질문 2}"
```

## User Action

| 선택 | 동작 |
|------|------|
| **proceed** | Step C(HTML 생성) 진행. 가정 모두 승인. |
| **adjust** | 특정 `inferred_layout` 또는 `placeholder` 항목 변경 지시. DE가 Screen Spec을 수정한 뒤 preview 재생성. |
| **stop** | 이 화면의 프로토타입 생성 중단. PRD 보강 필요 — Sprint Lead가 PRD Amendment 트리거. |
