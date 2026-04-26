# Evaluation Criteria — preview-feature

## Calibration Notes (Evaluator)
- 이 sprint는 **prototype phase까지만** 실행되며 Phase 4(Build) 평가는 별도 sprint에서
  수행한다. Phase 3 종료 시점에는 prototype Quality와 Spec coverage만 평가한다.
- KB Lessons (ugc-platform-002/003)에서 강조: **prior-group lessons 선제 적용 필수**,
  fallback (`?? false`, `|| ""`) 금지, 포괄 표현 (`모든`/`전체`)에는 path 전수 나열 요구.
- Pattern `completeness-008`: 신규 필드 추가 시 semantic-breaking fallback이 evaluator의
  최우선 grep gate.
- Pattern `completeness-010`: BE-008 / APP-007는 변경 path 전수 나열을 PR/태스크 본문에서 검증.

## Group Plan (Phase 4 reference — for follow-up sprint)

| Group | Tasks | Theme |
|---|---|---|
| Group 001 | be-001, be-002, app-001 | Schema + flag plumbing + dual-CTA UI |
| Group 002 | be-003, be-005, be-006, be-009, app-002, app-003, app-005 | Preview start + loading + cancel + error sheets |
| Group 003 | be-004, be-007, be-008, app-004, app-006, app-007, app-008 | Result screen + i2v transition + isolation + nav |

> 본 sprint에서는 Group 002까지가 prototype 가시성 핵심. Group 003은 결과/이탈 + 격리.

## Per-Group Evaluation Criteria

### Group 001 — Schema & Foundation
**Code-tracing focus**:
- BE-001: schema에 신규 필드 4+4 추가; 기존 typed DTO/Mapper에 fallback 흔적 없는지 grep.
  - `rg "?? false|?? null|\\|\\| null|\\|\\| false" apps/meme-api/src --type ts`에서 신규 필드 0 hit.
- BE-002: i2i child 등록 시 parent flag 갱신; 동일 트랜잭션 안에서 atomic.
  - 단위 테스트 — 실패 분기에서 parent 미갱신 확인.
- APP-001: dual-CTA 분기 + 기존 단일 CTA 회귀 0.
  - testID 두 개 노출 (e2e prep).

**Verdict gates**:
- ❌ FAIL: schema 변경이 기존 list/aggregate 쿼리를 깨뜨림 (회귀 테스트 빨강).
- ❌ FAIL: 신규 필드에 semantic-breaking fallback 발견.
- ⚠ MINOR: index 추가 누락 (Content `{userId, isHidden}`).

### Group 002 — Preview Start + Loading + Errors
**Code-tracing focus**:
- BE-003: 검증 순서 — 단위 테스트로 4 단계 순서 증명. 차감 전 검증 실패 시 차감 0건.
- BE-005: cancel 후 콜백이 도착해도 결과 저장 안 됨. 슬롯 release 1회만.
- BE-006: `decompRole === 'i2i'` Content는 S3/썸네일/워터마크 후처리 0건.
- BE-009: slot counter increment/decrement가 BE-003/004/005/006 모든 경로에서 정확.
- APP-002: 이미지 1장 제한, ImageGuidance 시트 비노출 (PRD AC 2.1.3 명시).
- APP-003: cancel dialog 카피 정확 ("지금 나가면 작업이 취소되고, 사용한 크레딧은 환불되지 않아요. 정말 나가시겠어요?").
- APP-005: 422 응답 시 "다른 사진 선택하기" → PreviewBottomSheet image empty 복귀.

**Verdict gates**:
- ❌ FAIL: 검증 순서 위반 (예: 차감이 Rekognition 전).
- ❌ FAIL: i2i 결과가 S3에 저장되거나 워터마크 적용됨.
- ❌ FAIL: cancel 후에도 결과가 저장됨.
- ⚠ MINOR: 다이얼로그 카피 오타.

### Group 003 — Result + i2v + Isolation
**Code-tracing focus**:
- BE-004: i2v Content의 `parentFilterId` 정확 전파, `sourcePreviewContentId` 세팅.
- BE-004: 동일 preview에 두 번 proceed 시 두 번째 409.
- BE-007: 환불 금액 정확 (i2i 전액, i2v 부분). 멱등성: 콜백 중복 도착 시 1회만 환불.
- BE-008: list 쿼리 path 전수 나열 PR 본문 — pattern completeness-010 준수.
- APP-004: 워터마크 layer 없음 (DOM 검사). 9:16 비율.
- APP-007: navigation 변경 path 전수 PR 본문 명시.

**Verdict gates**:
- ❌ FAIL: i2i Content가 MemeCollection 응답에 포함됨.
- ❌ FAIL: 환불이 두 번 발생 (멱등성 위반).
- ❌ FAIL: APP-007 PR 본문에 path 전수 나열 누락 (포괄 표현만 있음).
- ⚠ MINOR: 분석 로깅이 parent filterId로 잘못 전환됨 (child가 정답 — BR-10).

## Cross-Cutting Criteria

### Regression Guard
- 기존 `POST /filters/:filterId/gen` 동작 변경 0.
- 기존 fal.ai callback 경로 처리 (decompRole이 null인 Content) 변경 0.
- 기존 MemeCollection 폴링 로직 변경 0.

### Code Quality
- KB pattern `completeness-009` (Dead hook): 신규 use case 훅이 callsite 없는지 grep.
- KB pattern `correctness-005`: list-response helper 변경 시 reference 파일 경로 명시.

### Active Evaluation Tactics
- BE 검증 순서를 단위 테스트 코드만이 아니라 **실제 controller → service 호출 trace로 verify** (정적 검사 금지).
- callback 분기는 Content fixture 3종(`null`/`'i2i'`/`'i2v'`)으로 매 분기 이동 확인.
- list 필터링은 `isHidden: true` Content를 직접 DB에 시드한 통합 테스트로 검증.

## Phase 3-Specific (Prototype phase)
> 이번 sprint는 여기까지만 평가.

- Design Engineer가 생성한 HTML prototype 5개 화면이 task spec의 `Screens / Components` 섹션을 정확히 반영.
- Token mapping이 `docs/designs/foundations/` (또는 `wds-tokens`) 에 존재.
- AC 2.1.x ~ 2.2.x의 가시적 부분이 prototype에서 시뮬레이션 가능 (state toggle/overlay).
- PRD §4 Business Rules 중 시각적 영향 (BR-6 워터마크 미적용, BR-1 가격 표시) 정확히 반영.
