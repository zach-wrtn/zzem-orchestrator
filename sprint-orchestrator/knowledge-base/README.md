# Cross-Session Knowledge Base

> 스프린트 간 발견된 패턴을 축적하여 반복 결함을 사전에 방지하는 파일 기반 지식 베이스.

## Directory Structure

```
knowledge-base/
  README.md              ← 이 파일 (KB 스키마 + 프로토콜)
  patterns/
    README.md            ← 코드 패턴 인덱스 (markdown table)
    {category}-{NNN}.yaml ← 개별 패턴 파일
  design/
    README.md            ← 디자인 패턴 인덱스 (markdown table)
    {category}-{NNN}.yaml ← 개별 디자인 패턴 파일
```

## Pattern File Schema (YAML)

```yaml
id: "{category}-{NNN}"
title: "{1줄 제목}"
category: "{correctness | completeness | integration | edge_case | code_quality | design_proto | design_spec}"
severity: "{critical | major | minor}"
source_sprint: "{sprint-id}"
source_group: "group-{N}"
discovered_at: "{ISO8601}"
frequency: 1
last_seen: "{sprint-id}"

description: |
  {패턴 상세 설명}

detection: |
  {이 패턴을 감지하는 방법}

prevention: |
  {이 패턴을 예방하는 Contract/Spec 보강 방법}

contract_clause: |
  {Sprint Contract Done Criteria에 추가할 조항}

example:
  bad: |
    {잘못된 예시}
  good: |
    {올바른 예시}
```

### Category 분류

| Category | 설명 | 저장 위치 |
|----------|------|-----------|
| correctness | 기능 정확성 결함 | patterns/ |
| completeness | 구현 누락 | patterns/ |
| integration | BE/FE 연동 불일치 | patterns/ |
| edge_case | 엣지 케이스 미처리 | patterns/ |
| code_quality | 아키텍처/코드 품질 | patterns/ |
| design_proto | 프로토타입 디자인 패턴 | design/ |
| design_spec | 디자인 스펙 패턴 | design/ |

### Severity 분류

| Severity | 기준 |
|----------|------|
| critical | 기능 불가 또는 데이터 손실 |
| major | 기능 저하 또는 UX 심각 훼손 |
| minor | 코드 품질/스타일 문제 |

## Search Protocol

1. **인덱스 읽기**: `patterns/README.md` 또는 `design/README.md`의 테이블을 읽는다.
2. **필터링**: 현재 태스크와 관련된 category/severity로 필터링한다.
3. **상세 조회**: 관련 패턴의 `.yaml` 파일을 읽어 detection/prevention/contract_clause를 참조한다.
4. **Contract 반영**: contract_clause를 Sprint Contract의 Done Criteria에 포함시킨다.

### Relevance Mapping (태스크 유형 → 관련 카테고리)

| 태스크 유형 | 우선 참조 카테고리 |
|-------------|---------------------|
| API 설계/구현 | correctness, integration |
| FE 컴포넌트 구현 | completeness, code_quality |
| BE/FE 연동 | integration, correctness |
| 프로토타입 제작 | design_proto, design_spec |
| 네비게이션/라우팅 | completeness |
| DTO/모델 설계 | correctness, integration |

## Write Protocol

1. **기존 매칭 확인**: 인덱스에서 유사한 패턴이 있는지 확인한다.
2. **기존 패턴 업데이트**: 동일 패턴이면 frequency를 +1 하고 last_seen을 현재 sprint-id로 갱신한다.
3. **신규 패턴 생성**: 매칭되는 기존 패턴이 없으면 새 `.yaml` 파일을 생성하고 인덱스에 행을 추가한다.
4. **ID 채번**: `{category}-{NNN}` 형식, 해당 카테고리 내 최대 번호 + 1.

## Auto-Cleanup Rules

| 조건 | 액션 |
|------|------|
| frequency >= 3 | Sprint Contract 템플릿에 상시 반영 후보로 표시 |
| 3+ 스프린트 연속 미발견 | `archived/`로 이동 (인덱스에서 제거) |
| frequency >= 5 | Contract 템플릿에 필수 조항으로 승격 |
