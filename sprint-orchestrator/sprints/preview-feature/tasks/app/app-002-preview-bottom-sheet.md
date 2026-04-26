# APP-002 — PreviewBottomSheet (이미지 첨부 → 미리보기 실행)

## Target
- `apps/MemeApp/src/presentation/meme/components/preview-bottom-sheet.tsx` (신규)
- `apps/MemeApp/src/presentation/meme/use-preview.hook.ts` (or 동등 use case 훅)
- 기존 image-picker / image-attach 컴포넌트 재사용 (1장 제한)

## Context
[미리보기] 버튼(APP-001) 탭 시 노출되는 bottom sheet. 소구 텍스트 + [+] 이미지 첨부 +
[미리보기 🪙100] 버튼.

## Objective
이미지 1장 선택 → `[미리보기 🪙100]` 활성화 → 탭 시 `POST /filters/:filterId/preview`
호출 (실 검증/차감은 BE-003에서 처리). 응답 후 sheet close → APP-003 Loading으로 전환.

## Specification

### Layout
- `@gorhom/bottom-sheet` `enableDynamicSizing` + `enablePanDownToClose`.
- 영역:
  1. **Title/소구 텍스트** — "결과물 미리보기" + 부연 설명.
  2. **이미지 첨부 영역** — empty 상태 [+], selected 상태 thumbnail + X.
  3. **CTA** — `[미리보기 🪙100]` (initially disabled).

### State machine (sheet 내부)
- `ImageEmpty` → 이미지 선택 → `ImageSelected`.
- `ImageSelected` → X 탭 → `ImageEmpty`.

### Image picker
- 기존 단일-이미지 picker 재사용 (1장 제한).
- ImageGuidance 시트는 노출하지 않는다 (PRD AC 2.1.3 명시).

### CTA disabled 조건
- 이미지 미선택 시 disabled.
- 이미지 선택 시 enabled.
- 탭 시 in-flight (loading state) 표시 후 응답까지 buttons 비활성.

### API call
- request: `POST /filters/{parentFilterId}/preview` body `{ imageUrl }`.
- error 응답:
  - 402 `INSUFFICIENT_CREDIT` → close sheet + open CreditInsufficientSheet (APP-005).
  - 422 `HARMFUL_IMAGE` → close sheet + open HarmfulImageSheet (APP-005). "다른 사진 선택하기" 탭 시 본 sheet 다시 open (image empty 상태로).
  - 429 `SLOT_EXHAUSTED` → 기존 429 토스트/다이얼로그 패턴 재사용.
- 200 응답 → close sheet + navigate to PreviewLoadingScreen (APP-003) with `contentId`.

### TestIDs
```
meme.previewSheet.sheet
meme.previewSheet.imagePickerEmpty
meme.previewSheet.imagePickerSelected
meme.previewSheet.imageRemoveButton
meme.previewSheet.previewCta
```

## Acceptance Criteria — maps to AC 2.1.2, 2.1.3, 2.1.4
- [ ] (AC 2.1.2) [미리보기] 탭 → "결과물 미리보기" sheet open + 이미지 첨부 UI + [미리보기 🪙100] disabled 노출.
- [ ] (AC 2.1.3) [+] 탭 → image picker (1장 제한) → 선택 후 thumbnail 표시 + X로 제거 가능. ImageGuidance 시트 비노출.
- [ ] (AC 2.1.4) 이미지 미선택 시 [미리보기 🪙100] disabled. 선택 시 enabled.
- [ ] sheet 외부 탭/스와이프 → close (image 상태 reset).

## Screens / Components

### Screen: PreviewBottomSheet
- screen_archetype: `modal`
- modal_subtype: `sheet`

### Components
- TitleText (소구 텍스트)
- DescriptionText
- ImageAttachZone (empty / selected variant)
  - states: default, selected, hover (none on RN), disabled
- PreviewCTAButton (button-primary, label: "미리보기 🪙100")

### Token Map
- background: `semantic.background.elevated.alternative`
- title: `semantic.label.normal`
- description: `semantic.label.alternative`
- image_zone_dashed: `semantic.line.normal` (border dashed)
- cta_disabled: `component.button.primary.disabled.*`
