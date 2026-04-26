# Sprint PRD — preview-feature

> **Canonical PRD**: `~/.zzem/kb/products/preview-feature/prd.md`
> (KB mirror — Notion sync. Do not edit here; treat as immutable.)
> Owner: Walter | Status: draft | Last updated: 2026-04-23

## Scope Summary

**Goal**: workflow 필터(i2i+i2v)의 i2i 결과 이미지를 먼저 보여줘서, 유저가 결과물을
확인한 뒤 비디오 생성(i2v)을 결정할 수 있게 한다. 비디오 생성 전환율 ~10% → ~20% 목표.

**Surface**:
- App: FilterPreview 화면(미리보기 버튼) → 바텀시트 → 로딩 → 프리뷰 결과 → i2v
- Backend: preview 전용 엔드포인트 3개 신설, decompRole 기반 콜백 분기, isHidden 필터링

**User Stories** (3개):
- US-1: 유저는 workflow 필터의 결과물을 미리 확인하여 비디오 생성 여부를 결정한다 (AC 2.1.1 ~ 2.1.11)
- US-2: 유저는 프리뷰 결과가 마음에 들면 해당 이미지로 비디오를 생성한다 (AC 2.2.1 ~ 2.2.3)
- US-3: 시스템은 프리뷰 콘텐츠를 기존 플로우와 격리한다 (AC 2.3.1 ~ 2.3.6)

**Acceptance Criteria 총 20개** — Phase 2에서 task 매핑.

## Key Business Rules (canonical 발췌)

- **BR-1 과금**: 총액 = parent.requiredCredit. previewCredit=100, i2v=총액-previewCredit.
- **BR-2 검증 순서**: 크레딧 확인 → Rekognition → 차감 → API 호출 (차감 전 검증 완료).
- **BR-3 환불**: i2i 실패 → previewCredit 전액. i2v 실패 → i2v 크레딧만 (previewCredit 유지).
- **BR-6 워터마크**: i2i 프리뷰는 워터마크 미적용.
- **BR-7 수명**: fal.ai CDN URL 직접 사용, S3 복사 없음, 이탈 시 소멸.
- **BR-12 적용 대상**: workflow 필터(1장 입력)에만, motion-control/character-swap 등 제외.

## 3-Tier Boundary (canonical 발췌)

- **ALWAYS**: preview 전용 엔드포인트 3개 신설, decompRole 분기, 검증 순서 유지, 기존 서비스 재사용.
- **ASK**: isHidden 필터링 영향 범위, MemeViewer parentFilterId 전환 대상, previewCredit Unleash 승격 시점.
- **NEVER**: 기존 gen 엔드포인트 수정, child filter isActive 변경, S3 복사, 워터마크 적용, atomic workflow 변경.

## Out of Scope

Re-roll, multi-candidate, 프리뷰 영구 저장, 단독 i2v 적용, 2장 입력 필터, 자동 재시도, Content Factory 변경.

## State Machine

canonical PRD §3 참조 — FilterPreview → BottomSheet → Validation(Credit/Rekognition) → CreditDeduct → Loading → PreviewResult → VideoGenerating → MemeCollection.

## Sprint Notes

- 사용자 지시: 이번 실행은 **prototype phase까지만** (Phase 1~3). Build/PR/Retro 미실행.
- Base branches: backend=apple (ZZEM 메인 릴리즈), app=main (workflow/필터 epic 의존 없음).
