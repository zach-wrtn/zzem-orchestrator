# APP-003 — PreviewLoadingScreen + Cancel Dialog

## Target
- `apps/MemeApp/src/presentation/meme/preview-loading.screen.tsx` (신규 — full-screen)
- `apps/MemeApp/src/presentation/meme/components/preview-cancel-dialog.tsx` (신규)
- 재사용: `apps/MemeApp/src/presentation/meme/components/collection/zzem-loading.tsx`
- `apps/MemeApp/src/shared/routes/meme-routes.ts` (deep link 경로 — APP-008과 연계)

## Context
i2i preview API 호출 직후 sheet가 닫히고 전체 화면 로딩 뷰로 전환된다. fal.ai i2i가
완료될 때까지 진행률 표시 없이 spinner + 라벨로 대기. 유저는 X로 이탈 가능 (확인
다이얼로그 + 환불 없음).

## Objective
- i2i preview 진행 상태를 fullscreen으로 표시.
- 콜백 도착(또는 polling/소켓)으로 `Content.status === DONE`이 되면 PreviewResultScreen
  (APP-004)로 자동 전환 (replace navigation).
- X 탭 → confirm dialog. [나가기] 선택 시 `POST /preview-contents/:id/cancel` 호출 +
  FilterPreview로 복귀. 환불 없음.

## Specification

### Screen
- 진입: route param `{ contentId, parentFilterId }`.
- 구성:
  - 좌상단 X 버튼 (icon-button).
  - 중앙 ZzemLoading spinner.
  - spinner 아래 라벨: "미리보기 만드는중...".
- 폴링/구독:
  - 기존 active-generations 폴링 (`useActiveGenerationsPollingUseCase`)을 재사용하되
    preview Content는 isHidden=true이므로 별도 단일 Content 폴링이 필요할 수 있음.
    제안: `GET /filters/contents/{contentId}` 단일 조회를 N초 간격으로 (3s 기본).
  - `Content.status === DONE` → APP-004로 navigate.replace.
  - `Content.status === FAILED` → 토스트 + FilterPreview로 복귀 (BE-007 환불은 자동).

### Cancel Dialog
- 좌상단 X 탭 → modal dialog open.
- title: "지금 나가면 작업이 취소되고, 사용한 크레딧은 환불되지 않아요. 정말 나가시겠어요?"
- buttons: `[취소]` (secondary, close dialog), `[나가기]` (primary destructive).
- [나가기] → `POST /preview-contents/{contentId}/cancel` → FilterPreview로 navigate.replace.

### TestIDs
```
meme.previewLoading.screen
meme.previewLoading.closeButton
meme.previewLoading.spinner
meme.previewLoading.label
meme.previewLoading.cancelDialog
meme.previewLoading.cancelDialogConfirm
meme.previewLoading.cancelDialogCancel
```

## Acceptance Criteria — maps to AC 2.1.8, 2.1.9
- [ ] (AC 2.1.8) sheet close 직후 full-screen 로딩 뷰 노출 (X + spinner + "미리보기 만드는중...").
- [ ] (AC 2.1.9) X 탭 → 확인 dialog 노출 (위 카피 정확히).
- [ ] (AC 2.1.9) [나가기] 탭 → cancel API 호출 + FilterPreview로 복귀.
- [ ] [취소] 탭 → dialog close + 로딩 유지.
- [ ] `Content.status === DONE` 시 PreviewResultScreen으로 자동 전환 (replace).
- [ ] `Content.status === FAILED` 시 FilterPreview로 복귀 + 토스트.

## Screens / Components

### Screen: PreviewLoadingScreen
- screen_archetype: `detail`
- detail_state: `unavailable` (콘텐츠 생성 중 — interactivity 제한)

### Components
- CloseButton (icon-button) — 좌상단
- LoadingSpinner (ZzemLoading 재사용)
- LoadingLabel (text)

### Modal: CancelDialog
- screen_archetype: `modal`
- modal_subtype: `dialog`
- 2 CTA: 취소 (secondary), 나가기 (primary)

### Layout
- viewport 390x844
- background full-screen, content centered vertically.
