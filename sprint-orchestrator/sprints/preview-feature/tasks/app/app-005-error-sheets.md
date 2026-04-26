# APP-005 — Credit Insufficient & Harmful Image Sheets

## Target
- 기존 credit-insufficient bottom sheet (위치 확인 필요 — 기존 패턴 재사용).
- `apps/MemeApp/src/presentation/meme/components/harmful-image-sheet.tsx` (신규 또는 기존 패턴 재사용).

## Context
PreviewBottomSheet에서 [미리보기 🪙100] 탭 시 BE-003가 402/422를 응답. 두 케이스에
대한 사용자 안내 sheet를 노출.

## Objective
- 402 `INSUFFICIENT_CREDIT` → 기존 "크레딧이 다 떨어졌어요" sheet 재사용 (변경 없음).
- 422 `HARMFUL_IMAGE` → "적절하지 않은 이미지를 감지했어요" sheet (신규 또는 기존
  패턴 재사용). "다른 사진 선택하기" 탭 시 PreviewBottomSheet 다시 open + image empty 상태로 복귀.

## Specification

### CreditInsufficientSheet
- 기존 component 재사용 — 호출 트리거만 추가. UI 변경 없음.

### HarmfulImageSheet
- title: "적절하지 않은 이미지를 감지했어요"
- description: "다른 이미지를 선택해주세요" (또는 동등한 안내)
- CTA: `[다른 사진 선택하기]` (button-primary).
- CTA 탭 → close sheet + PreviewBottomSheet open (image empty 상태).

### TestIDs
```
meme.harmfulImageSheet.sheet
meme.harmfulImageSheet.title
meme.harmfulImageSheet.description
meme.harmfulImageSheet.retryCta
```

## Acceptance Criteria — maps to AC 2.1.6, 2.1.7
- [ ] (AC 2.1.6) 402 응답 → 기존 크레딧 부족 sheet 노출.
- [ ] (AC 2.1.7) 422 응답 → "적절하지 않은 이미지를 감지했어요" sheet 노출.
- [ ] (AC 2.1.7) [다른 사진 선택하기] 탭 → PreviewBottomSheet open (image empty).

## Screens / Components

### Sheet: HarmfulImageSheet
- screen_archetype: `modal`
- modal_subtype: `sheet`

### Components
- TitleText (label.normal)
- DescriptionText (label.alternative)
- RetryCTA (button-primary)
