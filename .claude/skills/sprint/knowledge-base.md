# Knowledge Base Search/Write Protocol

> Sprint Lead가 스프린트 각 Phase에서 Knowledge Base를 참조하고 갱신하는 프로토콜.
>
> **KB 접근은 반드시 `zzem-kb:*` 스킬로만 수행한다.** 파일시스템 직접 읽기/쓰기 금지.

## KB Location

- **Source of truth**: `git@github.com:zach-wrtn/knowledge-base.git`
- **Local clone**: `$ZZEM_KB_PATH` (기본 `~/.zzem/kb`) — SessionStart 훅이 자동으로 clone/pull
- **Content layout** (two axes):
  - Axis 1 (self-improving): `learning/patterns/*.yaml`, `learning/rubrics/*.md`, `learning/reflections/*.md`
  - Axis 2 (product specs): `products/{ai-webtoon,free-tab,ugc-platform}/prd.md` + `events.yaml`

---

## Skills

| Skill | 용도 |
|-------|------|
| `zzem-kb:sync` | 각 Phase 진입 시 fast-forward pull (Phase 2/3/4 첫 KB 접근 전, Phase 6 write 전) |
| `zzem-kb:read` | 조회 (type=pattern\|rubric\|reflection\|prd\|events, 필터: category/domain/status/limit/product) |
| `zzem-kb:write-pattern` | 신규 패턴 생성 |
| `zzem-kb:update-pattern` | 기존 패턴 frequency/severity 갱신 |
| `zzem-kb:write-reflection` | 스프린트 말미 retrospective 기록 |
| `zzem-kb:promote-rubric` | pattern → evaluator rubric clause 승격 (Phase 6 §6.7a) |
| `zzem-kb:sync-prds-from-notion` | Notion 데이터베이스 → `products/notion-prds.yaml` 동기화 |
| `zzem-kb:sync-active-prds` | 진행 중 feature PRD 본문 → `products/active-prds/{notion-id}.md` 미러링 |

> **Sync 타이밍**: SessionStart 훅(`scripts/kb-bootstrap.sh`)이 bootstrap 시점에 ff-only를 시도하나, long-running 스프린트 중 upstream이 갱신될 수 있다. 각 Phase 첫 KB 접근 전에 `zzem-kb:sync`를 호출해 최신 상태를 보장한다.

---

## KB Search Protocol

### When to Search

| Phase | Trigger | 목적 | Skill 호출 |
|-------|---------|------|-----------|
| Phase 2 (Spec) | 스펙 설계 시작 | correctness, integration 패턴으로 스펙 보강 | `zzem-kb:read type=pattern category=correctness` (및 integration) |
| Phase 2 (Spec) | 도메인 학습 | 과거 retrospective 참조 | `zzem-kb:read type=reflection domain=<domain> limit=3` |
| Phase 3 (Prototype) | 프로토타입 제작 시작 | design_proto, design_spec 패턴 | `zzem-kb:read type=pattern category=design_proto` |
| Phase 4.1 (Contract) | Done Criteria 작성 | 모든 관련 패턴의 contract_clause를 Criteria에 반영 | `zzem-kb:read type=pattern category=<관련 카테고리>` |
| Phase 4.4 (Evaluate) | 평가 기준 수립 | 최신 rubric 로드 + 패턴의 detection 기준 포함 | `zzem-kb:read type=rubric status=active`, `zzem-kb:read type=pattern ...` |

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

주입 기준 (sprint-contract-template.md와 일치):
- `severity: critical` → 항상 주입
- `severity: major` + `frequency >= 2` → 주입
- `severity: minor` → 주입하지 않음

---

## KB Write Protocol

### When to Write

| Phase | Trigger | 기록 대상 | Skill |
|-------|---------|-----------|-------|
| Phase 6 (Retro) | pattern-digest.yaml 생성 후 | 신규 코드 패턴 | `zzem-kb:write-pattern` |
| Phase 6 (Retro) | 기존 패턴 재발견 | frequency/severity 갱신 | `zzem-kb:update-pattern` |
| Phase 6 (Retro) | 스프린트 종료 | 도메인 학습 기록 | `zzem-kb:write-reflection` |
| Phase 6 (Retro) | quality-report fabrication_risk 감지 | 디자인 패턴 | `zzem-kb:write-pattern category=design_proto` |

### How to Write

#### Step 1: Match Existing

```
1. zzem-kb:read type=pattern category=<해당 카테고리>
2. 새 패턴의 title/description과 기존 패턴 비교
3. 동일 패턴이면 → zzem-kb:update-pattern (Step 2a)
4. 신규 패턴이면 → zzem-kb:write-pattern (Step 2b)
```

#### Step 2a: Update Existing Pattern

`zzem-kb:update-pattern id=<pattern-id>` 호출. 스킬이 frequency+1, last_seen=<현재 sprint-id>를 rebase-retry로 반영.

#### Step 2b: Create New Pattern

`zzem-kb:write-pattern` 호출 시 category만 지정하면 스킬이 자동으로 다음 ID({category}-{NNN+1}) 채번 + 스키마 검증 + 커밋/푸시 처리. 충돌 시 rebase-retry.

### Design Pattern Recording

quality-report에서 fabrication_risk가 감지되면:

```yaml
category: "design_proto"  # 또는 "design_spec"
severity: "{fabrication_risk 수준에 따라}"
description: |
  {프로토타입에서 발견된 디자인 문제 설명}
prevention: |
  {docs/designs/README.md 참조 또는 Figma 레퍼런스 강화 방법}
```

---

## Auto-Cleanup Rules

Phase 6에서 KB Write 후 다음 규칙을 적용 (Phase 2+ 자동화 대상; 현재는 Sprint Lead가 주기적 수동 점검):

| 조건 | 액션 |
|------|------|
| frequency >= 3 | Sprint Contract 템플릿 반영 후보 |
| frequency >= 5 | Contract 템플릿 필수 조항 승격 |
| 3+ 스프린트 연속 미발견 | status=archived로 변경 |

### Cleanup Check Method

```
현재 sprint 번호에서 last_seen sprint 번호를 빼서 3 이상이면 아카이브 대상.
예: 현재 sprint-005, last_seen sprint-001 → 4 스프린트 미발견 → archived
```

---

## Failure Handling

- **CI 거부**: `zzem-kb:*` 스킬은 push 실패 시 에러를 바로 반환. 스키마 위반 내용을 확인해 수정 후 재시도.
- **Concurrent write 충돌**: rebase-retry 내장. 재시도 후에도 실패하면 수동 조사 필요.
- **Bootstrap 실패**: `$ZZEM_KB_PATH`가 없으면 SessionStart 훅(`scripts/kb-bootstrap.sh`)을 수동 실행.
