# PRD: ugc-platform-integration-qa-2

**Sprint ID**: ugc-platform-integration-qa-2
**Type**: Feature addition + QA + v2 pipeline live dogfood
**Start**: 2026-04-25
**Canonical PRD**: `docs/prds/ugc-platform-integration-qa-2.md` ← **SSOT — 이 파일을 참조**

> 본 디렉토리의 PRD.md 는 canonical PRD 에 대한 orchestration-layer index. 실제 User Stories / Acceptance Criteria / Business Rules 는 canonical 파일에서 읽는다.

---

## 성격

**1차 (`ugc-platform-integration-qa`) 와 다름**: 1차는 "기능 추가 금지 — 순수 QA". 본 2차는 **신규 화면 23개 산출 + 기능 동작 + QA 통합** + **v2 prototype pipeline (PR #29-#36) 의 첫 라이브 dogfood**.

## 선행 스프린트

- ugc-platform-001 (merged #794/#555) — 프로필 & 네비게이션
- ugc-platform-002 (merged #799/#562) — 피드 인터랙션 & 페이백
- ugc-platform-003 (merged #804/#563) — 소셜 & 알림
- ugc-platform-integration-qa (1차) — manual QA carryover 종결

## Group Plan (orchestration level, canonical PRD 에서 선별)

| Group | Scope | 화면 수 | Archetype mix | Priority | Repo |
|-------|-------|--------:|---------------|----------|------|
| 001 | 카메라 / 프로필 사진 편집 | 11 | form×6 + modal×3 + detail×2 | **P0** | app |
| 002 | 차단 / 차단 관리 | 8 | modal×4 + detail×3 + feed×1 | **P0** | app + backend (Mock 또는 별 BE) |
| 003 | 알림 (센터 + 설정) | 4 | feed×1 + empty_state×1 + form×2 | P1 | app + backend (Mock 또는 별 BE) |
| 004 (옵션) | 설정 nav glue | 1 | — | P2 | app |

**총 23 in-scope 화면** — 5 v2 archetype 노출 (modal/form/feed/detail/empty_state). onboarding 만 미커버.

## v2 Pipeline 운영 룰 (canonical PRD 참조)

본 스프린트는 v2.1 파이프라인의 첫 실 운영. 모든 메커니즘 적용 — Pass 6 (10 checks) + Assumption Preview Gate + Asset Layer + Archetype Persona + Variants Mode (조건부) + Curated Exemplars (feed 자동 인라인).

상세: `docs/prds/ugc-platform-integration-qa-2.md` § "v2 Pipeline 운영 룰".

## Cross-cutting 제약 (canonical PRD §)

### ALWAYS DO
1. v2 파이프라인 모든 메커니즘 적용 (스킵 금지)
2. Sprint Lead 가 v2 메커니즘별 운영 결과를 retrospective 에 정량 기록
3. 모든 화면 verify-prototype 통과
4. exemplar drift warning 발생 시 사용자 보고

### NEVER DO
1. v2 메커니즘 우회 / 스킵
2. PRD 의 archetype 분류 무시
3. UI copy 임의 변경 (Figma 의 한국어 카피 그대로)

### OUT OF SCOPE
1. 카메라: 동영상 / 다중 사진 업로드
2. 차단: 신고 / 키워드 차단 / 일괄 차단
3. 알림: 카테고리 추가 / 시간대 설정
4. Backend: 차단/알림 설정 API 신규 (별 BE 스프린트 또는 Mock 으로 진행)

## Figma Source

- File: `https://www.figma.com/design/7hozJ6Pvs09q98BxvChj08/Wrtn-X_쨈_Sprint-File`
- Page 1 (37160:25098): UGC Platform 1 - 프로필 & 네비게이션 → 카메라 11 화면
- Page 2 (37160:51672): UGC Platform 3 - 소셜 & 알림 → 차단 8 + 알림 3 화면

상세 화면 ID 매핑 + AC: `docs/prds/ugc-platform-integration-qa-2.md`
