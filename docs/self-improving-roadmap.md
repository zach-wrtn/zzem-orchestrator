# Self-Improving Orchestration Roadmap

> 스프린트 오케스트레이션 시스템의 self-improving 메커니즘 고도화 로드맵.
> 2026-04-13 검토 결과 기반.

## 완료 (2026-04-13)

### Phase A1+A2: Retro 3종 승격 의식 + Rubric 버전관리
- `phase-retro.md` 6.7을 6.7a/b/c/d로 분할
- `knowledge-base/rubrics/v1.md` 베이스라인 생성 + Phase 4.4 Evaluator 자동 로드
- 승격 조건: pattern `frequency >= 2` → rubric Promotion Log, 누적 2건 → v(N+1) 본문화

### Phase C1: Reflexion 메모리 루프
- `knowledge-base/reflections/{sprint-id}.md` 스키마 정의
- Phase 2 Spec Workflow 0번 단계: 동일 도메인 최근 3개 reflection 자동 로드
- Phase 6 Retro 6.7d: 1페이지 자연어 회고 작성 (누락 금지)

---

## Gating Criteria (착수 전 필수 검증)

self-improving 개선 작업을 시작하기 전에 **반드시 아래 데이터 누적 기준을 충족하는지 확인**한다.
미달 시 사용자에게 작업을 권장하지 않고, 부족한 데이터 누적을 먼저 안내한다.

| 항목 | 필요 데이터 | 최소 누적 스프린트 |
|------|-----------|-------------------|
| #3 deferred 구조화 | deferred-items 사례 1건 | 1 스프린트 |
| #4 Prototype KB | design 패턴 2~3건 누적 | 2 스프린트 |
| #5 Skill Library | 동일 코드 패턴이 2그룹+에서 반복 감지 | 3 스프린트 |
| #6 프롬프트 최적화 | A/B 비교 샘플 5건+ (Prototype phase) | 5 스프린트 |
| #E1 피드백 승격 | 데이터 의존성 없음 | 언제든 |

**검증 절차** (개선 요청 수신 시):
1. `sprints/` 디렉토리에서 완주된 스프린트 수 확인
2. 해당 항목별 데이터 누적량을 standalone KB에서 확인 (`zzem-kb:read type=pattern` / `type=reflection`; design 패턴은 `category=design_proto|design_spec`로 필터)
3. 미달이면: "현재 {N} 스프린트 누적, {항목}은 최소 {M} 스프린트 필요. 먼저 스프린트 진행을 권장합니다." 안내
4. 충족이면: 착수 진행

**예외 — 묶음 작업 가이드**:
- #3 + #E1만 동시 진행 가능 (둘 다 저비용·충돌 없음)
- #4 / #5 / #6은 절대 동시 진행 금지 (KB 스키마 충돌 + 효과 분리 불가)

---

## 미적용 (우선순위 순)

### #3 Phase 4.1 Contract + `--continue` 구조화 (플랜 C2)
**문제**: `deferred-items.yaml`의 `suggested_approach`가 자유 텍스트 → `--continue` 시 같은 실수 반복.

**작업**
- 스키마 확장: `suggested_approach: { type, contract_clause_draft, detection, prevention }`
- `phase-build.md` 4.1: `--continue` 모드일 때 `contract_clause_draft`를 Done Criteria에 자동 전사
- `phase-retro.md` 6.3 deferred-items 작성 단계도 동일 스키마로 갱신

### #4 Prototype KB 경로 완성 (플랜 A4)
**문제**: `phase-retro.md:241-242` design KB 경로 incomplete. Design Engineer 학습 병목.

**작업**
- Standalone KB의 design 패턴 분류 정비 — `learning/patterns/` 내 `category=design_proto|design_spec` 규약 정착 (별도 디렉토리 불필요; category로 필터)
- Phase 3 (`phase-prototype.md`)에서 동일 도메인 design pattern 자동 참조 단계 추가 (`zzem-kb:read type=pattern category=design_proto` 활용)
- `quality-report.yaml` → `design-proto-{NNN}.yaml` 변환 로직 명문화

### #5 Skill Library (플랜 B)
**현황**: 6.7b는 placeholder만 존재 (skill_candidate 태깅).

**작업**
- Standalone KB에 `learning/skills/` 신규 content type + `schemas/learning/skill.schema.json` 추가 (재사용 코드 템플릿, ID, 적용 trigger)
- 동일 패턴 2그룹+ 반복 시 skill 후보 자동 추출
- Phase 4.2 Implement 시작 시 관련 skill 사용자 승인 gate (Generator 오염 방지)
- 우선 후보: MemeApp 컴포넌트 생성기, API contract 스니펫, Zod 스키마 패턴

### #6 프롬프트 자동 최적화 — Prototype 한정 (플랜 D1)
**범위 제한 이유**: 평가 지표 명확 (`extraction_accuracy` + `fabrication_risk`).

**작업**
- `component-patterns.md` 예시 중 PASS 샘플 top-K를 동적 선별하는 selector
- A/B: 고정 프롬프트 vs 자동 선별 → quality_score 비교
- 성공 시 Build phase로 확장 검토 (DSPy MIPRO 본격 도입)

### #E1 사용자 피드백 → Rule 자동 승격 (플랜 E1)
**현황**: Phase 6.7c에 nudge 메커니즘만 정의, 자동 추출 미구현.

**작업**
- 세션 로그에서 사용자 교정 패턴 자동 추출
- frequency 2+ 항목 → `MEMORY.md`의 `feedback_*.md` 후보 제시
- 승인 시 auto-memory 가이드 절차로 파일 작성

---

## 보류 (효과 검증 후 재검토)

### Success Workflow 추출 (플랜 A3)
PASS된 phase sequence를 workflow 템플릿으로 저장 (AWM-inspired). 성공 패턴이 2-3개 누적된 뒤 의미.

### Cross-task Insight 추출 (ExpeL)
여러 스프린트 횡단 lesson 추출해 global rubric 업데이트. 스프린트 5건+ 누적 후 검토.

### Self-Discover 적용
Planner가 PRD 유형별로 phase 구성 자체를 재조립. 현 6-phase 고정이 충분한지 먼저 평가.

---

## 가드레일 (모든 작업에 공통 적용)

- KB 비대화 방지: `auto-cleanup` 규칙 강화 — 3 sprint 미참조 자동 archive (이미 정의됨, 실행 주기 명문화 필요)
- 자동 승격 false positive 방지: 모든 승격에 `frequency >= 2` 또는 사용자 nudge gate 유지
- Rubric 누적 복잡도: v(N+1) 생성 시 dead clause 은퇴 규칙 병행 정의 필요

## 참고 레퍼런스

학술: Reflexion (Shinn 2023), Voyager (Wang 2023), AWM (Wang 2024), ExpeL (Zhao 2024), Self-Discover (Zhou 2024), DSPy MIPRO/BootstrapFewShot, OPRO

엔지니어링: Cursor Rules auto-promotion, SWE-agent ACI, MetaGPT SOP, AutoGen Teachable Agent, LangGraph reflection cycles

Anthropic: Claude Code Skills, Memory tool (2025), computer-use trace replay
