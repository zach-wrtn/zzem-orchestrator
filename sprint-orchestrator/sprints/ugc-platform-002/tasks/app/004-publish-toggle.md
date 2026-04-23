# app-004 · 게시 토글 + 공개/비공개 시트 + custom-prompt 공개 차단 안내

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: be-001 (visibility toggle API)

## Target

`app/apps/MemeApp/src/presentation/swipe-feed/components/` (하단 CTA 바 확장)
`app/apps/MemeApp/src/shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx` (재사용)
`app/apps/MemeApp/src/domain/me-contents/me-contents.usecase.ts` (UpdateVisibility useCase 신설)
`app/apps/MemeApp/src/data/me-contents/me-contents.repository-impl.ts` (PATCH 호출 구현)

## Context

AC 1.1 신규 공개 기본 정책, AC 1.3 비공개 전환 바텀시트, AC 1.4 custom-prompt 공개 차단, AC 1.8 게시 토글 UX.

현재 세로 스와이프 하단 CTA 바에는 "템플릿 사용하기" 버튼만 존재. 게시 토글은 없음. 내 콘텐츠일 때만 추가로 "게시" 토글을 노출해야 한다. 타유저 콘텐츠에서는 토글 미노출 (AC 1.8).

Custom-prompt 결과물은 현재 **비공개 탭에만 위치**. 세로 스와이프에서 게시 버튼 탭 시 안내 토스트/모달:
`"커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!"` (Phase 2 PRD § AC 1.4 문구)

## Objective

내 콘텐츠 세로 스와이프 하단에 게시 토글 추가. ON→OFF 시 비공개 전환 확인 바텀시트, OFF→ON 시 즉시 공개. Custom-prompt 는 공개 불가 안내 처리.

## Specification

### Toggle 위치
- 세로 스와이프 하단 CTA 바 (현재 "템플릿 사용하기" 버튼과 동일 영역).
- 내 콘텐츠에서만 노출. 타 유저 콘텐츠에서는 미노출 (owner 판정).
- 레이아웃: CTA 버튼 좌측 or 상단 (Prototype 에서 확정).

### Toggle State
- `item.isPublished` 값 기반.
- ON (공개) ↔ OFF (비공개) 토글.

### OFF → ON (공개 전환)
- Custom-prompt (`item.isCustomPrompt === true`):
  - 토글 비활성 상태로 표시 (tap 가능 but feedback).
  - 탭 시 **토스트** `"커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!"`.
  - API 호출 없음.
- 일반 콘텐츠:
  - 즉시 PATCH `/v2/me/contents/:id/visibility` `{ isPublished: true }`.
  - 확인 시트 없음 (즉시 공개).
  - 성공 시 토스트 `"공개됐어요"`, 피드 invalidate, 토글 상태 갱신.
  - 실패 시 Toast error + 토글 원복.

### ON → OFF (비공개 전환)
- `BottomConfirmSheet` 노출:
  - Title: `"콘텐츠를 비공개로 전환할까요?"`
  - Description: `"피드에서 사라지고 나만 볼 수 있어요. 이미 받은 페이백 크레딧은 유지돼요."` (비즈니스 룰 §페이백 6 반영).
  - confirmAction: `{ label: '비공개로 전환', onPress: handleUnpublish }`.
  - cancelAction: `{ label: '취소' }`.
- 확정 시 PATCH `{ isPublished: false }` → 피드 invalidate.

### UseCase / Data
- `useUpdateMeContentVisibilityUseCase()`:
  - Mutation hook. `{ contentId, isPublished }` → PATCH 호출.
  - onSuccess: React Query cache invalidate (me contents, counts, feed).
  - 에러 처리: `CUSTOM_PROMPT_PUBLISH_BLOCKED` (409) 수신 시 Toast 안내 (위와 동일 문구) — defensive fallback.

### Telemetry
- `click_publish_toggle` event: content_id + from_state + to_state.

### Regression Guard
- 타 유저 콘텐츠 화면에서는 토글 미노출 (레이아웃 영향 최소화).
- Phase 1 의 프로필 공유/편집 흐름 회귀 없음.

### Out of Scope
- 비공개 상태 콘텐츠의 그리드 노출 변경 (기존 유지).
- Custom-prompt 편집 CTA 동작 (AC 1.4 마지막 bullet — 최초 생성 화질 기준 크레딧 — scope 외, 별도 backend 로직).

## Acceptance Criteria

- [ ] 내 콘텐츠 세로 스와이프 하단에 "게시" 토글 노출. 타 유저에서는 미노출.
- [ ] 토글 상태가 `item.isPublished` 와 동기화.
- [ ] OFF→ON (일반): 즉시 PATCH + Toast `"공개됐어요"` + invalidate.
- [ ] OFF→ON (custom-prompt): API 호출 없이 토스트 안내 `"커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!"`.
- [ ] ON→OFF: BottomConfirmSheet 노출 → 확정 시 PATCH + Toast.
- [ ] 취소 선택 시 토글 상태 원복 (API 호출 없음).
- [ ] 실패 시 Toast error + 토글 원복.
- [ ] 409 CUSTOM_PROMPT_PUBLISH_BLOCKED 수신 defensive 처리 (토스트 동일 문구).
- [ ] e2e: `swipe-feed-publish-toggle.yaml` 신규 — 토글 UI 노출 + assertVisible 수준. 실제 PATCH 는 Evaluator 추적.
- [ ] `yarn typescript | grep -v '@wrtn/'` 신규 에러 0.

## Screens / Components

- **PublishToggle** (Component, 세로 스와이프 하단 CTA 영역 좌측 or 상단) — iOS-style Switch:
  - visible: 내 콘텐츠 only (isOwn === true)
  - state: ON (isPublished=true) / OFF (isPublished=false) / disabled (custom-prompt)
- **UnpublishConfirmSheet** (BottomConfirmSheet, horizontal 2 button):
  - Title: "콘텐츠를 비공개로 전환할까요?"
  - Description: "피드에서 사라지고 나만 볼 수 있어요. 이미 받은 페이백 크레딧은 유지돼요."
- **CustomPromptBlockToast** (Toast, snack-style):
  - Message: "커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!"
- States: toggle-on / toggle-off / unpublish-confirm / custom-prompt-toast / publish-success-toast

## Implementation Hints

- 토글 UI: 기존 `RegularButton` 또는 `Switch` 컴포넌트 재사용.
- Optimistic update 고려 — 빠른 피드백 위해 mutate 전 state 미리 바꾸기 + 실패 시 rollback.
- `BottomConfirmSheet` 패턴: `swipe-feed-footer.tsx` 이미지 가이드 확인 예시 참조.
- React Query invalidate 키: `meme.query-key.ts` 상수 재사용.
- `item.isCustomPrompt` 는 be-001 응답의 `ContentSummary.isCustomPrompt` 필드. app-001 의 매퍼에서 이미 반영.
