# PRD Amendment Proposal: {sprint-id}

> Generated from Phase 3 Prototype Revision Analysis
> Source PRD: {prd-file}
> Revision Stats: {N} screens revised, {M} total revision cycles

## Summary

{1~2문장: 몇 개 화면에서 어떤 유형의 갭이 발견되었는지}

## Amendments

### AMD-{N}: {제목}
- **카테고리**: {new_ac | clarify_ac | add_ui_spec | implicit_req | add_rule}
- **관련 AC**: AC {X.Y} (또는 "신규")
- **관련 화면**: {ScreenName}
- **Revision 근거**: {피드백 요약 + revision 유형(minor/major)}
- **현재 PRD 내용**: {기존 AC 텍스트 또는 "해당 없음"}
- **제안 개정 내용**:
  - Given {조건}
  - When {행동}
  - Then {기대 결과}
- **영향 범위**: {Backend task | App task | 양쪽 | 비즈니스 룰}
- **적용 권장**: {즉시 반영 | Phase 4 전 반영 | 다음 스프린트 이월}

---

## Revision Evidence

| 화면 | Task ID | Revision 횟수 | 유형 | 피드백 요약 | Amendment ID |
|------|---------|-------------|------|-----------|-------------|
| {ScreenName} | {task-id} | {N} | {minor/major} | {1줄 요약} | AMD-{N} |

## Amendment 분류 기준

| Revision 시그널 | PRD 갭 유형 | 카테고리 |
|----------------|-----------|---------|
| Major revision + 새 컴포넌트 추가 | AC 누락 | `new_ac` |
| Minor revision + 텍스트/라벨 변경 | AC 모호 | `clarify_ac` |
| Major revision + 레이아웃 구조 변경 | UI 명세 부재 | `add_ui_spec` |
| fabrication_risk: medium + approved | PRD 미언급 추론 승인 | `implicit_req` |
| 다수 화면에서 동일 패턴 revision | 공통 규칙 누락 | `add_rule` |

## Recommendations

- [ ] {개정안 적용 시 태스크 spec 업데이트 필요 목록}
- [ ] {API contract 변경 필요 여부}
- [ ] {Phase 4 진입 전 반영 필요 항목}

## Disposition

| AMD ID | 제목 | 판정 | 비고 |
|--------|------|------|------|
| AMD-{N} | {제목} | {apply / defer / dismiss} | {사유} |
