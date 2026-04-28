# 회차 2 — Knowledge Base 진화

> "왜 KB 가 in-tree YAML 에서 standalone git 리포 + 8 스킬 + two-axis 로 자랐는가"

**범위**: 2026-04-08 inception 의 file-based proto → 2026-04-27 현재의 standalone `zach-wrtn/knowledge-base` repo + 8 `zzem-kb:*` 스킬. 핵심 1차 사료: `docs/superpowers/specs/2026-04-18-knowledge-base-platform-phase1-design.md`, `2026-04-19-knowledge-base-phase1.1-hotfix-design.md`, `.claude/skills/sprint/knowledge-base.md`, `ARCHITECTURE.md` §Knowledge Base System (L357~425).

---

## TL;DR

1. **Pre-Phase-1 KB는 orchestrator 브랜치에 종속** → 2026-04-09 v4 reset 때 누적 학습 일부 유실. "self-improving" 메커니즘이 self-destructing 했음.
2. **Phase 1 (04-18)**: 별 git repo (`zach-wrtn/knowledge-base`) + JSON Schema 검증 + skill gate (5 스킬) 로 분리. **state independence + team share + protocol versioning** 의 3 가지 동시 해결.
3. **Phase 1.1 (04-19)**: pattern 스키마 검증 누락 + install-skills 사일런트 clobber 두 gap. `promote-rubric` 스킬 추가 — pattern → rubric clause **자동 escalation 의 시작**.
4. **Two-axis 재구성 (04-21)**: `learning/` (자기개선 메모리) + `products/` (제품 PRD/events) 로 분리. KB 가 **agent tuning 도구 → 제품 컨텍스트 관리도구** 로 확장.
5. 현재 8 스킬 (read/write-pattern/update-pattern/promote-rubric/write-reflection/sync + Notion sync 2종) 이 Phase 2~6 + QA-Fix 의 모든 KB 접근 지점을 단일 protocol 로 통일.

---

## 1. Pre-Phase-1 — 왜 이전이 필요했는가 (~04-17)

KB 의 1세대 형태:

```
sprint-orchestrator/knowledge-base/        ← orchestrator 트리 안에
├── patterns/*.yaml      (13개)
├── rubrics/*.md         (2개)
└── reflections/*.md     (3개)
```

**관측된 문제** (Phase 1 design spec §1.1):
1. **State 유실**: 2026-04-09 v4 reset 시 누적 학습 일부 사라짐. "다음 스프린트가 이전 학습을 소비한다" 가 무너짐.
2. **Worktree divergence**: 멀티 worktree 가 KB 사본을 서로 다른 상태로 봄.
3. **Schema 비강제**: sprint-contract-template 이 hardcoded 파일 경로로 patterns 참조. 형식 위반이 무성.
4. **Ad-hoc 접근**: 모든 read/write 가 직접 file ops. protocol versioning 불가.

→ "별 repo + skill gate" 구조의 동기.

---

## 2. Phase 1 — Standalone Repo (2026-04-18)

### 2.1 이전 매핑

| Before | After |
|--------|-------|
| `sprint-orchestrator/knowledge-base/patterns/*.yaml` | `$KB/learning/patterns/{category}-{NNN}.yaml` |
| `sprint-orchestrator/knowledge-base/rubrics/*.md` | `$KB/learning/rubrics/v{N}.md` |
| `sprint-orchestrator/knowledge-base/reflections/*.md` | `$KB/learning/reflections/{sprint-id}.md` |

`$KB` = `$ZZEM_KB_PATH` (기본 `~/.zzem/kb`) — orchestrator 외부.

### 2.2 Schema 형식화 (Draft 2020-12 JSON Schema)

`schemas/learning/{pattern,rubric,reflection}.schema.json` — CI (`validate.yml`) 가 모든 푸시를 검증. pattern schema 의 강제 룰:
- `id` prefix ↔ `category` 일치 (예: `correctness-001` 의 category 는 반드시 `correctness`)
- 필수 필드: `id, title, category, severity, source_sprint, discovered_at, frequency, last_seen, schema_version, description, detection, prevention, contract_clause`

### 2.3 5 초기 스킬

| 스킬 | 역할 |
|------|------|
| `zzem-kb:sync` | 각 phase 진입 시 fast-forward pull (idempotent) |
| `zzem-kb:read` | type=pattern\|rubric\|reflection + filter 로 조회 |
| `zzem-kb:write-pattern` | ID 자동 채번 + schema 검증 + rebase-retry push |
| `zzem-kb:update-pattern` | frequency 증가 + last_seen 갱신 |
| `zzem-kb:write-reflection` | 스프린트 retro 작성 |

### 2.4 Bootstrap 메커니즘

`.claude/settings.json` 의 SessionStart 훅 → `scripts/kb-bootstrap.sh` (idempotent clone + ff pull) → `scripts/install-skills.sh` (symlink `~/.claude/skills/zzem-kb/` → `$KB/skills/`). **세션 시작 시 자동 sync** — 사용자는 의식할 필요 없음.

### 2.5 왜 standalone repo (submodule 아님)

- **State independence**: orchestrator branch reset 에 영향 안 받음
- **Team share**: 별도 CODEOWNERS + branch protection 으로 schemas/skills 보호
- **Release cadence 분리**: KB 갱신과 orchestrator 갱신이 비동기
- **Protocol versioning**: 모든 read/write 가 skill 경유 → ad-hoc 접근 차단

---

## 3. Phase 1.1 Hotfix (2026-04-19)

dogfood 에서 발견된 2개 gap:

### Gap #2 — pattern YAML schema 검증 누락
rubrics/reflections 는 frontmatter 검증되었는데 **patterns 만 id/filename 일치만 체크**. → `scripts/validate-pattern-schemas.mjs` (Node + AJV) 추가, `validate-unique-ids` 다음 체인. CI 가 missing field / 잘못된 enum 거부.

### Gap #3 — install-skills 사일런트 clobber
다중 KB clone 이 `~/.claude/skills/zzem-kb` 를 경고 없이 덮어씀. → 동일 target 이면 no-op, 다른 target 이면 `ZZEM_KB_FORCE_LINK=1` 명시 필요. `tests/install-skills.test.sh` (4 케이스, $HOME sandbox) 추가.

### `promote-rubric` 스킬 신규 도입

frequency >= 2 인 pattern 을 활성 rubric (frontmatter `superseded_by: null`) 의 **Promotion Log** 행으로 append. 버전 bump (v{N} → v{N+1}) 는 수동 — 스킬은 log 만 적재. **이게 self-improving 의 첫 자동화** — 회차 4 의 깊이 있는 주제.

---

## 4. Two-Axis 재구성 (2026-04-21)

KB 의 의미 영역이 둘로 분기:

```
~/.zzem/kb/
├── learning/                # Axis 1 — 자기개선 메모리
│   ├── patterns/{category}-{NNN}.yaml
│   ├── rubrics/v{N}.md
│   └── reflections/{sprint-id}.md
└── products/                # Axis 2 — 제품 컨텍스트
    ├── {product}/
    │   ├── prd.md           # hand-authored overview
    │   └── events/          # event spec 카탈로그
    ├── active-prds/{notion-id}.md   # Notion 본문 미러
    └── notion-prds.yaml     # Notion DB 스냅샷
```

**왜 two-axis?**
- **Lifecycle 다름**: products 는 Notion 이 SSOT (`active-prds/` 는 overwrite-on-sync), learning 은 KB 자체가 SSOT
- **Authoring 주체 다름**: `learning/` 은 retro 자동, `products/` 는 사람이 hand-author + Notion 동기화
- **Read 패턴 다름**: `learning/` 은 phase 진입 시 자동 검색, `products/` 는 sprint 시작 시 canonical 확인

`zzem-kb:sync-prds-from-notion` (DB index 갱신) + `zzem-kb:sync-active-prds` (본문 미러) 두 스킬이 추가되어 **8 스킬 set** 완성.

---

## 5. 8 zzem-kb 스킬 — 역할 분담

| 스킬 | 1줄 역할 | 도입 |
|------|---------|------|
| `sync` | 각 phase 시작 시 ff pull | Phase 1 |
| `read` | type+filter 로 모든 type 조회 | Phase 1 |
| `write-pattern` | 신규 pattern 작성 (ID 자동 + schema 검증 + push) | Phase 1 |
| `update-pattern` | frequency / last_seen 갱신 | Phase 1 |
| `write-reflection` | 스프린트 retro 작성 | Phase 1 |
| `promote-rubric` | pattern → rubric Promotion Log append | Phase 1.1 |
| `sync-prds-from-notion` | Notion DB → `notion-prds.yaml` 스냅샷 | Phase 2 (two-axis) |
| `sync-active-prds` | 진행 중 Notion PRD 본문 → `active-prds/` 미러 | Phase 2 |

---

## 6. KB 라이프사이클 — Phase 별 매핑

| Phase | KB 동작 | 스킬 |
|-------|---------|------|
| **Phase 2 Spec** | 관련 patterns + 동일 도메인 reflections 조회 → spec 에 반영 | `sync` → `read type=pattern category=...`, `read type=reflection domain=...` |
| **Phase 4.1 Contract** | critical pattern 의 `contract_clause` 를 Done Criteria 에 자동 주입 | `read` + 템플릿 자동화 |
| **Phase 4.4 Evaluate** | 활성 rubric 로드 + 관련 patterns 의 detection 룰 | `read type=rubric status=active`, `type=pattern` |
| **Phase 6 Retro** | (a) pattern-digest → match → write/update (b) freq≥2 → promote-rubric (c) write-reflection (d) DE fabrication_risk → write-pattern category=design_proto | 5종 write 스킬 모두 |
| **Phase QA-Fix Stage 5** | P0/P1 fix 만 KB 후보 추출 → retro 단계 사용자 승인 후 머지 | `write-pattern` |

**Injection 룰** (4.1 Contract 자동 주입):
- `severity: critical` → 항상
- `severity: major` + `frequency >= 2` → 주입
- `severity: minor` → 스킵

---

## 7. Pattern Schema — 실제 예시

`~/.zzem/kb/learning/patterns/correctness-002.yaml` 의 실 데이터:

```yaml
id: correctness-002
title: JS getter가 JSON 직렬화에서 누락
category: correctness
severity: critical
source_sprint: ugc-profile-nav-001
source_group: group-001
discovered_at: '2026-04-06T00:00:00+09:00'
frequency: 1
last_seen: ugc-profile-nav-001
schema_version: 1
description: |
  DTO 클래스에서 get 키워드로 정의된 getter 프로퍼티는
  JSON.stringify() / class-transformer 직렬화에서 누락된다.
detection: |
  - DTO 의 get 키워드 프로퍼티 검색
  - JSON.stringify(new DtoInstance()) 에 해당 필드 출력 여부
prevention: |
  - 모든 응답 필드는 일반 property + @ApiProperty()
  - getter 사용 금지
contract_clause: |
  DTO 의 모든 API 응답 필드는 일반 property + @ApiProperty() 로 선언.
  get 키워드 사용 금지.
example:
  bad: |
    class UserProfileDto { @ApiProperty() get displayName(): string {…} }
  good: |
    class UserProfileDto { @ApiProperty() displayName: string; }
```

**구조 핵심**:
- frontmatter = machine-readable metadata (자동 검색 / injection / archive 룰의 입력)
- body = human-readable explanation (description / detection / prevention / contract_clause / example)
- `contract_clause` 가 Phase 4.1 자동 주입의 payload

---

## 8. Self-Archival 룰 (현재 — 수동, Phase 2 자동화 후보)

- `frequency >= 3` → Sprint Contract template 영구 반영 권장 (사용자 nudge)
- `frequency >= 5` → template mandatory clause 권장
- `last_seen` 이 3 sprint 미갱신 → `status: archived` 마킹

**현재 자동 강제 안 됨** — Retro 에서 수동 review. CI auto-cleanup job 은 sprint-id 산술 필요해 보류 (Phase 2 candidate). 메트릭 민감도를 2~3 스프린트 더 관찰 후 자동화 결정.

---

## 9. Trade-offs & Open Questions

**Standalone repo 의 cost**:
- Dual clone + symlink 유지 → SessionStart 훅으로 idempotent 처리
- Free-tier GitHub 의 path-scoped ruleset 부재 → CI tripwire (`guard-sensitive-paths.yml`) 로 보완
- 신규 머신 cold-start: `git clone` 한 번 (~40 파일, 빠름)

**Skill-only access 가 강제하는 것**:
- Protocol versioning (모든 접근이 SKILL.md 경유)
- Schema 보호 (직접 file ops 차단)
- Non-blocking validation (write 충돌 시 rebase-retry)

**Missing / roadmap** (Phase 2+ 후보):
- Semantic search (pgvector) — 현재 ~40 파일 규모에는 Glob+Read 충분
- Auto-cleanup CI job
- `bump-rubric` 스킬 (clause body 까지 다루는 자동 v{N+1})
- Observability dashboard
- `domain` enum 표준화 (reflections)

---

## 10. 더 읽을 자료

- **가장 중요**: `docs/superpowers/specs/2026-04-18-knowledge-base-platform-phase1-design.md` §1.1 (motivation), §2 (axes), §4 (skills), §5 (bootstrap)
- 후속: `docs/superpowers/specs/2026-04-19-knowledge-base-phase1.1-hotfix-design.md` (Gap 2 + 3)
- 운영 protocol: `.claude/skills/sprint/knowledge-base.md`
- 현재 SSOT: `ARCHITECTURE.md` §Knowledge Base System (L357~L425)
- 실제 데이터 둘러보기: `~/.zzem/kb/learning/patterns/` (현재 patterns) + `~/.zzem/kb/learning/rubrics/v1.md` + `~/.zzem/kb/products/`

---

## 11. 회차 2 핵심 takeaway

> **KB 의 진화는 self-improving 메커니즘 자체가 self-destructing 하지 않게 만든 과정.** state independence (별 repo) + protocol versioning (skill gate) + schema 강제 (JSON Schema CI) 가 3 축. two-axis 분리는 KB 의 역할을 "agent tuning" 에서 "제품 컨텍스트 SSOT" 로 확장.

---

## 12. 회차 3 예고 — Prototype Pipeline v1 → v2 → v2.2

다음 회차에서는 Phase 3 Prototype 의 진화를 단독으로 다룸:

- v1 (~04-23) 의 단순 6-pass HTML 생성
- 04-24 v2 도입의 4 가지 quality gate (Pass 6 anti-slop / Assumption Preview / verify-prototype / Asset Layer)
- 04-25 batch day — archetype enum, persona 룰, variants mode, curated exemplars 의 동시 land
- v2.2 (04-25 후속) — DE 자가 재분류, persona 예외 clauses (form/modal/detail/empty_state)
- ugc-platform-integration-qa-2 의 첫 라이브 dogfood 결과 (Pass 6 99.1% / persona 91%)
- DE eval harness 의 ANTHROPIC_API_KEY 게이트 (현재 dormant)

준비되면 "**회차 3 진행해 줘**" 로 트리거.
