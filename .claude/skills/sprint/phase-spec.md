# Phase 2: Spec (Sprint Lead as Planner)

PRD를 **deliverable-focused** 명세로 확장한다.

## Planner 원칙

- **What, not How**: 각 기능이 달성해야 할 결과를 명세. 구현 방법은 Generator가 결정.
- **Testable Criteria**: 모든 AC는 코드로 검증 가능한 형태로 작성.
- **Over-specification 회피**: 구현 세부사항 사전 지정은 오류 cascade 유발.

## Workflow

0. **Cross-Sprint Memory 로드** (Reflexion-style):
   - `knowledge-base/reflections/` 디렉토리 ls → 같은 도메인 태그 + 최근 3개 파일 선택
   - 각 reflection의 **Lesson** 섹션만 추출하여 Spec 컨텍스트에 주입
   - `knowledge-base/patterns/README.md` 인덱스에서 `frequency >= 2` 이고 새 PRD 도메인과 관련된 패턴 식별
   - 도출된 lesson/pattern은 PRD 분석 후 Spec에 명시적으로 채택/기각 (기각 사유 1줄 기록)
1. **PRD 분석**: User Story + AC 추출, 비즈니스 목표 파악.
2. **코드베이스 패턴 파악**:
   - Backend: `backend/apps/meme-api/src/`
   - App: `app/apps/MemeApp/src/`
3. **API Contract 생성**: `api-contract.yaml` (OpenAPI 3.0) — SSOT.
4. **태스크 분해**: `tasks/backend/*.md`, `tasks/app/*.md`
   - 필수 섹션: Target, Context, Objective, Specification, Acceptance Criteria
   - Implementation Hints는 **기존 패턴 참조만** 포함. 구체적 구현 지시 금지.
   - 번호 규칙: 동일 번호 = 병렬, 낮은 번호 = 선행
5. **Evaluation Criteria**: `evaluation/criteria.md` 생성.
   - 그룹별 평가 기준 + Evaluator 캘리브레이션 가이드
6. **E2E Flow 매핑** (app 태스크 존재 시): `contracts/e2e-flow-plan.md` 생성.
   - 기존 flow 목록: `app/apps/MemeApp/e2e/flows/*.yaml` 확인
   - 각 AC에 대해 네 분류 중 하나 지정:
     - **Covered**: 기존 flow로 충족 (flow 파일명 명시)
     - **Extend**: 기존 flow에 step 추가 (대상 flow + 추가 step 요약)
     - **New**: 신규 flow 작성 필요 (flow 이름 제안 + 필요한 testID + 시드 데이터 여부)
     - **Deferred**: e2e 범위 외. 이유 명시 필수 — `BE-only` / `native-dialog` / `multi-device` / `time-warp` / `server-injection-required` 등. 대체 검증 수단(BE 유닛/통합, 수동 QA) 명시.
   - AC별 커버리지 표 필수. `New`/`Extend`는 관련 app 태스크의 Specification에 "E2E 인증: `flows/{name}.yaml` 작성/확장" 항목으로 반영.
   - Maestro 제약 인지: Fabric+RNGH tap 미발화 → 네비게이션은 **딥링크 우선**. 새 화면은 zzem:// 딥링크 경로 선언 필수 (e2e README 참조).
   - **CTA 검증 타협**: 탭→결과가 중요한 CTA(예: 확인 바텀시트 버튼)는 `assertVisible`까지만 e2e로, 실제 탭 후 결과는 Evaluator 코드 추적에 위임.
6.5. **E2E Seed Plan** (app 태스크 + 신규/확장 flow에 시드 데이터 필요 시): `contracts/e2e-seed-plan.md` 생성.
   - 필요한 seed fetcher 목록: `fetch-seed-{name}.mjs` 제안 이름 + 조회할 BE endpoint + 주입 env 변수명
   - 필요한 BE 준비 작업(테스트 데이터 시드, 상태 조작 엔드포인트 등)은 관련 **backend 태스크의 Specification에 사전 반영**하여 그룹 시작 전 준비되도록 한다.
7. **자체 검증**: OpenAPI 유효성, AC testability, 순환 의존성 없음, (app 태스크 존재 시) 모든 AC가 e2e-flow-plan에 매핑됨.

## File Reading Strategy

코드베이스 패턴 파악 시 전체 파일이 아닌 필요한 부분만 읽는다:
- 디렉토리 구조: `ls` 또는 `Glob`으로 파일 목록만 확인
- 기존 패턴: 대표 파일 1~2개만 읽어 구조 파악 (전체 스캔 금지)
- PRD: AC 섹션 중심으로 읽기 (`offset`/`limit` 활용)

## Gate → Phase 3

다음 조건 **모두** 충족 시 Phase 3 진입:
- [ ] `api-contract.yaml` 존재 + OpenAPI 3.0 유효성 통과
- [ ] 모든 태스크 파일에 필수 섹션 존재 (Target, Context, Objective, Specification, AC)
- [ ] 태스크 번호 간 순환 의존성 없음
- [ ] 각 AC가 testable (모호한 표현 — "적절한", "빠른" 등 — 금지)
- [ ] Backend 태스크와 App 태스크가 API contract의 동일 endpoint를 참조
- [ ] (app 태스크 존재 시) `contracts/e2e-flow-plan.md` 생성 + 모든 AC가 Covered/Extend/New 중 하나로 분류됨

**Phase 3 스킵 조건**: app 태스크가 0개이거나, 모든 app 태스크에 `### Screens / Components` 섹션이 없으면 Phase 3를 건너뛰고 Phase 4로 직행.

## Checkpoint (Phase 2 완료 시)

`checkpoints/phase-2-summary.md` 생성:

```markdown
# Phase 2 Checkpoint: {sprint-id}

## Tasks
| ID | Type | Target | Group |
|----|------|--------|-------|
| {task-id} | backend/app | {1줄 요약} | {group-N} |

## API Endpoints
| Method | Path | Related Tasks |
|--------|------|---------------|
| {method} | {path} | {task-ids} |

## Key Decisions
- {PRD 해석 시 내린 주요 판단 1}
- {PRD 해석 시 내린 주요 판단 2}

## Group Plan
- Group 001: {task-ids} — {기능 요약}
- Group 002: {task-ids} — {기능 요약}
```

> 이후 Phase에서는 원본 PRD 전체를 다시 읽지 않고, 이 checkpoint + 태스크 파일을 참조한다.

## Output

Gate 통과 시:
1. Checkpoint 파일 생성 (`checkpoints/phase-2-summary.md`).
2. **Sprint Status 출력** — `--status` 대시보드를 출력하여 현재 진행 상태를 표시한다.
3. 다음 Phase 진입.

```
Sprint Spec: {sprint-id}
  API Contract: {N} endpoints
  Tasks: Backend {N} + App {N}
  Evaluation Criteria: defined

[Sprint Status Dashboard]

→ Proceeding to Phase 3: Prototype
→ Proceeding to Phase 4: Build (no UI tasks — skipping prototype)
```
