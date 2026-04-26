# Phase 2 Checkpoint — preview-feature

## Status: ✓ Complete (2026-04-26)

## Tasks
| ID | Type | Target | Group |
|----|------|--------|-------|
| be-001 | backend | Filter+Content schema 신규 필드 (hasDecompPreview, decompRole, parentFilterId, isHidden, sourcePreviewContentId) | 001 |
| be-002 | backend | i2i child 등록 시 parent.hasDecompPreview 자동 세팅 (BR-8) | 001 |
| be-003 | backend | POST /filters/:filterId/preview (i2i 시작) | 002 |
| be-004 | backend | POST /preview-contents/:contentId/proceed (i2v 전환) | 003 |
| be-005 | backend | POST /preview-contents/:contentId/cancel (abandon) | 002 |
| be-006 | backend | fal.ai callback dispatch by decompRole (i2i: S3/썸네일/워터마크 스킵) | 002 |
| be-007 | backend | Refund policy (i2i 전액, i2v 부분) | 003 |
| be-008 | backend | Content list isHidden 필터 (전 user-facing 쿼리) | 003 |
| be-009 | backend | Slot management (i2i / i2v / cancel / callback) | 002 |
| app-001 | app | FilterPreview Footer dual-CTA | 001 |
| app-002 | app | PreviewBottomSheet (이미지 첨부 + 미리보기 CTA) | 002 |
| app-003 | app | PreviewLoadingScreen + Cancel Dialog | 002 |
| app-004 | app | PreviewResultScreen + Cancel Dialog | 003 |
| app-005 | app | Credit Insufficient & Harmful Image Sheets | 002 |
| app-006 | app | i2v Transition (proceed → MemeCollection) | 003 |
| app-007 | app | parentFilterId Navigation Refactor | 003 |
| app-008 | app | Deep Link Routes for Preview screens | 003 |

## API Endpoints
| Method | Path | Related Tasks |
|--------|------|---------------|
| POST | /filters/{filterId}/preview | be-003, app-002 |
| POST | /preview-contents/{contentId}/proceed | be-004, app-006 |
| POST | /preview-contents/{contentId}/cancel | be-005, app-003, app-004 |
| POST | /filters/callback/fal-ai (existing — extended) | be-006 |
| GET | /filters/contents (existing — filter added) | be-008 |

## Key Decisions
- **3 신규 endpoint 명명**: parent filter 진입은 `/filters/:filterId/preview`, 이후 단계는 `/preview-contents/:contentId/{proceed,cancel}` (PRD §5 ALWAYS "preview 전용 엔드포인트 3개").
- **previewCredit = 100** — `apps/meme-api/src/common/constant/`에 새 상수, ASK 항목 (Unleash 승격 시점은 PM 결정).
- **i2v Content 식별**: `parentFilterId` (workflow filter) + `sourcePreviewContentId` (i2i preview) — 양방향 추적 가능.
- **App 화면 5개 신규/변경**: FilterPreview footer, PreviewBottomSheet, PreviewLoadingScreen, PreviewResultScreen, HarmfulImageSheet. CreditInsufficientSheet는 기존 재사용.
- **딥링크 2개 신규**: zzem://preview/loading, zzem://preview/result (Maestro 제약 대응 — APP-008).
- **e2e 전략**: 6 New + 4 Extend + 2 Covered + 8 Deferred (BE-only/native-dialog/server-injection-required/time-warp/multi-device).

## KB Lessons Adopted (Reflexion-style)
- ✅ ugc-platform-002 "prior-group lessons 선제 적용" → group plan을 evaluation criteria에 명시.
- ✅ ugc-platform-003 "DTO 확장 조항에 파일 경로+필드명 구체 명시" → BE-001 task spec에 4+4 필드 표로 명시.
- ✅ pattern completeness-008 (semantic-breaking fallback) → BE-001 AC에 grep gate 명시.
- ✅ pattern completeness-010 (포괄 표현 → 전수 path) → BE-008, APP-007 AC에 path 전수 나열 요구.
- ✅ pattern completeness-009 (dead hook) → evaluation criteria에 callsite grep 추가.

## Group Plan
- **Group 001**: be-001, be-002, app-001 — Schema + flag plumbing + dual-CTA UI.
- **Group 002**: be-003, be-005, be-006, be-009, app-002, app-003, app-005 — Preview start + loading + cancel + error sheets.
- **Group 003**: be-004, be-007, be-008, app-004, app-006, app-007, app-008 — Result screen + i2v transition + isolation + nav.

## Phase 3 Inputs (next)
- Prototype 대상 5 화면 (app tasks 001-005에 `Screens / Components` 섹션 존재).
- task 006/007/008은 비주얼 변경 적거나 없음 → prototype 생략.
- Design Engineer가 frozen snapshot (DESIGN.md + component patterns + KB design 패턴) 인라인으로 받아 screen-spec → HTML 생성.

## Gate Self-Check (Phase 2 → Phase 3)
- [x] `api-contract.yaml` 존재 + OpenAPI 3.0 유효.
- [x] 모든 태스크 파일에 Target/Context/Objective/Specification/AC 존재.
- [x] 태스크 번호 순환 의존성 없음 (be-001 → be-002, be-003 → be-005/006/009 → be-004 → be-007).
- [x] 각 AC가 testable (모호한 표현 회피).
- [x] BE/App이 동일 endpoint 참조.
- [x] `contracts/e2e-flow-plan.md` 생성, 모든 AC 분류 완료.
- [x] App 태스크 5개 (001~005)에 `Screens / Components` 섹션 존재 → Phase 3 진행.
