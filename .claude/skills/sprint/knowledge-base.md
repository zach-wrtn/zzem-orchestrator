# Knowledge Base Search/Write Protocol

> Sprint Lead가 스프린트 각 Phase에서 Knowledge Base를 참조하고 갱신하는 프로토콜.

## KB Location

```
sprint-orchestrator/knowledge-base/
  patterns/README.md    ← 코드 패턴 인덱스
  patterns/*.yaml       ← 개별 코드 패턴
  design/README.md      ← 디자인 패턴 인덱스
  design/*.yaml         ← 개별 디자인 패턴
```

---

## KB Search Protocol

### When to Search

| Phase | Trigger | 목적 |
|-------|---------|------|
| Phase 2 (Spec) | API/DTO 설계 시작 | correctness, integration 패턴으로 스펙 보강 |
| Phase 3 (Prototype) | 프로토타입 제작 시작 | design_proto, design_spec 패턴으로 품질 향상 |
| Phase 4.1 (Contract) | Done Criteria 작성 | 모든 패턴의 contract_clause를 Criteria에 반영 |
| Phase 4.4 (Evaluate) | 평가 기준 수립 | 기존 패턴의 detection 방법을 평가 체크리스트에 포함 |

### How to Search

```
1. Read index → patterns/README.md 또는 design/README.md의 테이블 확인
2. Filter → 현재 태스크와 관련된 category/severity로 필터링
3. Read details → 관련 패턴의 .yaml 파일에서 detection/prevention/contract_clause 참조
4. Apply → contract_clause를 Sprint Contract Done Criteria에 추가
```

### Relevance Mapping (태스크 유형 → 카테고리)

| 태스크 유형 | 우선 참조 카테고리 |
|-------------|---------------------|
| API 엔드포인트 구현 | correctness, integration |
| DTO/모델 설계 | correctness (특히 직렬화 관련) |
| FE 컴포넌트 구현 | completeness, code_quality |
| BE/FE 연동 작업 | integration, correctness |
| 네비게이션/라우팅 | completeness |
| 프로토타입 제작 | design_proto, design_spec |
| 페이지네이션 구현 | correctness (커서 래핑 패턴) |
| 훅/유틸리티 생성 | completeness (호출부 동반) |

### Search Output Format

KB 검색 결과를 Contract에 반영할 때:

```markdown
## KB-Informed Done Criteria

> Knowledge Base에서 {N}개 관련 패턴을 발견하여 Done Criteria에 반영:

- [ ] [correctness-001] 페이지네이션 Controller에서 DTO 재래핑 금지
- [ ] [integration-001] BE DTO 필드명과 FE 타입 필드명 일치 확인
  ...
```

---

## KB Write Protocol

### When to Write

| Phase | Trigger | 기록 대상 |
|-------|---------|-----------|
| Phase 6 (Retro) | pattern-digest.yaml 생성 후 | 코드 패턴 (patterns/) |
| Phase 6 (Retro) | quality-report fabrication_risk 분석 후 | 디자인 패턴 (design/) |

### How to Write

#### Step 1: Match Existing

```
1. Read patterns/README.md (또는 design/README.md) 인덱스
2. 새 패턴의 title/description과 기존 패턴 비교
3. 동일 패턴이면 → Update (Step 2a)
4. 신규 패턴이면 → Create (Step 2b)
```

#### Step 2a: Update Existing Pattern

```yaml
# 기존 .yaml 파일에서:
frequency: {기존값 + 1}
last_seen: "{현재 sprint-id}"
```

```markdown
# 인덱스 README.md 테이블에서:
Freq 컬럼 +1, Last Seen 컬럼을 현재 sprint-id로 갱신
```

#### Step 2b: Create New Pattern

```
1. ID 채번: {category}-{NNN} (해당 카테고리 최대 번호 + 1)
2. .yaml 파일 생성 (스키마는 KB README.md 참조)
3. 인덱스 README.md 테이블에 새 행 추가 (최신순 = 테이블 최상단)
```

### Design Pattern Recording

quality-report에서 fabrication_risk가 감지되면:

```yaml
category: "design_proto"  # 또는 "design_spec"
severity: "{fabrication_risk 수준에 따라}"
description: |
  {프로토타입에서 발견된 디자인 문제 설명}
prevention: |
  {component-patterns.md 참조 또는 Figma 레퍼런스 강화 방법}
```

---

## Auto-Cleanup Rules

Phase 6에서 KB Write 후 다음 규칙을 적용:

| 조건 | 액션 | 구현 |
|------|------|------|
| frequency >= 3 | Sprint Contract 템플릿 반영 후보 | templates/sprint-contract.md에 TODO 코멘트 추가 |
| frequency >= 5 | Contract 템플릿 필수 조항 승격 | templates/sprint-contract.md에 항목 추가 |
| 3+ 스프린트 연속 미발견 | 아카이브 | .yaml을 archived/로 이동, 인덱스에서 제거 |

### Cleanup Check Method

```
현재 sprint 번호에서 last_seen sprint 번호를 빼서 3 이상이면 아카이브 대상.
예: 현재 sprint-005, last_seen sprint-001 → 4 스프린트 미발견 → 아카이브
```
