# Variant Comparison: {ScreenName}

> 3개 DE variant 비교 gate. Sprint Lead가 사용자에게 제시.

## Inputs

```yaml
task_id: "{task-id}"
screen_name: "{ScreenName}"
generated_at: "{ISO8601}"
trigger: "{fabrication_risk_medium | variants_required | user_request}"
shared_snapshot_hash: "{hash of Frozen Snapshot — 입력 동일성 증명}"
```

## Variants

```yaml
variants:
  - id: A
    directive: Conservative
    prototype_path: "sprints/{sprint-id}/prototypes/app/{task-id}/variants/A/prototype.html"
    spec_path:      "sprints/{sprint-id}/prototypes/app/{task-id}/variants/A/screen-spec.yaml"
    quality_score:
      anti_slop_audit: passed | partial | failed
      fabrication_risk: none | low | medium
      file_size_bytes: {N}
    diff_highlights:
      - "{한 줄 — 다른 variant 대비 가장 두드러진 차이}"
      - "{또 한 줄}"
  - id: B
    # 동일 구조
  - id: C
    # 동일 구조
```

## Side-by-Side Screenshot

```
sprints/{sprint-id}/prototypes/app/{task-id}/variants/_comparison.png
```
3컷 가로 배열 (A | B | C). capture-screenshots.ts 가 variants 디렉토리 인식 시 자동 합성.

## User Decision

| 선택 | 동작 |
|------|------|
| **A** / **B** / **C** | 선택된 variant를 `prototype.html` (variants 부모 디렉토리)로 promote. 미선택 2개는 `variants/_archive/` 로 이동. |
| **mix** | 사용자가 원하는 부분을 지정 ("A의 헤더 + B의 카드 레이아웃"). DE 새 인스턴스 1개 스폰하여 mix 지시 반영 → 단일 모드로 재생성. |
| **stop** | 3개 모두 부적합. PRD 갭 가능성 — Sprint Lead가 prd-gaps.md 에 갭 추가 + Phase 3.4 Amendment 트리거. |
