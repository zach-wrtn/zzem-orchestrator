# Phase 2 BE Grep Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Phase 2 (Spec) 의 spec engineer / Sprint Lead 가 "BE OUT OF SCOPE" 결정 또는 Mock api-contract 작성 전에, 실제 BE source 를 grep 하여 endpoint 존재 여부 + path + payload 를 확인하는 protocol 을 phase-spec.md 에 추가한다. `ugc-platform-integration-qa-2` 스프린트에서 7/7 endpoint 가 production 에 이미 존재했는데도 Mock 으로 추정하여 7/7 부정확 사례가 발생한 것을 재발 방지한다.

**Architecture:** Single phase, 1 file modify (`.claude/skills/sprint/phase-spec.md`). 신규 코드/스크립트 없음. 마크다운 워크플로 단계 1 개 + Gate 조건 1 개 추가.

**Tech Stack:** Markdown only.

---

## Background — qa-2 Lesson

`ugc-platform-integration-qa-2` 스프린트 Phase 2 에서 spec engineer 는 PRD 의 "BE 변경 없음" 문구를 근거로 BE 를 OUT OF SCOPE 처리하고 `contracts/api-contract.yaml` 을 **Mock** 으로 작성했다. 후속 `ugc-platform-be-reconciliation` mini-sprint 에서 실제 BE source (`backend/apps/meme-api/src/**`) 를 grep 한 결과:

- **7/7 endpoints 가 이미 production 에 존재** (block, notification, profile 등)
- **0/7 exact match** — Mock 의 path / payload / response shape 가 모두 production 과 다름
- spec 전면 rewrite 필요 → FE 태스크가 잘못된 contract 기준으로 작성될 뻔함

**Root cause**: Phase 2 spec engineer 가 actual BE source 를 한 번도 grep 하지 않고 PRD 의 OUT OF SCOPE 선언만 신뢰함. grep 1 회로 막을 수 있었던 결정적 누락.

## File Structure

| Phase | File | Action |
|-------|------|--------|
| 1 | `.claude/skills/sprint/phase-spec.md` | Modify — Workflow 0.6 단계 + Gate 조건 추가 |

---

## Phase 1 — phase-spec.md Workflow 0.6 추가

### Task 1.1: BE Grep 단계 추가

**Files:** `.claude/skills/sprint/phase-spec.md`

- [ ] **Step 1: 앵커 확인**

  ```bash
  grep -n "^### 0\.5\|API Contract\|Gate → Phase 3" .claude/skills/sprint/phase-spec.md
  ```

  기대: `0.5. **Cross-Sprint Memory 로드**` 라인 (현재 14) + `## Gate → Phase 3` (현재 52) 가 존재.

- [ ] **Step 2: 0.6 BE Grep Protocol 섹션 삽입**

  현재 `0.5.` 단계 끝 (line 18 부근, "기각 사유 1줄 기록" 다음) 직후, `1. **PRD 분석**` (line 19) 직전에 다음 섹션 삽입:

  ````markdown
  0.6. **BE Endpoint Grep** (BE OUT OF SCOPE 결정 또는 Mock api-contract 작성 전 필수):

     PRD 가 BE 와 관련된 sub-graph (차단/신고/알림/프로필/콘텐츠/팔로우 등) 를 포함하면, Mock api-contract 작성 전에 실제 BE source 의 endpoint 존재 여부를 grep 으로 확인한다.

     **실행**:
     ```bash
     # source repo: backend/apps/<api>/src
     grep -rn "@Controller\|@Get\|@Post\|@Patch\|@Delete" \
       backend/apps/meme-api/src --include="*.controller.ts" \
       | grep -i <domain>
     ```

     `<domain>` 예시: `block`, `notification`, `profile`, `follow`, `report`, `content`.

     **산출물**: `contracts/be-grep-summary.md`
     - 발견된 endpoint 목록 (method + path + controller 파일 경로)
     - payload schema (DTO 파일 경로 + 핵심 필드)
     - 분류: `exists` / `partial` / `missing`

     **판정 룰**:
     - 모든 endpoint 가 이미 존재 → "BE OUT OF SCOPE" 라벨 OK, **단 Mock 대신 actual schema** 를 api-contract.yaml 에 사용
     - 일부만 존재 → 신규 endpoint 만 BE Mock, 기존 endpoint 는 actual schema
     - 모두 없음 → BE Mock 또는 별도 BE sprint 분기

     **Anti-pattern (qa-2 lesson)**: PRD 가 "BE 변경 없음 / OUT OF SCOPE" 라고 명시했다는 이유만으로 actual BE source 를 확인하지 않고 Mock 작성 → `ugc-platform-integration-qa-2` 에서 7/7 endpoint 가 production 에 존재했는데 Mock 과 0/7 exact match 사례 발생. 후속 `ugc-platform-be-reconciliation` mini-sprint 로 spec 전면 rewrite 필요.
  ````

- [ ] **Step 3: Gate 조건 업데이트**

  `## Gate → Phase 3` 체크리스트에 다음 항목 추가 (line 60 다음):

  ```markdown
  - [ ] (BE 관련 PRD 인 경우) `contracts/be-grep-summary.md` 존재 + endpoint 분류 (`exists`/`partial`/`missing`) 표 포함. `exists` 는 actual schema 가 api-contract.yaml 에 반영됨.
  ```

- [ ] **Step 4: Verification grep**

  ```bash
  grep -nE "0\.6|be-grep-summary" .claude/skills/sprint/phase-spec.md
  ```

  기대: 최소 3 매치 (0.6 헤더 + 산출물 경로 + Gate 항목).

- [ ] **Step 5: Commit**

  메시지: `docs(phase-spec): add 0.6 BE Grep Protocol to prevent Mock divergence`

  Body: qa-2 7/7 Mock 부정확 사례 + be-reconciliation rewrite 필요했던 lesson 요약.

---

## Post-Plan Verification

- [ ] **Step 1: 다음 sprint Phase 2 가 BE 관련 시 0.6 단계 실행 확인**

  다음 sprint dogfood 시 spec engineer 가 0.6 grep 을 실행하고 `contracts/be-grep-summary.md` 산출물을 생성하는지 검증. Mock 대신 actual schema 가 api-contract.yaml 에 반영되어야 함.

- [ ] **Step 2: Gate enforcement 확인**

  Phase 2 → Phase 3 진입 전 Gate 체크에서 BE 관련 PRD 인데 `be-grep-summary.md` 가 없으면 차단되는지 확인.

---

## Open Questions

- [ ] **Domain 키워드 분류 정밀화**: `block`/`notification` 같은 명확한 domain 외에, `auth`/`health`/`me` 처럼 다양하게 매칭되는 모호 domain 은 grep 패턴이 불충분할 수 있음. 별 plan 에서 domain dictionary 를 정의할지?

- [ ] **Multi-source BE repo 처리**: `backend/apps/meme-api`, `backend/apps/opus-api` 등 source 가 여러 개인 경우 어느 repo 를 grep 할지 선택 로직 필요. 현재는 spec engineer 가 수동 선택. `sprint-config.yaml` 에 `be_sources: [...]` 필드 추가하는 별 plan?

- [ ] **API Contract 자동 합성**: be-grep-summary 의 actual schema 를 api-contract.yaml 로 자동 변환하는 도구가 있으면 spec engineer 의 인지 부하 감소. 별 plan 후보.

- [ ] **Reflexion KB 적재**: 0.6 결과를 `zzem-kb` 의 `type=reflection domain=be-grep` 로 적재하면 다음 sprint 의 0.5 단계에서 자동 로드됨. 적재 시점/포맷 결정 필요.
