# Phase 4: Build (Sprint Lead + BE + FE + Evaluator — Iterative Loop)

**핵심**: 전체 태스크 일괄 디스패치가 아닌, 기능 그룹 단위 반복 루프.

```
For each feature group (001, 002, 003, ...):
  4.1 Contract  → Sprint Lead drafts, Evaluator reviews
  4.2 Implement → Engineers build in worktrees
  4.3 Merge     → Sprint Lead merges to sprint branch
  4.4 Evaluate  → Evaluator actively assesses
  4.5 Fix/Accept → Fix loop or proceed to next group
```

## Context Window Guard

> 장시간 빌드 루프에서 context window 품질을 유지하기 위한 필수 프로토콜.

### Group Transition Protocol

**Group N PASS 확정 후, Group N+1 시작 전** 반드시 다음을 수행:

1. **Checkpoint 생성**: `checkpoints/group-{N}-summary.md` 작성
2. **이후 참조 규칙**: Group N+1 이후에서는 Group N의 원본 evaluation report를 다시 Read하지 않고, summary만 참조
3. **예외**: Fix loop에서 이전 이슈를 정확히 재현해야 할 때만 원본 Read 허용

**Checkpoint 템플릿**:
```markdown
# Group {N} Summary: {sprint-id}

## Scope
- Tasks: {task-ids}
- Endpoints: {관련 API endpoints}

## Result: {PASS | FAILED}
- Fix loops: {N}회
- Evaluator verdict: {최종 판정 요약}

## Issues Found & Resolved
| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | {major/minor} | {이슈 1줄 요약} | {해결 방법 1줄} |

## Lessons for Next Group
- {다음 그룹 Contract/구현에 반영해야 할 교훈}

## Files Changed
- {주요 변경 파일 목록}
```

### Progressive File Reading

Sprint Lead가 파일을 읽을 때 context 효율을 위해:
- **api-contract.yaml**: 현재 그룹의 관련 endpoint만 읽기 (`offset`/`limit` 활용)
- **태스크 파일**: AC 섹션 중심으로 읽기 (전체 파일 대신)
- **Evaluation 보고서**: 이슈 목록 + verdict 섹션만 읽기
- **이전 그룹 정보**: `checkpoints/group-{N}-summary.md`만 참조

## 파이프라인 병렬화 규칙

순차 실행이 기본이지만, 다음 조건에서 병렬화 허용:

| 상황 | 허용 범위 |
|------|----------|
| Group N 평가 중 (4.4) | Group N+1 계약 작성 (4.1) 선행 가능 |
| Group N PASS 확정 전 | Group N+1 구현 (4.2) 시작 **불가** |
| 같은 그룹 BE/FE | 항상 병렬 실행 |
| 다른 레포 머지 (4.3) | 독립이므로 병렬 가능 |

**핵심 제약**: 이전 그룹이 PASS 되기 전에 다음 그룹 구현을 시작하지 않는다. 이전 그룹의 fix가 다음 그룹 spec에 영향을 줄 수 있기 때문.

## 4.0 Sprint 브랜치 생성 (첫 그룹 시)

**관련 레포만 브랜치 생성**: backend 태스크만 있으면 wrtn-backend만, app 태스크만 있으면 app-core-packages만 생성.

```bash
# wrtn-backend (backend 태스크 존재 시)
cd wrtn-backend
git fetch origin {backend-base}
git checkout -b zzem/{sprint-id} origin/{backend-base}

# app-core-packages (app 태스크 존재 시)
cd app-core-packages
git fetch origin {app-base}
git checkout -b zzem/{sprint-id} origin/{app-base}
```

Base branch 우선순위: `sprint-config.yaml` → `defaults.base` → `"main"`

## 4.1 Sprint Contract (per group)

Sprint Lead가 해당 그룹의 계약서를 구성한다:

```markdown
# Sprint Contract: Group {N}

## Scope
- Tasks: {task-ids}
- Endpoints: {related API endpoints}

## Done Criteria
- [ ] {testable criterion 1}
- [ ] {testable criterion 2}
- ...

## Verification Method
- {Evaluator가 각 criterion을 어떻게 검증할지}
- {테스트할 엣지 케이스}
- {검증할 비즈니스 규칙}
```

저장: `sprints/{sprint-id}/contracts/group-{N}.md`

Evaluator에게 계약서 리뷰 요청:

```
TaskCreate:
  Subject: contract-review/group-{N}
  Description: <계약서 경로 + 원본 태스크 파일 참조>
  Owner: Evaluator
```

**Contract 합의 프로토콜:**

1. **Evaluator 리뷰 결과 분류**:
   | 이의 유형 | 처리 |
   |----------|------|
   | **Ambiguity** (모호한 기준) | Sprint Lead가 기준을 구체화 (수치, 조건 명시) |
   | **Missing Edge Case** | Done Criteria에 추가 |
   | **Untestable Criterion** | 검증 방법 재설계 또는 기준 재작성 |
   | **Scope Dispute** (범위 이견) | 원본 태스크 AC와 대조 → 일치하면 유지, 불일치하면 수정 |

2. **합의 루프**:
   - Round 1: Evaluator 리뷰 → Sprint Lead 수정
   - Round 2: Evaluator 재리뷰 → 합의 또는 잔여 이의
   - Round 3 (최종): 합의 실패 시 사용자에게 잔여 이의 목록 제시 → 사용자 판단

3. **합의 완료 시**: 계약서에 `## Sign-off` 섹션 추가 (날짜 + "Evaluator approved")

**이전 그룹 교훈 반영**: Group 2+의 Contract 작성 시 `checkpoints/group-{N-1}-summary.md`의 "Lessons for Next Group"을 참조하여 Done Criteria를 보강한다.

## 4.2 Implement (Engineers)

해당 그룹의 태스크만 디스패치:

```
For each task in current group:
  TaskCreate:
    Subject: impl/{project}/{task-id}
    Description: <태스크 파일 + API contract + Sprint Contract 참조>
    Owner: {BE/FE} Engineer
```

BE/FE Engineer가 worktree에서 구현 후 완료 보고.
**같은 그룹의 BE/FE 태스크는 병렬 실행.**

### Cross-Repo 의존성 처리

같은 그룹 내 BE/FE가 병렬 실행될 때 FE가 아직 없는 BE API에 의존하는 경우:

1. **API Contract가 SSOT**: FE Engineer는 `api-contract.yaml`의 request/response 스키마를 기준으로 구현.
2. **Mock/Stub 전략**: FE 태스크 spec에 다음을 포함:
   ```
   ## API Dependency
   - Endpoint: POST /api/v1/follows
   - Contract: api-contract.yaml#/paths/~1api~1v1~1follows/post
   - FE는 contract 기반으로 구현. 실제 BE 연동은 Evaluator가 머지 후 검증.
   ```
3. **Evaluator 통합 검증**: 그룹 머지 완료 후 Evaluator가 BE↔FE 실제 연동을 검증.
4. **Contract 불일치 발견 시**: Evaluator가 ISSUES로 보고 → Sprint Lead가 contract 수정 → 양쪽 fix 태스크.

## 4.3 Merge (Sprint Lead)

completed 태스크를 순차 머지:

```
1. git checkout zzem/{sprint-id}
2. git merge zzem/{sprint-id}/{task-id} --no-ff -m "merge: {task-id}"
3. 충돌 시: 스프린트 중단, 사용자 개입 요청
4. 성공 시: worktree 정리 (git worktree remove + branch delete)
```

같은 레포 내: 번호 오름차순 순차 머지.
다른 레포: 독립이므로 병렬 머지 가능.

## 4.3.1 QA Pattern Check (App 태스크 머지 후)

App 태스크가 포함된 그룹의 머지 완료 후, Evaluator 할당 **전에** Sprint Lead가 `qa-pattern-check` 스킬을 실행한다:

- **대상**: domain/ 또는 data/ 레이어 파일이 변경된 app 태스크
- **검증 항목**: 폴링 자기 무효화 무한루프 (ESLint), Zod 스키마 nullable (Jest fixture)
- **FAIL 시**: 해당 FE Engineer에게 fix 태스크 재할당 후 재머지. Evaluator 할당하지 않는다.
- **PASS 또는 해당 없음**: 4.4 Evaluate 진행

## 4.4 Evaluate (Evaluator)

그룹의 모든 태스크 머지 완료 후, Evaluator에게 평가 할당:

```
TaskCreate:
  Subject: eval/{project}/group-{N}
  Description: <Sprint Contract + 머지된 코드 경로 + evaluation criteria>
  Owner: Evaluator
```

Evaluator는 **Active Evaluation** 수행:
- Sprint Contract의 Done Criteria를 코드에서 하나씩 증명
- Logic tracing으로 실행 흐름 추적
- Edge case를 능동적으로 탐색
- Skepticism: "버그가 있다고 가정하고 찾아라"

평가 보고서: `sprints/{sprint-id}/evaluations/group-{N}.md`

판정:
| 판정 | 조건 | 다음 단계 |
|------|------|----------|
| **PASS** | Critical/Major 이슈 0개 | Checkpoint 생성 → 다음 그룹으로 진행 |
| **ISSUES** | Critical 0, Major 1+ | 4.5 Fix Loop |
| **FAIL** | Critical 1+, 또는 Major 3+ | 4.5 Fix Loop (또는 재구현) |

## 4.5 Fix Loop

ISSUES 또는 FAIL 시:
1. Evaluator 보고서를 원 Engineer에게 전달
2. Engineer가 이슈별 수정 후 완료 보고
3. Sprint Lead 머지
4. Evaluator 재평가
5. **최대 2회 반복**, 3회차 실패 시 FAILED 처리 + 사용자 개입 요청

## 4.6 에러 처리 및 복구 플레이북

| 상황 | Sprint Lead 처리 |
|------|-----------------|
| Engineer 구현 실패 | fix 태스크 재할당 (최대 2회) → FAILED |
| 머지 충돌 | 스프린트 중단, 충돌 상세 출력, 수동 해결 요청 |
| Evaluator ISSUES/FAIL | 원 Engineer에게 보고서 전달 → fix loop |
| Worktree 생성 실패 | 기존 worktree 정리 후 재시도 |

### 복구 플레이북

**P1: Engineer 구현 반복 실패 (fix 2회 초과)**
```
1. 실패 원인 분류: spec 모호 vs 기술적 한계 vs 의존성 문제
2. spec 모호 → Sprint Lead가 태스크 spec 재작성 후 재할당
3. 기술적 한계 → 사용자에게 scope 축소 또는 대안 접근 제안
4. 의존성 문제 → 선행 그룹 결과 확인, 필요시 그룹 순서 재조정
5. 해당 태스크 FAILED 마킹, 다른 태스크는 계속 진행
```

**P2: 머지 충돌 발생**
```
1. 충돌 파일 목록 + diff 출력
2. 충돌 원인 분석: 같은 그룹 내 BE/FE 겹침 vs 이전 그룹 잔여 변경
3. 사용자에게 충돌 컨텍스트 + 해결 가이드 제공
4. 사용자 해결 후 → git merge --continue → 나머지 머지 재개
5. 해결 불가 시 → git merge --abort → 해당 태스크만 FAILED 처리
```

**P3: Evaluator 반복 FAIL (fix loop 2회 초과)**
```
1. 누적 이슈 목록 정리 (1차 → 2차 → 3차)
2. 반복되는 이슈 패턴 분석
3. 사용자에게 3가지 옵션 제시:
   a) scope 축소: 해당 AC를 다음 스프린트로 이월
   b) 수동 수정: 사용자가 직접 코드 수정
   c) 그룹 재구현: 태스크 spec 수정 후 처음부터 재시작
4. 선택에 따라 sprint-config.yaml에 deferred 항목 기록
```

**P4: Worktree/Branch 오염**
```
1. git worktree list로 전체 worktree 상태 확인
2. 잔여 worktree: git worktree remove --force {path}
3. 잔여 branch: git branch -D zzem/{sprint-id}/{task-id}
4. sprint 브랜치 무결성 확인: git log --oneline zzem/{sprint-id}
5. 재시도
```

**P5: Phase 중간 재시작 (`/sprint {id} --phase=build --resume`)**
```
1. contracts/ 디렉토리에서 마지막 합의된 그룹 번호 확인
2. evaluations/ 디렉토리에서 마지막 PASS 그룹 번호 확인
3. checkpoints/ 디렉토리에서 기존 summary 확인
4. 다음 미완료 그룹부터 재개
5. 이미 머지된 태스크는 스킵, 미머지 태스크만 재디스패치
```

## Gate → Phase 5

다음 조건 **모두** 충족 시 Phase 5 진입:
- [ ] 모든 그룹이 ACCEPTED (Evaluator PASS)
- [ ] FAILED 그룹 0개 (FAILED 그룹 존재 시 사용자에게 skip 여부 확인)
- [ ] 모든 worktree 정리 완료 (잔여 worktree 없음)
- [ ] sprint 브랜치에 모든 머지 커밋 반영
- [ ] 모든 그룹의 checkpoint summary 생성 완료

**Partial PR 허용**: `--allow-partial` 플래그 시 ACCEPTED 그룹만으로 PR 생성. FAILED 그룹은 PR body에 명시.

## Output
```
Sprint Build: {sprint-id}

  [Group 001] ACCEPTED
    impl/backend/001-profile-api        merged → eval PASS
    impl/app/001-profile-screen         merged → eval PASS

  [Group 002] EVALUATING
    impl/backend/002-follow-api         merged
    impl/app/002-follow-ui              merged
    eval: pending...

  Results: 1/3 groups accepted, 1/3 evaluating

→ Proceeding to Phase 5: PR (all groups accepted)
```
