# Curated Exemplar Showcases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** sprint-gallery에 **gold-standard 프로토타입 컬렉션**을 Zod-validated 메타데이터로 큐레이션하고, 다음 sprint의 Design Engineer Frozen Snapshot에 **자동 인라인** 시켜 DE가 좋은 사례를 참조하며 산출하게 한다. PR #29 v2 파이프라인의 Pass 6 Anti-Slop Audit + verify-prototype 통과를 큐레이션 자격 조건으로 사용.

**Architecture:** 3 Phase 독립. Phase 1·2 는 sprint-gallery 코드 변경(스키마 + CLI), Phase 3 은 sprint 파이프라인 통합(`.claude/skills/sprint/phase-prototype.md` + `.claude/teammates/design-engineer.md`).

**Tech Stack:** TypeScript + Zod (스키마/검증), tsx CLI (큐레이션 도구), Markdown (프로토콜 변경), 기존 sprint-gallery Astro 구조.

---

## File Structure

| Phase | File | Action | Responsibility |
|-------|------|--------|---------------|
| 1 | `sprint-gallery/src/lib/exemplars/schema.ts` | Create | Zod 스키마 정의 (Exemplar, ArchetypeEnum) |
| 1 | `sprint-gallery/exemplars/_index.json` | Create | 컬렉션 인덱스 (id 목록 + last_validated) |
| 1 | `sprint-gallery/exemplars/README.md` | Create | 큐레이션 룰 + 자격 조건 문서 |
| 2 | `sprint-gallery/scripts/exemplar-add.ts` | Create | CLI: prototype 을 exemplar 로 등록 |
| 2 | `sprint-gallery/scripts/exemplar-validate.ts` | Create | CLI: 모든 exemplar 의 verify-prototype + Pass 6 통과 재검증 |
| 2 | `sprint-gallery/scripts/exemplar-lookup.ts` | Create | CLI: archetype + 키워드 매칭 — 다음 sprint 의 DE 가 호출 |
| 2 | `sprint-gallery/package.json` | Modify | `gallery:exemplar:*` 스크립트 + build 체인에 validate 삽입 |
| 2 | `sprint-gallery/tests/exemplars.test.ts` | Create | 스키마 + lookup 단위 테스트 |
| 3 | `.claude/skills/sprint/phase-prototype.md` | Modify | §3.2 Step 1 Frozen Snapshot 에 exemplar lookup 단계 추가 |
| 3 | `.claude/teammates/design-engineer.md` | Modify | Step A.2 Context Engine 조립 시 exemplars 입력 처리 + "참고만, 모방 금지" 룰 |

---

## Phase 1 — Schema + Storage

큐레이션 데이터의 형태를 Zod 로 강제하고, 컬렉션 인덱스 + README 로 큐레이션 룰을 명문화.

### Task 1.1: Exemplar Zod 스키마 정의

**Files:**
- Create: `sprint-gallery/src/lib/exemplars/schema.ts`

- [ ] **Step 1: 스키마 작성**

```typescript
import { z } from 'zod';

export const ScreenArchetype = z.enum([
  'feed',         // 스크롤 리스트 (피드, 검색결과)
  'detail',       // 상세 페이지 (hero + body)
  'onboarding',   // 진행형 (스텝 + large CTAs)
  'form',         // 입력 (validation + 버튼 상태)
  'modal',        // 모달/시트 (backdrop + focus)
  'empty_state',  // 빈 상태 (illustration + CTA)
]);
export type ScreenArchetype = z.infer<typeof ScreenArchetype>;

export const ExemplarMeta = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),                // exemplar slug
  sprint_id: z.string(),                                // 출처 sprint
  task_id: z.string(),                                  // 출처 task
  screen_name: z.string(),
  archetype: ScreenArchetype,
  why_curated: z.string().min(20).max(280),             // 한 줄 큐레이션 사유
  prototype_path: z.string(),                           // sprint-gallery 기준 상대경로
  screenshot_path: z.string(),                          // 썸네일 (capture-screenshots 산출)
  design_dimensions: z.array(z.enum([
    'token_compliance',
    'asset_fidelity',
    'motion',
    'archetype_fit',
    'interaction_completeness',
    'empty_state_handling',
  ])).min(1),
  added_by: z.string(),                                 // 큐레이터 (사용자 핸들)
  added_at: z.string(),                                 // ISO8601
  last_validated_at: z.string(),                        // ISO8601
  validation_status: z.enum(['valid', 'stale', 'invalid']),
  notes: z.string().optional(),
});
export type ExemplarMeta = z.infer<typeof ExemplarMeta>;

export const ExemplarIndex = z.object({
  schema_version: z.literal('1.0'),
  generated_at: z.string(),
  exemplars: z.array(ExemplarMeta),
});
export type ExemplarIndex = z.infer<typeof ExemplarIndex>;
```

- [ ] **Step 2: 빈 인덱스 파일 생성**

`sprint-gallery/exemplars/_index.json`:

```json
{
  "schema_version": "1.0",
  "generated_at": "2026-04-25T00:00:00Z",
  "exemplars": []
}
```

- [ ] **Step 3: README 작성**

`sprint-gallery/exemplars/README.md`:

```markdown
# Exemplar Showcases

큐레이션된 gold-standard 프로토타입. 다음 sprint 의 Design Engineer가 Frozen Snapshot 단계에서 archetype 매칭으로 자동 참조한다.

## 큐레이션 자격 (모두 충족 시 등록 가능)

1. Pass 6 Anti-Slop Audit 7/7 통과 (`anti_slop_audit: passed`)
2. verify-prototype 통과 (`status: pass`, clickErrors 0)
3. 사용자 또는 Sprint Lead 의 명시적 승인
4. archetype 분류 동의 (DE 가 어떤 화면 유형의 좋은 예로 참조할지)

## 참조 룰 (DE 측)

- exemplar는 **참조 자료** — 모방/복제 금지
- 동일 archetype 의 exemplar 가 등록된 경우 DE Frozen Snapshot 에 top-2 가 자동 인라인
- DE 는 exemplar 의 **구조적 패턴** (레이아웃, interaction, 상태 표현) 만 참고. 콘텐츠 텍스트/이미지는 절대 복사 금지

## Validation 주기

- `pnpm gallery:exemplar:validate` — 모든 exemplar 의 verify-prototype 재실행
- `validation_status: stale` (마지막 검증 30일 초과) → 자동 표시, 다음 build 에서 lookup 제외
- `validation_status: invalid` → exemplar 자동 비활성화, 큐레이터에게 갱신 요청
```

- [ ] **Step 4: Commit**

```bash
git add sprint-gallery/src/lib/exemplars/schema.ts sprint-gallery/exemplars/_index.json sprint-gallery/exemplars/README.md
git commit -m "feat(gallery): add exemplar schema + empty index

Zod schema for curated prototype showcases (ScreenArchetype enum +
ExemplarMeta). Empty _index.json + README documenting eligibility
(Pass 6 + verify-prototype + manual approval) and DE reference rules
(structural reference only, no content/image copy)."
```

---

## Phase 2 — Curation CLIs + Tests

`exemplar-add` / `validate` / `lookup` 3개 CLI + vitest.

### Task 2.1: `exemplar-add` CLI

**Files:**
- Create: `sprint-gallery/scripts/exemplar-add.ts`

- [ ] **Step 1: CLI 작성**

`pnpm gallery:exemplar:add --sprint=<id> --task=<id> --screen=<name> --archetype=<enum> --reason="..." --dimensions=token_compliance,motion`

핵심 로직:
1. CLI args 파싱
2. prototype.html 파일 존재 확인
3. quality-report.yaml 읽어서 `anti_slop_audit: passed` 확인 — 실패 시 STOP
4. screenshot 자동 capture 트리거 (`capture-screenshots --target=<path>`) 또는 기존 screenshot 경로 확인
5. 신규 ExemplarMeta 객체 생성 + Zod 검증
6. `_index.json` 에 append + write
7. 콘솔에 "Added exemplar {id}" 출력

- [ ] **Step 2: 단위 테스트 생성**

`sprint-gallery/tests/exemplars.test.ts` 의 `exemplar-add` 부분:
- valid input → 인덱스에 1개 추가됨
- invalid archetype → Zod 에러
- prototype.html 없음 → "file not found" 에러

- [ ] **Step 3: 테스트 실행**

Run: `cd sprint-gallery && pnpm vitest run tests/exemplars.test.ts`
Expected: 3개 PASS.

- [ ] **Step 4: Commit**

```bash
git add sprint-gallery/scripts/exemplar-add.ts sprint-gallery/tests/exemplars.test.ts
git commit -m "feat(gallery): add exemplar:add CLI + tests

CLI registers a passing prototype as exemplar. Validates anti-slop
audit + verify-prototype precondition, captures screenshot if missing,
appends to _index.json with Zod validation."
```

### Task 2.2: `exemplar-validate` CLI

**Files:**
- Create: `sprint-gallery/scripts/exemplar-validate.ts`

- [ ] **Step 1: CLI 작성**

`pnpm gallery:exemplar:validate [--id=<exemplar-id>]`

로직:
1. `_index.json` 의 모든 exemplar 순회 (또는 `--id` 지정 시 단일)
2. 각각:
   - `verifyPrototype(prototype_path)` 재실행
   - `pass` → `validation_status: valid`, `last_validated_at` 갱신
   - `fail` → `validation_status: invalid`, 콘솔 경고
3. `last_validated_at` 가 30일 초과인 경우 `validation_status: stale` 자동 마킹
4. 갱신된 인덱스 저장
5. 종료 코드: invalid 1개 이상이면 1, 아니면 0

- [ ] **Step 2: build 체인 통합**

`sprint-gallery/package.json` scripts 에 추가:
```json
"gallery:exemplar:validate": "tsx scripts/exemplar-validate.ts",
```

`build` 체인에 `verify:prototypes` 직후 삽입:
```
"... && pnpm run verify:prototypes && pnpm run gallery:exemplar:validate && pnpm run capture:screenshots ..."
```

- [ ] **Step 3: 테스트 추가**

`tests/exemplars.test.ts` 에:
- valid exemplar → status valid
- broken exemplar → status invalid + 종료 코드 1
- stale 자동 마킹

- [ ] **Step 4: Commit**

```bash
git add sprint-gallery/scripts/exemplar-validate.ts sprint-gallery/package.json sprint-gallery/tests/exemplars.test.ts
git commit -m "feat(gallery): add exemplar:validate CLI + build wiring

Re-runs verify-prototype on every exemplar, marks invalid (verifier
fail) or stale (>30d). Wired into build chain after verify:prototypes
so broken exemplars block gallery publish."
```

### Task 2.3: `exemplar-lookup` CLI (DE 측에서 호출)

**Files:**
- Create: `sprint-gallery/scripts/exemplar-lookup.ts`

- [ ] **Step 1: CLI 작성**

`pnpm gallery:exemplar:lookup --archetype=<enum> [--limit=2] [--keywords="..."] [--exclude-sprint=<id>] --format=json|md`

로직:
1. `_index.json` 로드
2. 필터: `archetype` 일치 + `validation_status: valid` 만
3. `--exclude-sprint` 매치 제거 (자기 sprint 의 exemplar 자기 참조 방지)
4. `--keywords` 가 `notes` 또는 `why_curated` 에 매치되면 우선순위 boost
5. top-N (기본 2) 반환:
   - `--format=json`: ExemplarMeta JSON 배열
   - `--format=md`: DE 가 인라인할 마크다운 블록 (id, why_curated, prototype_path, screenshot_path)

stdout 출력 — DE 가 capture 해서 사용.

- [ ] **Step 2: 테스트 추가**

`tests/exemplars.test.ts` 에:
- archetype 매치 → 결과 포함
- exclude-sprint → 자기 sprint 제외
- limit 적용

- [ ] **Step 3: Commit**

```bash
git add sprint-gallery/scripts/exemplar-lookup.ts sprint-gallery/tests/exemplars.test.ts
git commit -m "feat(gallery): add exemplar:lookup CLI

Returns top-N matching exemplars by archetype + keyword. Used by DE
during Frozen Snapshot assembly to inline structural references.
Excludes self-sprint to prevent reflexive copy."
```

---

## Phase 3 — Sprint Pipeline 통합

DE 가 lookup 결과를 Frozen Snapshot 에 받아 Step C 생성 시 참조.

### Task 3.1: phase-prototype.md §3.2 Step 1 에 lookup 단계 추가

**Files:**
- Modify: `.claude/skills/sprint/phase-prototype.md`

- [ ] **Step 1: 앵커 확인**

Run: `grep -n "Step 1: Frozen Snapshot 조립" .claude/skills/sprint/phase-prototype.md`
Expected: 한 줄 매치.

- [ ] **Step 2: Snapshot 조립 목록에 5번째 항목 추가**

PR #29 의 Phase 4 에서 추가된 4번째 항목 (`zzem-kb:read type=asset`) 직후에 5번째 추가:

```markdown
5. `pnpm --silent --filter sprint-gallery exemplar:lookup --archetype={task의 screen_archetype} --exclude-sprint={현재 sprint-id} --limit=2 --format=md`
   → 동일 archetype 의 valid exemplar top-2 반환 (마크다운 형식)
   → Snapshot 의 `## Exemplar References` 섹션에 인라인
   → 결과 0개면 (해당 archetype 첫 사례) — 섹션 생략, 로그에 `exemplars_none` 기록
```

- [ ] **Step 3: TaskCreate Description 에 exemplar 사용 룰 명시**

§3.2 Step 2 TaskCreate Description 에 추가:

```
    Exemplar 참조 룰: 인라인된 ## Exemplar References 는 구조적 패턴만 참고.
    - 콘텐츠 텍스트/이미지 절대 복사 금지
    - exemplar 의 prototype_path 를 직접 읽지 않는다 (인라인된 메타데이터만 사용)
    - 본 화면이 exemplar 와 너무 유사해지면 DE 는 self-flag → quality-report 에 `exemplar_drift_warning: true`
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sprint/phase-prototype.md
git commit -m "feat(phase-prototype): inline exemplars into Frozen Snapshot

Snapshot Step 1 adds 5th input (exemplar:lookup CLI by archetype).
TaskCreate Description carries no-copy / no-direct-read / drift-flag
rules for DE."
```

### Task 3.2: design-engineer.md Step A.2 + Step C 에서 exemplar 처리

**Files:**
- Modify: `.claude/teammates/design-engineer.md`

- [ ] **Step 1: A.2 Context Engine 조립에 exemplars 입력 처리 룰 추가**

`### A.2 Context Engine 조립 프로세스` 섹션 끝에 다음 추가:

```markdown
**Exemplars 입력 처리 (조건부)**:

Snapshot 에 `## Exemplar References` 가 인라인된 경우:
- 각 exemplar 의 `screenshot_path` 만 시각 참조 — `prototype_path` 직접 읽지 않음 (구조 모방 방지)
- `why_curated` 를 읽고 어떤 차원 (token_compliance / motion / archetype_fit 등) 의 모범인지 파악
- Context Engine `meta` 에 다음 추가:
  ```yaml
  exemplar_refs:
    - id: "{exemplar-id}"
      dimension_focus: "{어떤 차원을 참조하는가}"
  ```
- exemplars 가 없으면 (`exemplars_none` 로깅) 본 항목 생략
```

- [ ] **Step 2: Step C 끝에 drift 자가 점검 룰 추가**

`### C.2.1 Pass 6 Anti-Slop Self-Audit` 표 8번째 행 추가 (또는 별 후속 단락):

```markdown
| 8 | Exemplar 참조가 있고, 본 prototype 의 핵심 레이아웃이 exemplar 와 80% 이상 일치하는가 (시각 비교) | `quality_report.exemplar_drift_warning: true` 기록 + Sprint Lead 보고 — 변형 또는 별 archetype 으로 재분류 검토 |
```

- [ ] **Step 3: Activity Logging 표에 exemplar_drift 행 추가**

`## Activity Logging` 표에 추가:

```markdown
| C. Exemplar drift 감지 | `exemplar_drift_warning` | "Exemplar {id} 와 80%+ 일치 — 차별화 검토 필요" |
```

- [ ] **Step 4: 정합성 검증**

Run: `grep -c "exemplar_drift\|exemplar_refs\|Exemplar References" .claude/teammates/design-engineer.md`
Expected: 4 이상.

- [ ] **Step 5: Commit**

```bash
git add .claude/teammates/design-engineer.md
git commit -m "docs(de): add exemplar reference handling protocol

Step A.2 records exemplar_refs in Context Engine meta with
dimension_focus. Pass 6 audit gains 8th check (drift warning when
output >80% structurally matches an exemplar)."
```

---

## Post-Plan Verification

- [ ] **Step 1: 빈 컬렉션 빌드 통과 확인**

Run: `cd sprint-gallery && pnpm build`
Expected: exemplar:validate 가 빈 인덱스에서 통과 (0개 검증, exit 0).

- [ ] **Step 2: 첫 exemplar 등록 dry-run**

Run: `cd sprint-gallery && pnpm gallery:exemplar:add --sprint=ugc-platform-002 --task=app-001 --screen=Home --archetype=feed --reason="가장 안정적으로 통과한 feed 프로토타입 — 토큰 100% / verify pass" --dimensions=token_compliance,archetype_fit --added-by=zach@wrtn.io`
Expected: `_index.json` 에 1개 entry 추가, anti-slop audit precondition 확인 메시지.

> **주의**: 본 dry-run 은 본 plan 실행 직후 별도 PR 에서 수행 — 이 plan 의 commit 에는 포함하지 않음.

- [ ] **Step 3: lookup 출력 형식 sanity**

Run: `cd sprint-gallery && pnpm gallery:exemplar:lookup --archetype=feed --format=md`
Expected: 마크다운 블록 출력 — DE 가 그대로 인라인 가능한 형태.

---

## Open Questions

- [ ] **초기 컬렉션 부트스트랩**: 본 plan 머지 후 누가 어떤 기준으로 초기 5-10개를 큐레이션? Phase 4 로 별 PR 추가 권장 — 사용자가 직접 후보를 지명하거나, ugc-platform-001~003 + free-tab 의 통과 prototype 중에서 자동 후보 추천.
- [ ] **Drift 80% 기준의 측정 방식**: DE 가 self-judge 하는 정성적 기준 — 이후 객관적 메트릭 (DOM diff %, CSS rule overlap) 로 대체 검토.
- [ ] **Cargo-cult 위험**: exemplar 가 너무 강한 영향력 — 반대로 exemplar 와 정반대 산출이 더 좋은 경우. `--anti-exemplar` 옵션 (피해야 할 패턴 인라인) 추가 검토.
