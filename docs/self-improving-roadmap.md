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
- `knowledge-base/design/` 스키마 파일 (이미 부분 존재) 완성
- Phase 3 (`phase-prototype.md`)에서 동일 도메인 design pattern 자동 참조 단계 추가
- `quality-report.yaml` → `design-proto-{NNN}.yaml` 변환 로직 명문화

### #5 Skill Library (플랜 B)
**현황**: 6.7b는 placeholder만 존재 (skill_candidate 태깅).

**작업**
- `knowledge-base/skills/` 디렉토리 + 스키마 (재사용 코드 템플릿, ID, 적용 trigger)
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
