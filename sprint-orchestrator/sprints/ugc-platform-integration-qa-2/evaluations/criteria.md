# Evaluation Criteria — ugc-platform-integration-qa-2

> **Sprint mode**: v2 prototype pipeline live dogfood. Phase 3 prototype output 가
> 1차 평가 대상. BE OUT OF SCOPE — endpoint Mock.

## Group-별 평가 기준

### Group 001 — 카메라 / 프로필 편집 (P0, 11 화면)

진입(`프로필편집_메인`) → 닉네임/사진 변경 → confirm modal → 결과 확인 의 5
plus 변형 화면이 일관된 form/modal/detail persona 강제 룰을 통과해야 한다.
특히 `프로필편집_사진_크롭` / `프로필편집_사진_앨범선택` 처럼 fabrication_risk
medium 으로 분류될 수 있는 화면은 Assumption Preview Gate 의 `intent.md` 가
선행 산출되었는지, gate_questions 가 사용자에게 3-5문장 으로 요약 제시되었는지
확인. 11 화면이 동일한 token map (`semantic.label.*`, `component.button.*`,
`component.bottom-sheet.*`) 안에서 동작하고 raw hex 사용 0건이어야 한다.

### Group 002 — 차단 / 차단 관리 (P0, 8 화면)

타유저 프로필 더보기 → 차단 confirm → 차단됨 상태 → 차단관리 리스트 → 일괄
해제 까지의 modal × 4 + detail × 3 + feed × 1 흐름이 끊김 없이 이어져야 한다.
`차단관리_리스트` (feed) 는 curated exemplar
(`v2-dogfood-free-tab-app-001-freetabscreen`) 가 자동 인라인되며, exemplar drift
warning (Pass 6 #10) 이 발생하면 Sprint Lead 에 보고하고 차별화 결정을 회의록
화. 차단/해제 toast 또는 confirm 화면 1 step 의 micro-interaction 이 modal
persona 의 dismiss 경로 (backdrop tap / cancel CTA) 와 동시에 동작해야 한다.

### Group 003 — 알림 (P1, 3 화면 + Group 004 nav glue 1)

`알림센터_기본` (feed) 와 `알림센터_노데이터` (empty_state) 는 같은 entry point
에서 분기되며 데이터 유무에 따라 자연스럽게 전환되어야 한다. empty_state 는
single primary CTA + concise 메시지 의 persona 강제 룰을 통과. 핵심 dogfood
포인트는 `알림설정_토글` (form) 이 form persona 강제 룰 #2 (`별도 저장 버튼
존재`) 와 충돌하는 케이스 — 토글 즉시 저장 패턴을 채택하면 form persona
권장 룰 거절 사유를 quality-report 의 `archetype_recommendation_skipped` 에
기록한다. Group 004 (`설정 / 설정_메인메뉴`) 는 entry 정합성만 검증.

## v2 Dogfood 메트릭 (스프린트 retrospective 입력)

| 메트릭 | 측정 단위 | 목표 |
|--------|----------|------|
| Pass 6 audit pass rate | `pass / 23 화면` | ≥ 22 / 23 (≥ 95%) |
| Persona compliance (강제 룰) | 룰 통과 화면 / archetype 별 화면 | 100% per archetype |
| Persona recommendation skipped | `archetype_recommendation_skipped` 카운트 | ≤ 3 (모두 사유 기록) |
| Exemplar drift count | feed 화면 중 drift warning 발생 수 | ≤ 1 (보고 + 사용자 decision) |
| Fabrication risk distribution | `none / low / medium / high` 비율 | medium ≤ 30%, high = 0 |
| Assumption Preview Gate trigger | medium 화면 중 `intent.md` 산출 비율 | 100% |
| Variants Mode trigger | medium 화면 중 3-way DE 스폰 비율 | ≥ 1 화면 (정책 수립용 표본) |
| Asset Layer `needs_real_content` | 슬롯별 placeholder vs real | retrospective 기록 |

## Evaluator 캘리브레이션 가이드

- **PASS** = Pass 6 audit 9/9 (or 10/10 with exemplar) + persona 강제 룰 100% +
  verify-prototype 통과 + AC 의 micro-AC 최소 3/4 충족.
- **REVISE** = Pass 6 audit 7-8/9 또는 persona 강제 룰 1건 위반. quality-report
  업데이트 후 Phase 3 재실행.
- **FAIL** = Pass 6 audit ≤ 6/9 or fabrication_risk: high. 화면 단위 재계획.

> Evaluator 는 raw hex / emoji on interactive / persona 강제 룰 위반은 모두
> blocker 로 취급 — 개수와 무관.
