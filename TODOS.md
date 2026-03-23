# TODOS

## Parallel Execution: Shared Lib Conflict Prevention
**Priority:** Medium
**Added:** 2026-03-20

**What:** 병렬 실행 시 각 에이전트를 별도 git branch에서 실행하고 후속 merge하는 전략 구현

**Why:** run-parallel.sh에서 tmux로 backend/app 에이전트를 동시 실행할 때, 두 에이전트가 wrtn-backend/libs/ 같은 shared lib를 동시 수정하면 git conflict로 실패함

**Pros:** race condition 완전 제거, 병렬 실행 안정성 확보
**Cons:** merge 단계 추가 복잡도, conflict 발생 시 수동 해결 필요

**Context:** 현재 run-parallel.sh는 같은 working directory에서 두 에이전트를 동시 실행. wrtn-backend의 경우 apps/meme-api/와 libs/가 모두 같은 git repo 내에 있어 동시 수정 가능. 해결 방안: 각 에이전트를 git worktree로 분리하거나, 별도 branch에서 작업 후 자동 merge.

**Depends on:** run-parallel.sh 구현, common.sh 완성

## Investigate create-plan/execute-plan Skill Overlap
**Priority:** Low
**Added:** 2026-03-20

**What:** app-core-packages/.claude/skills/create-plan과 execute-plan이 Orchestrator의 태스크 분해/실행과 기능이 겹치는지 조사하고, 겹치면 통합 방안 마련

**Why:** 두 시스템이 겹치면 에이전트가 어떤 워크플로우를 따를지 혼란. MemeApp 에이전트가 Orchestrator 태스크와 기존 plan 스킬을 동시에 볼 수 있음

**Pros:** 단일 태스크 시스템으로 통합하면 유지보수 간소화, 에이전트 혼란 방지
**Cons:** 조사 시간 필요, 기존 스킬이 다른 앱에서도 쓰이고 있을 수 있음

**Context:** app-core-packages에는 이미 12개의 claude skills가 있고, create-plan/execute-plan이 태스크 생성/실행 역할을 할 수 있음. Orchestrator가 별도로 태스크를 생성하면 이중 시스템이 될 수 있음

**Depends on:** 없음 (독립 조사 가능)

## Integration QA Automation
**Priority:** P2
**Added:** 2026-03-20

**What:** meme-api 로컬 서버 실행 + MemeApp에서 실제 API 호출 통합 테스트 자동화

**Why:** api-contract.yaml 기반 contract 검증만으로는 실제 동작 보장 불가. 서버 실행 + 실제 API 호출로 end-to-end 신뢰성 확보 필요

**Pros:** End-to-end 신뢰성 확보, 스프린트 결과물의 실제 동작 검증
**Cons:** 로컬 서버 설정 복잡도 (DB, env 등), 테스트 환경 유지보수

**Context:** 현재 Lightweight 파이프라인은 contract 검증(OpenAPI lint)까지만 자동화. 실제 meme-api 서버를 띄우고 MemeApp의 API 호출을 검증하는 integration test는 별도 구현 필요. wrtn-backend에는 `nx run meme-api:serve` 명령이 있음.

**Effort:** L (human) → M (CC)
**Depends on:** Lightweight 파이프라인 검증 완료

## Approach C Migration (Shell → Claude Code Agent)
**Priority:** P3
**Added:** 2026-03-20

**What:** Lightweight(B) 검증 후 셸 스크립트 기반에서 Claude Code Agent tool 기반(C)으로 전환 검토

**Why:** Claude Code Agent tool이 worktree isolation, 컨텍스트 공유, 에러 처리를 네이티브로 제공하여 셸 스크립트 유지보수를 제거할 수 있음

**Pros:** 셸 스크립트 인프라 불필요, worktree isolation 네이티브 지원, 에이전트 간 컨텍스트 공유 자연스러움
**Cons:** Claude Code API 의존성, 디버깅이 셸 스크립트보다 어려울 수 있음

**Context:** 현재 Approach B는 bash 스크립트(common.sh, run-task.sh 등)로 구현. Claude Code의 Agent tool은 `isolation: "worktree"` 옵션으로 독립 작업 환경을 제공하며, 서브에이전트 스폰으로 병렬 실행도 가능.

**Effort:** M (human) → S (CC)
**Depends on:** Lightweight 2-3회 스프린트 실행 경험
