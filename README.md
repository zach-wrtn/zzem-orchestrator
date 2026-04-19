# ZZEM Orchestrator

ZZEM 앱의 에이전틱 스프린트 오케스트레이션 시스템.

PRD → Task Spec → HTML Prototype → Code → Evaluation → PR 파이프라인을 Claude Code Agent Teams로 자동화한다.

## Sprint Gallery

Historical, browsable view of every sprint's prototypes:
**https://zach-wrtn.github.io/zzem-orchestrator/**

Source: `sprint-gallery/`. The gallery auto-rebuilds on every merge to `main`
when `sprint-orchestrator/sprints/**` or `sprint-gallery/**` changes.

To add a new sprint to the gallery, populate the optional `display:` block
in the sprint's `sprint-config.yaml` (see `sprint-orchestrator/templates/sprint-config-template.yaml`).

## Architecture

```
orchestrator/                          ← 오케스트레이션 레이어
├── sprint-orchestrator/               ← 스프린트 관리 (templates, sprints, knowledge-base)
├── docs/prds/                         ← PRD 원본
├── {role1}/             [worktree]    ← 역할별 소스 레포 (config로 정의)
├── {role2}/             [worktree]    ← 예: backend/, app/, tokens/
└── ...
```

### Repositories

각 스프린트의 `sprint-config.yaml`에서 `repositories` 블록으로 정의한다. 기본 제공 예시
(`sprint-orchestrator/templates/sprint-config-template.yaml`):

| Role key | Source | Mode | 용도 |
|---------|--------|------|------|
| `backend` | 프로젝트별 설정 | `worktree` | 백엔드 API 구현 |
| `app` | 프로젝트별 설정 | `worktree` | 프론트엔드/앱 구현 |
| `tokens` | 프로젝트별 설정 | `symlink` | 디자인 토큰 (읽기 전용) |

> Role key가 디렉토리 이름이자 태스크 경로(`tasks/{role}/...`). `scripts/setup-sprint.sh`가
> `git worktree`로 격리된 체크아웃을 만든다 — 사용자의 main 체크아웃 HEAD는 건드리지 않는다.

## Quick Start

```bash
# 1. Clone
git clone <repo-url>

# 2. 스프린트 config 작성 (templates/sprint-config-template.yaml 복사)
cp sprint-orchestrator/templates/sprint-config-template.yaml \
   sprint-orchestrator/sprints/my-sprint-001/sprint-config.yaml

# 3. 역할별 worktree/symlink 생성
./scripts/setup-sprint.sh --config sprint-orchestrator/sprints/my-sprint-001/sprint-config.yaml

# 4. Agent Teams 환경변수 설정
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 5. 스프린트 실행
/sprint my-sprint-001
```

## Sprint Commands

```bash
/sprint <sprint-id>                          # 전체 파이프라인 (Phase 1~6)
/sprint <sprint-id> --phase=init             # Phase 1: 디렉토리 초기화
/sprint <sprint-id> --phase=spec             # Phase 2: 태스크 분해 + API Contract
/sprint <sprint-id> --phase=prototype        # Phase 3: HTML 프로토타입
/sprint <sprint-id> --phase=build            # Phase 4: 구현 + 평가 루프
/sprint <sprint-id> --phase=pr               # Phase 5: PR 생성
/sprint <sprint-id> --phase=retro            # Phase 6: 회고
/sprint <sprint-id> --status                 # 대시보드
/sprint <sprint-id> --continue               # 미충족 항목 이어서 진행
/sprint <sprint-id> --follow-up=<prev-id>    # 후속 스프린트
```

## Monitoring

```bash
# 별도 터미널에서 실시간 대시보드
./scripts/sprint-monitor.sh <sprint-id>

# Phase 전환 시 자동으로 status 출력됨 (별도 설정 불필요)
```

## Directory Layout

```
sprint-orchestrator/
├── templates/                           # 스프린트 템플릿
│   ├── sprint-config-template.yaml      # 팀 + 브랜치 설정
│   ├── prd-template.md                  # PRD 작성 가이드
│   ├── prd-amendment-template.md        # 프로토타입 기반 PRD 개정안
│   ├── screen-spec-template.md          # 화면 명세 (machine-readable)
│   ├── sprint-contract-template.md      # Generator-Evaluator 합의서
│   ├── evaluation-criteria.md           # 평가 기준 프레임워크
│   └── html-prototype-template.html     # 프로토타입 HTML 셸
│
└── sprints/{sprint-id}/                 # 스프린트 인스턴스
    ├── PRD.md                           # 스프린트 PRD
    ├── sprint-config.yaml               # 팀 + 브랜치 설정
    ├── tasks/
    │   ├── app/001-xxx.md               # 프론트엔드 태스크
    │   └── backend/001-xxx.md           # 백엔드 태스크
    ├── contracts/group-{N}.md           # Sprint Contract (per group)
    ├── evaluations/group-{N}.md         # Evaluator 보고서
    ├── prototypes/app/{task-id}/        # HTML 프로토타입 + 스크린샷
    ├── checkpoints/                     # Phase/Group 전환 시 요약
    ├── retrospective/                   # Phase 6 산출물
    │   ├── gap-analysis.yaml
    │   ├── pattern-digest.yaml
    │   └── deferred-items.yaml
    ├── REPORT.md                        # 최종 스프린트 리포트
    └── logs/*.jsonl                     # 에이전트 활동 로그
```

## Related Skills

| Skill | 설명 |
|-------|------|
| `/sprint` | 스프린트 오케스트레이션 (이 시스템의 메인 스킬) |
| `/meme-api-gen` | MemeApp API Clean Architecture 코드 자동 생성 |
| `/meme-pr-create` | MemeApp PR 생성 (과일환경 추출 + CodePush 분석) |
| `/qa-pattern-check` | QA 버그 패턴 자동 검증 (폴링 무한루프, Zod nullable) |
| `/extract-design` | 코드베이스에서 DESIGN.md 역추출 |

## Hermes-Inspired Enhancements

> Ref: [nousresearch/hermes-agent](https://github.com/nousresearch/hermes-agent) 패턴 적용

| 패턴 | 적용 위치 | 효과 |
|------|----------|------|
| **Budget Pressure Injection** | Phase 4 Build Loop | 컨텍스트 소진 전 동적 스티어링 (Normal → Caution → Urgent) |
| **Frozen Snapshot Caching** | Phase 3 + Teammate 스폰 | 참조 파일 1회 로드 후 인라인 제공, 반복 Read 제거 |
| **Self-Improving Skill Nudge** | Phase 6 Retro → KB Write | 패턴 자동 누적, 다음 스프린트 Contract에 자동 주입 |
| **PTC-Style 2-Phase Generation** | Design Engineer HTML 생성 | 6-pass → 2-phase (tool calls 12→4, 67% 절감) |
| **Cross-Session Knowledge Base** | Standalone repo [zach-wrtn/knowledge-base](https://github.com/zach-wrtn/knowledge-base) via `zzem-kb:*` skills | 스프린트 간 패턴 검색/누적 (learning/ axis) + 제품 스펙 (products/ axis) |
