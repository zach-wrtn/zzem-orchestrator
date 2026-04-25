# Phase 2 Checkpoint: ugc-platform-integration-qa-2

> **모드**: v2 prototype pipeline (PR #29-#36) live dogfood. Phase 2 는
> **lightweight spec** — 23 app task + 0 backend task. BE OUT OF SCOPE per PRD
> (모든 endpoint Mock). e2e flow 작성 Deferred (별 sprint).

## Tasks (23 app + 0 backend)

| ID | Type | Target | Group |
|----|------|--------|-------|
| app-001 | app | 프로필편집_메인 (form 진입) | 001 |
| app-002 | app | 프로필편집_닉네임_저장가능 (form 활성) | 001 |
| app-003 | app | 프로필편집_닉네임_바텀시트_나가기확인 (modal confirm) | 001 |
| app-004 | app | 프로필편집_닉네임_키보드 (form focus + 키보드) | 001 |
| app-005 | app | 프로필편집_사진_바텀시트_선택 (modal — 라이브러리/삭제) | 001 |
| app-006 | app | 프로필편집_사진_저장가능 (form 활성) | 001 |
| app-007 | app | 프로필편집_사진_바텀시트_나가기확인 (modal confirm) | 001 |
| app-008 | app | 프로필편집_사진_크롭 (form 크롭 UI) | 001 |
| app-009 | app | 프로필편집_사진_앨범선택 (form 앨범 picker) | 001 |
| app-010 | app | MY_프로필_사진변경완료 (detail + toast) | 001 |
| app-011 | app | MY_프로필_닉네임변경완료 (detail + toast) | 001 |
| app-012 | app | 타유저_더보기메뉴 (modal — 차단 진입) | 002 |
| app-013 | app | 타유저_차단확인_바텀시트 (modal confirm + 안내 row × 3) | 002 |
| app-014 | app | 타유저_프로필_차단됨 (detail — 콘텐츠 숨김) | 002 |
| app-015 | app | 타유저_차단됨_더보기메뉴 (modal — 차단 해제 진입) | 002 |
| app-016 | app | 타유저_프로필_차단해제후 (detail + toast) | 002 |
| app-017 | app | 차단관리_리스트 (feed — exemplar 인라인 첫 활용) | 002 |
| app-018 | app | 차단관리_바텀시트_해제확인 (modal confirm) | 002 |
| app-019 | app | 차단관리_해제완료 (detail + toast) | 002 |
| app-020 | app | 알림센터_기본 (feed — exemplar 인라인 첫 활용) | 003 |
| app-021 | app | 알림센터_노데이터 (empty_state — 첫 persona 검증) | 003 |
| app-022 | app | 알림설정_토글 (form — 즉시 저장 패턴 충돌 dogfood) | 003 |
| app-023 | app | 설정 / 설정_메인메뉴 (form-ish — nav glue P2) | 004 |

## API Endpoints (Mock)

| Method | Path | Mock | Related Tasks |
|--------|------|:---:|---------------|
| PATCH | /v2/me/profile | ✓ | app-001, app-002, app-006, app-010, app-011 |
| POST | /v2/me/avatar/presigned-url | ✓ | app-005, app-006, app-008, app-009 |
| POST | /v2/users/{userId}/block | ✓ | app-012, app-013, app-014 |
| DELETE | /v2/users/{userId}/block | ✓ | app-015, app-016, app-018, app-019 |
| GET | /v2/me/blocked-users | ✓ | app-017, app-018 |
| GET | /v2/me/notifications | ✓ | app-020, app-021 |
| PATCH | /v2/me/notification-settings | ✓ | app-022 |

> 모든 endpoint `x-mock: true` flag. FE 는 Phase 3 dogfood 동안 mock layer
> (MSW / static fixtures) 로 해결. 실 BE 구현은 별 backend sprint.

## Key Decisions

- **BE OUT OF SCOPE**: PRD § "OUT OF SCOPE 4" 에 따라 차단/알림 설정 API 신규
  구현은 본 스프린트 외. api-contract.yaml 은 FE 가 hit 할 mock surface 의 SSOT
  로만 작성, 모든 endpoint `x-mock: true` flag.
- **Backend tasks 0개**: `tasks/backend/` 는 `.gitkeep` 만 유지. Generator 가
  backend 분기를 호출하지 않도록 Phase 2 산출물 범위 명시.
- **e2e flow Deferred**: 본 스프린트는 prototype-only. AC 1.1-3.4 모두
  `Deferred` (reason: `prototype-only-sprint`) 로 분류. 후속 e2e 스프린트에서
  prototype 결과를 baseline 으로 신규 flow 작성.
- **v2 dogfood scope 강조**: 23 화면 = 5 archetype (form / modal / feed /
  detail / empty_state) 노출 — Pass 6 (10 checks) + Assumption Preview Gate
  + Asset Layer + Archetype Persona + Variants Mode (조건부) + Curated
  Exemplars (feed 자동 인라인) 의 첫 라이브 측정.
- **Exemplar 첫 인라인 후보**: app-017 차단관리_리스트 + app-020 알림센터_기본
  (둘 다 feed). 두 화면 모두 exemplar drift warning (Pass 6 #10) 발생 가능 —
  Sprint Lead 가 차별화 결정.
- **Archetype 충돌 케이스**: app-022 알림설정_토글 은 form persona 강제 룰 #2
  (별도 저장 버튼) 와 즉시 저장 패턴 충돌 — `archetype_recommendation_skipped`
  사유 기록 후 진행.
- **fabrication_risk medium 후보**: app-005 사진 시트, app-008 크롭, app-009
  앨범, app-014 차단됨 상태 등. medium 트리거 시 `intent.md` 산출 + Variants
  Mode 1 화면 이상에서 활성 (정책 수립용 표본).

## Group Plan

- **Group 001 — 카메라 / 프로필 사진 편집** (P0, 11 화면): app-001 ~ app-011 —
  닉네임/사진 편집 form 진입 → modal confirm → 결과 detail. Archetype mix:
  form × 6 + modal × 3 + detail × 2.
- **Group 002 — 차단 / 차단 관리** (P0, 8 화면): app-012 ~ app-019 — 타유저
  더보기 → confirm → 차단됨 상태 → 차단관리 리스트 → 일괄 해제. Archetype mix:
  modal × 4 + detail × 3 + feed × 1 (exemplar 인라인).
- **Group 003 — 알림** (P1, 3 화면): app-020 ~ app-022 — 알림센터 + empty +
  설정 토글. Archetype mix: feed × 1 + empty_state × 1 + form × 1 (persona
  충돌 dogfood 핵심).
- **Group 004 — Nav glue** (P2 옵션, 1 화면): app-023 — 설정 메인 메뉴 entry
  정합성. Group 002 / 003 완료 후.
