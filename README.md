# ZZEM Orchestrator

ZZEM 앱의 에이전틱 스프린트 오케스트레이션 시스템.

PRD → Task Spec → HTML Prototype → Code → Evaluation → PR 파이프라인을 Claude Code Agent Teams로 자동화한다.

## Architecture

```
zzem-orchestrator/                     ← 오케스트레이션 레이어
├── sprint-orchestrator/               ← 스프린트 관리 (templates, sprints, knowledge-base)
├── docs/prds/                         ← PRD 원본
├── app-core-packages/   [submodule]   ← React Native 프론트엔드
├── wrtn-backend/        [submodule]   ← NestJS 백엔드
└── wds-tokens/          [submodule]   ← Figma-synced 디자인 토큰
```

### Submodules

| Submodule | Repository | 역할 |
|-----------|-----------|------|
| `app-core-packages` | `github.com:wrtn-tech/app-core-packages` | Yarn/Lerna 모노레포. MemeApp 등 9개 앱 + 23개 패키지 |
| `wrtn-backend` | `github.wrtn.club:wrtn-tech/wrtn-backend` | pnpm/Nx 모노레포. meme-api 등 6개 NestJS 서비스 |
| `wds-tokens` | `github.wrtn.club:pepper/wds-tokens` | Token Studio JSON. primitive → semantic → component 3계층 |

## Quick Start

```bash
# 1. Clone with submodules
git clone --recurse-submodules <repo-url>

# 2. Agent Teams 환경변수 설정
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 3. 스프린트 실행
/sprint ugc-profile-nav-001
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
├── knowledge-base/                    # Cross-Session 패턴 저장소
│   ├── patterns/                      # Evaluator 발견 코드 패턴 (YAML)
│   │   ├── README.md                  # 패턴 인덱스 (검색용)
│   │   └── {category}-{NNN}.yaml     # 개별 패턴 파일
│   └── design/                        # Design Engineer 프로토타입 패턴
│       ├── README.md                  # 디자인 패턴 인덱스
│       └── {category}-{NNN}.yaml     # 개별 디자인 패턴 파일
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
| **Cross-Session Knowledge Base** | `knowledge-base/` 디렉토리 | 스프린트 간 패턴 검색/누적 (YAML 파일 기반) |
