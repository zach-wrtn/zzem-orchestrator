# APP-004 — PreviewResultScreen + Result Cancel Dialog

## Target
- `apps/MemeApp/src/presentation/meme/preview-result.screen.tsx` (신규 — full-screen)
- `apps/MemeApp/src/presentation/meme/components/preview-result-cancel-dialog.tsx` (신규)

## Context
i2i 생성 완료 후 결과 이미지를 9:16 비율로 전체 화면에 표시. 하단 CTA로 i2v 생성을
유도 (APP-006와 연계). X로 이탈 가능 (이 결과 다시 볼 수 없음 다이얼로그).

## Objective
- preview Content의 fal.ai CDN URL을 9:16으로 표시 (워터마크 미적용).
- 하단 sticky CTA: `[이 이미지로 만들기 🪙{총액 - previewCredit}]` → APP-006 트리거.
- 좌상단 X 탭 → confirm dialog → 닫기 시 결과 소실 (서버 상태는 그대로).

## Specification

### Screen
- 진입: route param `{ contentId }` — preview Content (DONE).
- Image: full-screen 9:16, source = `falCdnUrl`. 워터마크 layer 없음 (BR-6).
- 좌상단 X 버튼 (overlay).
- 하단 sticky CTA: label `이 이미지로 만들기 🪙{i2vCredit}` (= `parent.requiredCredit - previewCredit`).
- CTA 탭 → `POST /preview-contents/{contentId}/proceed` (APP-006).

### Cancel Dialog
- title: "지금 나가면 이 결과를 다시 볼 수 없어요"
- buttons: `[취소]`, `[나가기]`.
- [나가기] → `POST /preview-contents/{contentId}/cancel` (선택적 — 서버는 abandoned 상태로 마킹) → FilterPreview로 navigate.replace.

### Image lifecycle
- fal.ai CDN URL 만료 가능성 — 결과 화면 진입 시 즉시 사용 (BR-7). 만료 시 i2v 호출이 실패 가능 → 기존 에러 핸들링.

### TestIDs
```
meme.previewResult.screen
meme.previewResult.image
meme.previewResult.closeButton
meme.previewResult.proceedCta
meme.previewResult.cancelDialog
meme.previewResult.cancelDialogConfirm
meme.previewResult.cancelDialogCancel
```

## Acceptance Criteria — maps to AC 2.1.10, 2.1.11
- [ ] (AC 2.1.10) 결과 이미지가 전체 화면 9:16으로 표시되며 워터마크가 적용되지 않는다.
- [ ] (AC 2.1.10) 하단에 `[이 이미지로 만들기 🪙{총액 - previewCredit}]` 버튼 노출.
- [ ] (AC 2.1.11) X 탭 → 확인 dialog 노출 (위 카피 정확히). [나가기] 시 FilterPreview로 복귀.
- [ ] [취소] 탭 → dialog close + 결과 화면 유지.

## Screens / Components

### Screen: PreviewResultScreen
- screen_archetype: `detail`
- detail_state: `normal`
- hero: full-screen image (9:16)
- bottom-action: sticky CTA

### Components
- ResultImage (image, 9:16, full-bleed)
- CloseButton (icon-button, overlay top-left)
- ProceedCTA (button-primary, sticky-bottom)

### Modal: CancelDialog
- modal_subtype: `dialog`
- 2 CTA

### Token Map
- image_background: `semantic.background.normal` (이미지 로드 전 배경)
- close_button_overlay: `component.icon-button.overlay.fill` (반투명)
- cta_fill: `component.button.primary.fill`
