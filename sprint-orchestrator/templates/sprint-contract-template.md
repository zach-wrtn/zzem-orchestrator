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

### Default Verification Gates (ugc-platform-002 lessons 반영)

다음 grep/trace 게이트는 모든 Contract 에 기본 포함. 해당 없는 경우만 명시적으로 제외.

- [ ] **Mapper fallback 금지** (KB: completeness-008) — Entity/DTO 확장 시 fallback 이 semantic 을 깨뜨리지 않도록:
  - `rg '{fieldName}\s*\?\?\s*(0|false)|\|\|\s*""' src` → 0 hit 의무
  - Zod 필수 필드 강제 (`.nonnegative()` / `.boolean()`), 파싱 실패 시 item skip (fallback 금지)
  - 예외: optional 필드로 의도된 경우만 허용 (Contract 에 명시)

- [ ] **Dead hook/method/factory 금지** (KB: completeness-009) — 신규 hook/factory/컴포넌트 추가 시:
  - `rg '{hookName}\(' src --glob '*.tsx' --glob '*.ts'` → 실제 callsite ≥ 1 hit
  - 정의만 있고 0 callsite → Major 판정
  - Contract 는 callsite 위치를 구체 명시 (컴포넌트명 + 호출 조건)

- [ ] **Cross-component 전수 나열** (KB: completeness-010) — Entity/DTO 확장 시:
  - Contract §Scope 또는 §Cross-group Integration 에 영향 받는 endpoint/path 전수 나열
  - Discriminated union variant 3+ 인 경우 각 variant 의 mapper 경유 trace 의무
  - "모든" / "전체" / "각" 포괄 표현 발견 시 구체 path 목록으로 대체

### FE typecheck clean (rubric C7 v3 / KB completeness-003)

- [ ] `cd app/apps/MemeApp && yarn typescript 2>&1 | grep -v '@wrtn/' | grep 'error TS'` — 신규 0 hit (pre-existing cascade 제외)
- [ ] Route types 확장 시 전수 callsite 점검 (rubric C7 v3)

### BE cursor 규약 (rubric C10 / KB correctness-004)

- [ ] `rg '_id:\s*\{\s*\$lt\s*:' apps/{api}/src/persistence/` → 신규 hit 0 (cursor 는 `$lte`)
- [ ] Compound cursor 사용 시 `(sort_key, _id) <= cursor` 형식으로 tie-break

### nx e2e testMatch 검증 (rubric C11 / KB completeness-005)

- [ ] 신규 `.e2e-spec.ts` 추가 시 `nx test {project}-e2e --listTests | grep {spec}` → 포함 확인
- [ ] project.json::test-e2e target + jest-e2e.json::moduleNameMapper 존재 확인

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

## Prior Group Lessons (follow-up 스프린트 필수)

> follow-up 스프린트의 두 번째 그룹부터는 이전 그룹 checkpoint 의 Lessons for Next Group 을
> 필수 참조. Evaluator 는 Round 1 review 에서 동일 class 이슈 재발 위험 체계적 확인.
>
> ugc-platform-002 에서 Group 003 first-try PASS 는 Group 001/002 lessons 선제 반영 효과 입증.

**참조할 prior checkpoints**:
- `sprints/{prev-sprint-id}/checkpoints/group-{N-1}-summary.md` § Lessons for Next Group
- `sprints/{prev-sprint-id}/retrospective/pattern-digest.yaml` § patterns (특히 frequency ≥ 2)

## KB Pattern Clauses (자동 주입)

> Sprint Lead가 Contract 작성 시, Skill `zzem-kb:read` (type=pattern, category=관련 카테고리)로
> 반환된 파일들의 `contract_clause`를 Done Criteria에 자동 추가한다. KB 접근은 `zzem-kb:*` 스킬로만 수행.
>
> 형식: `- [ ] {clause 내용} (KB: {pattern-id})`
>
> 주입 기준:
> - `severity: critical` → 항상 주입
> - `severity: major` + `frequency >= 2` → 주입
> - `severity: minor` → 주입하지 않음

## Evaluator Round 1 Checklist

> Contract 리뷰 시 다음 항목을 체계적으로 확인.

- [ ] 포괄 표현 (`모든`, `전체`, `각`, `관련된`) 발견 시 구체 path/endpoint 목록 요구
- [ ] 신규 hook/factory/component 에 callsite grep 게이트 있는지
- [ ] Entity/DTO 확장 조항에 fallback 금지 grep 게이트 있는지
- [ ] Prior sprint retrospective 의 pattern 재발 위험 평가
- [ ] Storage primitive 언급 시 codebase 실제 래퍼 명시 (MMKV vs AsyncStorage 등)
- [ ] Contract 내부 모순 (동일 시나리오에 상이한 UI 동작 명시) 부재
