# Evaluation Criteria — Sprint {sprint-id}

> Phase 2 (Spec)에서 Planner가 생성. Evaluator의 평가 기준 프레임워크.

## Grading Dimensions

| 기준 | 가중치 | 설명 |
|------|--------|------|
| **Correctness** | 높음 | 비즈니스 로직이 AC와 정확히 일치하는가 |
| **Completeness** | 높음 | 모든 요구사항이 구현되었는가 (stub/placeholder 없이) |
| **Edge Cases** | 중간 | 경계 조건과 에러 상태가 올바르게 처리되는가 |
| **Integration** | 중간 | API contract과 실제 구현이 일관되는가 |
| **Code Quality** | 낮음 | 기존 패턴 준수, 가독성 (모델이 기본적으로 잘 하는 영역) |

> Code Quality 가중치가 낮은 이유: Claude는 기본적으로 코드 품질이 높다.
> Correctness와 Completeness에 집중하는 것이 품질 향상에 더 효과적이다.

## Severity Classification

| Severity | 정의 | 예시 |
|----------|------|------|
| **Critical** | 기능 불가 또는 데이터 손상 위험 | API 500 반환, 무한 루프, 인젝션 취약점 |
| **Major** | 기능 동작하나 AC 미충족 / 비즈니스 규칙 위반 | 팔로우 해제 시 카운트 미감소, 차단 유저 피드 노출 |
| **Minor** | 동작에 영향 없는 코드 품질 이슈 | unused import, 비효율적 쿼리 |

## Verdict Rules

- **PASS**: Critical 0, Major 0 → 다음 그룹 진행
- **ISSUES**: Critical 0, Major 1+ → 수정 후 재평가
- **FAIL**: Critical 1+, 또는 Major 3+ → 수정 후 재평가

## Evaluator Calibration

### Skepticism Anchors

```
당신은 코드 리뷰어가 아니라 버그 헌터다.

- 구현이 완벽해 보여도 의심하라
- "이건 동작할 것 같은데..."라고 느끼면 실제로 trace하라
- 문제를 발견한 후 "별거 아닐 수도"라고 자신을 설득하지 마라
- Happy path가 아닌 edge case에서 시작하라
- 코드가 "존재"하는 것과 "올바르게 동작"하는 것은 다르다
```

### Anti-Patterns to Avoid

- 파일/함수 존재만 확인하고 VERIFIED 판정
- 이슈를 나열한 뒤 "전반적으로 잘 구현되었다"로 결론
- Generator의 의도를 선의로 해석하여 불완전한 구현 통과
- Happy path만 테스트하고 PASS 판정

## Group-Specific Criteria

### Group 001: {feature name}

**핵심 검증 포인트:**
- {specific focus area for this group}
- {business rule to verify}
- {edge case to test}

### Group 002: {feature name}

**핵심 검증 포인트:**
- {specific focus area}
- {business rule}
- {edge case}
