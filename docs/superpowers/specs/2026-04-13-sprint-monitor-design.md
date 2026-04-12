# Sprint Monitor Design

## Problem

현재 스프린트 모니터링의 두 가지 문제:

1. **에이전트 활동 로깅이 수동** — teammate가 JSONL에 직접 기록해야 하므로 누락 가능
2. **--status가 수동 호출** — 진행 상태를 보려면 별도로 `--status`를 실행하거나 `/loop`을 설정해야 함

## Solution

Claude Code Hook 기반 자동 이벤트 수집 + 터미널 실시간 대시보드 + Phase 전환 시 자동 status 출력.

## Architecture

### 두 계층 로깅

| 계층 | 소스 | 파일 | 용도 |
|------|------|------|------|
| **이벤트 레이어** (신규) | Hook 자동 수집 | `logs/events.jsonl` | teammate 생성/종료, task 할당/완료 |
| **페이즈 레이어** (기존) | 에이전트 수동 기록 | `logs/{agent}.jsonl` | 구현 단계 상세 (implementing, build_check 등) |

Hook이 에이전트 수동 로깅을 **보완**한다. 수동 로깅을 제거하지 않는 이유: Hook으로는 "ProfileService CRUD 구현 중" 같은 도메인 맥락을 캡처할 수 없다.

### 데이터 흐름

```
Claude Code Runtime (Sprint Session)
  │
  ├─ SubagentStart   ──→ hook-handler.sh ──→ logs/events.jsonl
  ├─ SubagentStop    ──→ hook-handler.sh ──→ logs/events.jsonl
  ├─ TaskCreated     ──→ hook-handler.sh ──→ logs/events.jsonl
  ├─ TaskCompleted   ──→ hook-handler.sh ──→ logs/events.jsonl
  │
  └─ 에이전트 수동 로깅 (기존)
       ├─ logs/be-engineer.jsonl
       ├─ logs/fe-engineer.jsonl
       ├─ logs/design-engineer.jsonl
       └─ logs/evaluator.jsonl

sprint-monitor.sh (별도 터미널)
  └─ 2초 간격으로 모든 JSONL 파싱 → 대시보드 렌더링
```

## Detailed Design

### 1. hook-handler.sh

**파일:** `scripts/hook-handler.sh`

Hook은 stdin으로 JSON을 받는다. 스크립트가 이벤트를 파싱하여 활성 스프린트의 `logs/events.jsonl`에 기록한다.

**활성 스프린트 탐지:**
- `sprint-orchestrator/sprints/` 하위 디렉토리를 역순 탐색
- `sprint-config.yaml`이 있고 `retrospective/REPORT.md`가 없는 첫 디렉토리를 활성 스프린트로 판별
- 활성 스프린트가 없으면 exit 0 (이벤트 무시)

**캡처 대상 이벤트:**

| Hook Event | 기록 필드 | 용도 |
|------------|----------|------|
| `SubagentStart` | agent_id, agent_type | teammate 활성화 시점 |
| `SubagentStop` | agent_id, agent_type | teammate 종료 시점 |
| `TaskCreated` | task_id, task_subject, teammate_name | 태스크 할당 추적 |
| `TaskCompleted` | task_id, task_subject, teammate_name | 태스크 완료 추적 |

**events.jsonl 스키마:**

```jsonl
{"ts":"2026-04-13T14:30:00+09:00","event":"subagent_start","agent_id":"abc123","agent_type":"be-engineer"}
{"ts":"2026-04-13T14:30:05+09:00","event":"task_created","task_id":"1","subject":"impl/backend/001","teammate":"be-engineer"}
{"ts":"2026-04-13T14:35:00+09:00","event":"task_completed","task_id":"1","subject":"impl/backend/001","teammate":"be-engineer"}
{"ts":"2026-04-13T14:35:01+09:00","event":"subagent_stop","agent_id":"abc123","agent_type":"be-engineer"}
```

**제약사항:**
- `PreToolUse`/`PostToolUse`는 캡처하지 않음 — teammate 식별 불가하므로 노이즈만 발생
- Hook timeout 3초 이내로 처리 (jq 파싱 + echo append)
- exit 0으로 항상 성공 반환 (Hook 실패가 스프린트를 차단하면 안 됨)

### 2. sprint-monitor.sh (터미널 대시보드)

**파일:** `scripts/sprint-monitor.sh`

```bash
./scripts/sprint-monitor.sh {sprint-id}
```

별도 터미널에서 실행하면 2초 간격으로 화면을 갱신하여 대시보드를 표시한다.

**데이터 소스 우선순위:**
1. `logs/events.jsonl` — teammate 활성/비활성 (Hook 자동, 가장 신뢰)
2. `logs/{agent}.jsonl` — 상세 phase 상태 (에이전트 수동, 도메인 맥락)
3. `contracts/` — 그룹 계약 상태
4. `evaluations/` — 그룹 평가 상태
5. `checkpoints/` — Phase 완료 상태

**Agent Status 결정 로직:**

```
1. events.jsonl에서 해당 agent의 마지막 이벤트 확인
   - subagent_start 후 subagent_stop 없음 → ACTIVE
   - subagent_stop 있음 → IDLE
   - 이벤트 없음 → NOT STARTED

2. ACTIVE인 경우, {agent}.jsonl의 마지막 줄로 상세 phase 확인
   - implementing → "ACTIVE: {message}"
   - build_check → "BUILDING"
   - build_failed → "BUILD FAIL"
   - 등 (기존 매핑 유지)

3. 둘 다 없으면 → IDLE
```

**출력 포맷:** 기존 --status 대시보드와 동일 (phase-modes.md 246-290행 참조). 추가 섹션:

```
  ─── Event Log (recent 5) ──────────────────────
  14:35:01  be-engineer   subagent_stop     impl/backend/001 완료
  14:35:00  be-engineer   task_completed    impl/backend/001
  14:30:05  be-engineer   task_created      impl/backend/001
  14:30:00  be-engineer   subagent_start    —
  14:29:55  fe-engineer   subagent_start    —
```

**종료:** `Ctrl+C`로 종료. 스프린트 세션과 독립적으로 동작.

**의존성:** bash, jq (macOS에서 `brew install jq`로 설치).

### 3. Phase 전환 시 자동 status 출력

**변경 대상:** 각 Phase 파일의 Gate 섹션

모든 Phase Gate 통과 시, 다음 Phase 진입 전에 status 대시보드를 출력한다.

**적용 지점:**

| 파일 | 위치 | 시점 |
|------|------|------|
| `phase-init.md` | Gate → Phase 2 (line 26) | Init 완료 후 |
| `phase-spec.md` | Gate → Phase 3 (line 33) | Spec 완료 후 |
| `phase-prototype.md` | Gate → Phase 4 (line 405) | Prototype 완료 후 |
| `phase-build.md` | Group 완료 시 (4.5 Fix/Accept 후) | 각 Group 완료 후 |
| `phase-build.md` | Gate → Phase 5 (line 351) | Build 전체 완료 후 |
| `phase-pr.md` | Gate → Phase 6 (line 53) | PR 생성 후 |

**추가할 규칙:**

```markdown
## Gate 통과 시 행동

1. Checkpoint 파일 생성 (기존)
2. **Sprint Status 출력** — `--status` 대시보드를 출력하여 현재 진행 상태를 표시한다.
3. 다음 Phase 진입
```

**Build Phase Group 완료 시:**

```markdown
## Group 완료 시 행동

1. Group summary checkpoint 생성 (기존)
2. **Sprint Status 출력** — 그룹 진행률, 에이전트 상태, 병목 감지를 표시한다.
3. 다음 Group 진입 또는 Phase 5 전환
```

### 4. Hook 등록

**파일:** `.claude/settings.local.json`

프로젝트 레벨 설정에 4개 Hook을 추가한다. 기존 `env`, `permissions` 필드는 유지하고 `hooks` 필드만 추가한다. 글로벌 설정(`~/.claude/settings.json`)의 기존 Hook과 충돌하지 않는다 (프로젝트 레벨 Hook은 글로벌 Hook과 독립 실행).

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/hook-handler.sh",
            "timeout": 3
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/hook-handler.sh",
            "timeout": 3
          }
        ]
      }
    ],
    "TaskCreated": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/hook-handler.sh",
            "timeout": 3
          }
        ]
      }
    ],
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/hook-handler.sh",
            "timeout": 3
          }
        ]
      }
    ]
  }
}
```

## Scope

### 변경 대상

| 파일 | Action | 설명 |
|------|--------|------|
| `scripts/hook-handler.sh` | 신규 | Hook 이벤트 → events.jsonl 기록 |
| `scripts/sprint-monitor.sh` | 신규 | 터미널 대시보드 (2초 갱신) |
| `.claude/settings.local.json` | 수정 | 4개 Hook 등록 |
| `.claude/skills/sprint/phase-init.md` | 수정 | Gate에 status 출력 규칙 추가 |
| `.claude/skills/sprint/phase-spec.md` | 수정 | Gate에 status 출력 규칙 추가 |
| `.claude/skills/sprint/phase-prototype.md` | 수정 | Gate에 status 출력 규칙 추가 |
| `.claude/skills/sprint/phase-build.md` | 수정 | Group 완료 + Gate에 status 출력 규칙 추가 |
| `.claude/skills/sprint/phase-pr.md` | 수정 | Gate에 status 출력 규칙 추가 |
| `.claude/skills/sprint/phase-modes.md` | 수정 | --status를 Phase 전환 시 자동 호출로 변경 문서화 |

### 변경하지 않는 것

- 기존 에이전트 수동 JSONL 로깅 프로토콜 (teammate/*.md)
- --status 출력 포맷 (phase-modes.md 246-290행)
- 병목 감지 규칙 (phase-modes.md 293-301행)

## Verification

1. Hook 동작 확인: Claude Code 세션에서 Agent 디스패치 → `events.jsonl`에 이벤트 기록 확인
2. sprint-monitor.sh 동작 확인: 별도 터미널에서 실행 → 대시보드 렌더링 확인
3. Phase 전환 자동 출력 확인: 스프린트 실행 중 Phase gate 통과 시 status 출력 확인
