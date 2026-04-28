---
title: recall:ask — Interactive Recall over Sprint Artifacts + KB
date: 2026-04-28
status: draft
owner: zach@wrtn.io
---

# recall:ask — Interactive Recall Skill

## Problem

스프린트 종료 후 다른 세션에서 "qa-2 에서 unblock toast 어떻게 끝났더라?", "왜 archetype 을 6→7 로 늘렸지?", "지금까지 nickname sort 손댄 sprint 다 알려줘" 같은 회상성·교차-스프린트 질의를 하고 싶을 때, 현재 ZZEM 에는 `zzem-kb:read` 가 있지만 path-기반 구조 질의에 한정되어 자연어 질의로 답변까지 받기에는 부적합하다. 사용자(Sprint Lead) 가 컨텍스트 0 상태에서 인터뷰처럼 묻고 답을 받을 수 있는 스킬이 필요하다.

## Scope

### v1 (in-scope)
- 자연어 입력으로 sprint 산출물 + KB 를 검색하여 답변 합성
- Interview 모드 (상태파일로 세션 유지, idle/명시 종료)
- 모호 시 후보 제시 → 사용자 확정 fallback
- ZZEM 내부 사용 + OSS 배포를 동시 고려한 config 레이어

### v2 이후 (out-of-scope, 명시적 보류)
- 앱 레포 코드 grep
- Jira 티켓 lookup (mcp__wrtn-mcp__jira_*)
- Git commit history 검색
- 의미적(semantic) 검색 — v1 은 lexical/substring
- Multi-sprint 동시 비교 답변

## Naming & Distribution

OSS 배포를 고려하여 ZZEM 색을 빼고 보편 단어로 명명한다.

- **Plugin name**: `recall`
- **v1 skill**: `recall:ask`
- **향후 확장 여지**: `recall:index`, `recall:export`, `recall:reset` (단일 멤버 v1 에선 `--reset` 플래그로 처리)
- **Skill 위치**: `plugins/recall/skills/ask/SKILL.md`
- **ZZEM 내부 통합**: `~/.zzem/kb/skills/` 와 동일한 심링크 메커니즘으로 `~/.claude/skills/recall/ask` 노출

## Invocation Surface

```
/recall:ask                  모드 진입. 인사 + 최근 sprint 3-5개 hint, 사용자 질문 대기
/recall:ask <자연어 질문>     진입과 동시에 Stage 1 실행
/recall:ask --reset          세션 종료 (상태파일 삭제)
/recall:ask --status         현재 활성 세션 메타 출력
```

후속 턴 처리:
- 같은 사용자가 다시 `/recall:ask <follow-up>` 호출 → 스킬은 상태파일을 보고 이어가는 것으로 판단, sprint focus 유지
- 마지막 턴 후 30 분 이내 → 같은 세션으로 처리
- 30 분 초과 → idle timeout, 다음 호출은 fresh 시작 (자동 reset)
- 7 일 초과 상태파일 → 자동 reset 후 새 세션

## State File

경로: `~/.recall/session.yaml`

스키마:
```yaml
active: true
started_at: 2026-04-28T14:32:11Z
last_turn_at: 2026-04-28T14:38:02Z
turn_count: 3
sprint_focus: ugc-platform-integration-qa-2  # 사용자 확정 시만, 미확정 시 null
topic_focus: "unblock toast"                 # 같은 주제 추적
last_sources:                                 # 직전 턴에 read 한 path — "그건 어디서 봤어?" 대응
  - sprint-orchestrator/sprints/ugc-platform-integration-qa-2/retrospective/main.md
  - ~/.zzem/kb/learning/reflections/2026-04-25-ugc-qa-2.md
recent_candidates:                            # Stage 1 에서 사용자에게 제시한 후보들
  - ugc-platform-integration-qa-2
  - ugc-platform-integration-qa
```

호출 시 절차:
1. 상태파일 read (없으면 active=false 로 간주)
2. `now - last_turn_at > 30min` 이면 active=false 처리 (자동 reset)
3. `--reset` 플래그면 파일 삭제
4. 그 외엔 active 세션 이어가기

## Retrieval — Two-Stage Hybrid

### Stage 1 — Discovery (cheap)

입력: 사용자 질문 + 상태파일.

Stage 1 의 두 트랙(sprint discovery + KB 매칭)은 **항상 병렬로 실행**된다. sprint-id 가 명시된 경우엔 sprint discovery 트랙만 건너뛴다.

```
[트랙 A] Sprint focus 결정
   a. 질문에 sprint-id 패턴 (sprints/ 하위 dir 명) 있으면 → 그것 사용, sprint discovery skip
   b. 상태파일에 sprint_focus 있으면 → 유지 (사용자가 "다른 sprint" 라고 안 했다면)
   c. 둘 다 없으면 → 후보 도출:
      - sprint-orchestrator/sprints/* 전체 dir 목록
      - 각 sprint 의 sprint-config.yaml (작음) read
      - retrospective/*.md 첫 30 줄만 read (헤더/요약)
      - 질문 키워드와 lexical/substring 매칭 점수 산정
      - 상위 3-5 후보 선출
   다중 후보면 → 사용자에게 되묻기 (모호 시 fallback)
      "다음 후보 중 어디부터 볼까요?
       1) ugc-platform-integration-qa-2 — 'unblock toast' retro 에 등장
       2) ugc-platform-003 — 비슷한 키워드..."
   단일 후보로 좁혀지면 → 상태파일 sprint_focus 저장 → Stage 2 진입

[트랙 B] KB 매칭 (항상 실행)
   - learning/reflections/*.md frontmatter (domain) + 본문 첫 N줄
   - learning/patterns/*.yaml name/tags/category
   - 토픽 매칭 상위 K (default 3) — Stage 2 에서 풀 read
   - domain enum 은 config 에 정의 (ZZEM default: ai-webtoon | free-tab | ugc-platform | infra)
```

### Stage 2 — Targeted retrieval (full)

```
확정된 sprint focus 의 다음 파일을 풀로 read:
  - PRD.md                    항상
  - retrospective/*.md        항상
  - evaluations/*.md          토픽 키워드 매칭되는 것
  - contracts/*.md            토픽이 API/data shape 관련일 때만
  - tasks/*.md                "어떤 task" 류 질문 시
  - prototypes/, logs/, checkpoints/ → 기본 skip (대용량). 사용자가 명시 요청 시만

KB 풀로 read:
  - reflections 상위 K (default 3)
  - patterns 상위 K (default 3)

Claude 가 위를 읽고 답변 합성.
last_sources 에 read 한 path 들 기록.
```

## Output Format (per turn)

```
<답변 본문>
사용자 질문에 대한 자연어 응답. 가능한 짧고 직접적.
파일 경로 인용 시 file_path:line 패턴 권장.

---
**Sources** (이번 턴 참조)
- sprint-orchestrator/sprints/ugc-platform-integration-qa-2/retrospective/main.md
- ~/.zzem/kb/learning/reflections/2026-04-25-ugc-qa-2.md

**관련 follow-up 제안** (선택, 1-3개)
- "이 결정의 KB pattern 도 보여줘"
- "같은 토픽 다룬 다른 sprint 도 있어?"
```

`Sources` 는 **항상** 노출 — 답변 검증 / hallucination 견제용. follow-up 은 자연스러울 때만.

## OSS Portability — Config Layer

스킬 본문에 ZZEM 경로를 박지 않는다. 환경변수 + 파일 우선순위:

```
1순위: $RECALL_CONFIG (yaml 경로 명시)
2순위: ./.recall.yaml (CWD)
3순위: ~/.recall.yaml (home)
없으면: 안전 default (./sprints/, ~/recall-kb/)
```

`.recall.yaml` 스키마:
```yaml
sources:
  sprints:
    path: ./sprint-orchestrator/sprints      # ZZEM 의 경우
    artifact_layout:
      always_read: [PRD.md, retrospective]
      conditional_read: [evaluations, contracts, tasks]
      skip_by_default: [prototypes, logs, checkpoints]
  kb:
    path: ~/.zzem/kb                          # ZZEM 의 경우
    layout: zzem-kb                           # adapter 이름 — 향후 다른 KB 형태 지원 시 분기
    domain_enum: [ai-webtoon, free-tab, ugc-platform, infra]  # KB reflections 의 domain 필드 값 후보
session:
  state_file: ~/.recall/session.yaml
  idle_timeout_minutes: 30
```

ZZEM 사용자는 `~/.recall.yaml` 한 번 만들면 끝. OSS 사용자는 자기 sprint/KB 경로 넣어서 동일 스킬 사용.

## Failure Modes & Safety

| 상황 | 처리 |
|---|---|
| No sprint match (후보 0) | "찾지 못했습니다. 전체 sprint 목록 보여드릴까요?" → list |
| 상태파일 손상/parse 실패 | 조용히 새 세션으로 시작, 손상 파일 `~/.recall/session.yaml.corrupt-<ts>` 로 백업 |
| Stage 1 개별 파일 read 실패 | skip + 한 줄 log, 절대 abort 하지 않음 |
| 상태파일 7 일 초과 | 자동 reset |
| `--status` 호출인데 active 세션 없음 | "활성 세션 없음" 안내 후 종료 |
| sprint dir 안 sprint-config.yaml 부재 | dir 명만으로 후보화, retrospective 만 읽어 처리 |
| KB 미동기화 (legacy `events.yaml` 등) | `zzem-kb:read` 동작 패턴 따라 deprecation 한 줄 노트만 출력하고 진행 |

## Verification (smoke)

설계 검증을 위한 시나리오:

1. **단일 sprint, 명시적 sprint-id**
   - 입력: `/recall:ask qa-2 의 unblock toast 어떻게 처리됐어?`
   - 기대: Stage 1 우회, qa-2 의 PRD/retrospective/evaluations(토픽 매칭) read, 답변 + Sources

2. **모호 질의 → 후보 제시**
   - 입력: `/recall:ask unblock toast`
   - 기대: 후보 2-3개 노출, 사용자 확정 대기

3. **이어가기**
   - 직전 턴 sprint_focus = qa-2. 사용자: `/recall:ask 그 결정 KB pattern 도 보여줘`
   - 기대: sprint_focus 유지, KB reflections/patterns 추가 read 후 답변

4. **Idle timeout**
   - 마지막 턴 31분 전. 사용자: `/recall:ask 003 의 nickname sort 어떻게 됐어?`
   - 기대: 자동 reset, fresh Stage 1, sprint_focus = ugc-platform-003

5. **No match**
   - 입력: `/recall:ask 이런 토픽 없을걸?`
   - 기대: 후보 0, 전체 sprint 목록 제시

6. **Status**
   - 입력: `/recall:ask --status`
   - 기대: active 세션 메타 (started_at, turn_count, sprint_focus, topic_focus, last_sources count)

7. **Reset**
   - 입력: `/recall:ask --reset`
   - 기대: 상태파일 삭제, 짧은 확인 메시지

## Open Questions (구현 단계로 이월)

- Stage 1 매칭 점수의 구체적 가중치 (제목 vs 본문, 최근성 가중치 등) — 구현 단계에서 휴리스틱 한 페이지로 정리
- KB sync 선행 여부의 자동 감지 vs 사용자 안내 — 일단은 안내 라인만 노출하고 강제 안 함
- `--reset` 의 confirm 여부 — v1 은 즉시 삭제 (위험 낮음)

## Acceptance Criteria

- [ ] `recall:ask` 스킬 1 개로 위 7 개 verification 시나리오 모두 합리적 응답
- [ ] 상태파일 lifecycle (생성/이어가기/idle reset/명시 reset/손상 복구) 모두 동작
- [ ] ZZEM 환경에서 `~/.recall.yaml` 없이도 default 경로로 동작 (ZZEM 의 default 는 sprint-orchestrator + ~/.zzem/kb)
- [ ] OSS 사용자가 자기 `.recall.yaml` 만 만들면 ZZEM 코드 없이 동일 스킬 사용 가능
- [ ] `Sources` 섹션은 모든 답변 턴에 노출 (검증/할루시네이션 견제)
- [ ] 어떤 retrieval 실패도 abort 시키지 않음 (graceful skip + log)
