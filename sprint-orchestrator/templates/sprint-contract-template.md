# Sprint Contract: Group {N}

> 이 계약서는 구현 시작 전 Generator(Engineer)와 Evaluator가 "done"의 의미에 합의하는 문서다.
> Sprint Lead가 초안을 작성하고, Evaluator가 리뷰하여 합의 후 구현이 시작된다.

## Scope

- **Sprint**: {sprint-id}
- **Tasks**:
  - `{task-id-1}`: {objective}
  - `{task-id-2}`: {objective}
- **API Endpoints**: {related endpoints from api-contract.yaml}

## Done Criteria

각 criterion은 코드에서 검증 가능해야 한다. 모호한 기준은 허용하지 않는다.

### Task: {task-id-1}

- [ ] {testable criterion 1 — 예: "POST /api/profiles 호출 시 201 반환 + DB에 프로필 레코드 생성"}
- [ ] {testable criterion 2 — 예: "닉네임 미입력 시 서버가 자동 생성한 닉네임이 8자 이내"}
- [ ] {testable criterion 3}

### Task: {task-id-2}

- [ ] {testable criterion 1}
- [ ] {testable criterion 2}

## Verification Method

Evaluator가 각 criterion을 **어떻게** 검증할지 명시한다.

| Criterion | 검증 방법 |
|-----------|----------|
| {criterion 1} | Controller → Service → Repository 로직 trace |
| {criterion 2} | Edge case: null 입력, 빈 문자열, 최대 길이 초과 |
| {criterion 3} | API contract 스키마와 실제 DTO 타입 비교 |

## Edge Cases to Test

- {edge case 1}: {expected behavior}
- {edge case 2}: {expected behavior}

## Business Rules to Validate

- {rule 1}: {how it should be reflected in code}
- {rule 2}: {how it should be reflected in code}

## Cross-Task Integration Points

- {integration point}: {what to verify}

---

_Evaluator 리뷰 완료: {날짜} / {합의 여부}_

## KB Pattern Clauses (자동 주입)

> Sprint Lead가 Contract 작성 시, `knowledge-base/patterns/README.md`에서
> 관련 패턴의 `contract_clause`를 Done Criteria에 자동 추가한다.
>
> 형식: `- [ ] {clause 내용} (KB: {pattern-id})`
>
> 주입 기준:
> - `severity: critical` → 항상 주입
> - `severity: major` + `frequency >= 2` → 주입
> - `severity: minor` → 주입하지 않음
