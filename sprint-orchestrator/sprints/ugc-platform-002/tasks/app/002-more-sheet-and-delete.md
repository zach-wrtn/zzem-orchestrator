# app-002 · 더보기 메뉴 + 삭제 확인 (AC 1.7 bottomsheet)

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: app-001 (더보기 트리거 버튼)

## Target

`app/apps/MemeApp/src/presentation/swipe-feed/components/swipe-feed-more-sheet.tsx`
`app/apps/MemeApp/src/shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx` (재사용)
`app/apps/MemeApp/src/domain/meme/` (삭제 useCase — 기존 또는 신규)

## Context

세로 스와이프 "더보기 (···)" 탭 시 바텀시트 메뉴 노출. 메뉴는 **콘텐츠 소유자 분기**:
- **내 콘텐츠**: 다운로드 / 의견 보내기 / 삭제 (3개)
- **타 유저 콘텐츠**: 다운로드 / 의견 보내기 / 신고하기 (3개) — **신고하기는 Phase 3 소관** 이므로 본 스프린트에서는 **UI 만 노출 + 탭 시 "준비 중" 안내** (or 탭 자체를 숨김 — PRD 재확인 필요, 기본은 placeholder 보임)

삭제 선택 → 삭제 확인 팝업 → 확정 시 BE DELETE endpoint 호출 후 피드에서 제거.
삭제는 **세로 스와이프 더보기에서만** 가능. 프로필 그리드에서는 불가 (AC 1.7 마지막 bullet).

## Objective

ActionSheet 기반 더보기 메뉴 구현. 내/타 소유 분기. 삭제 시 confirm sheet → DELETE API → 리스트 업데이트 (React Query invalidate).

## Specification

### Sheet Structure
- 트리거: app-001 의 더보기 버튼.
- Context: `SwipeFeedMoreSheetProvider` 내 ref 패턴 유지 (기존 구조).
- 메뉴 아이템은 **소유자 판정** (`item.ownerId === myUserId`) 로 분기.

### 메뉴 — 내 콘텐츠
1. **다운로드** — 기존 훅 재사용 (없으면 Phase 2 scope 외, 단순 placeholder 로 토스트).
2. **의견 보내기** — `navigation.navigate('Feedback', { ... })` (기존 Feedback 화면 재사용).
3. **삭제** — 색상: error/red. 탭 시 `BottomConfirmSheet` 호출.

### 메뉴 — 타 유저 콘텐츠
1. **다운로드** — 동일.
2. **의견 보내기** — 동일.
3. **신고하기** — Phase 3 소관. 본 스프린트:
   - 기본: UI 에 메뉴 항목 노출, 탭 시 Toast `"곧 제공될 예정이에요"` 류.
   - Prototype 에서 최종 확정 (메뉴 노출 vs 숨김).

### 삭제 확인 팝업
- `BottomConfirmSheet` 재사용.
- Title: `"콘텐츠를 삭제할까요?"`
- Description: `"삭제한 콘텐츠는 복구할 수 없어요."`
- Direction: horizontal (취소 + 삭제 병렬).
- confirmAction: `{ preset: 'destructive', label: '삭제', onPress: handleDelete }`.
- cancelAction: `{ label: '취소', onPress: close }`.

### Delete API
- BE 기존 엔드포인트 사용:
  - Filter content: `DELETE /v2/contents?type=filter` (body: `{ contentIds: [id] }`).
  - Custom-prompt: `DELETE /v2/custom-prompt-contents/:contentId`.
- contentType 분기는 `item.isCustomPrompt` 기반.
- 성공 시:
  - React Query invalidate: `meme feed`, `me contents`, `counts` 등 관련 쿼리 키.
  - Toast: `"삭제됐어요"`.
  - 피드에서 아이템 제거 (invalidate 에 의해 자동, or 클라이언트 optimistic remove).
- 실패 시: Toast error + sheet 유지.

### UseCase
- `useDeleteMyContentUseCase()` 신설. contentId + contentType → 분기된 DELETE 호출.
- Mutation hook. onSuccess 에서 React Query cache 업데이트.

### 이미 구현 확인
- 기존 `useSwipeFeedMoreSheet` 훅 + Provider 재사용.
- 기존 메뉴 아이템 (feedback/report) 구조 연장.

### Out of Scope
- 실제 신고 기능 (Phase 3).
- 프로필 그리드에서의 삭제 (의도적 제외).
- 다운로드 기능 고도화 (기존 동작 유지).

## Acceptance Criteria

- [ ] 더보기 탭 시 소유자 분기된 3개 메뉴 노출 (내 vs 타 소유).
- [ ] 내 콘텐츠: 다운로드 / 의견 보내기 / 삭제 순서.
- [ ] 타 유저 콘텐츠: 다운로드 / 의견 보내기 / 신고하기 순서.
- [ ] 삭제 탭 → BottomConfirmSheet 노출.
- [ ] 삭제 확정 → DELETE API 호출 → Toast + 피드 리스트 업데이트.
- [ ] contentType 분기 (filter vs custom-prompt) 정상 동작.
- [ ] 신고하기 탭 → Toast `"곧 제공될 예정이에요"` (or 프로토타입 확정 UX).
- [ ] 의견 보내기 → 기존 Feedback 화면 진입 (기능 회귀 없음).
- [ ] 삭제 시 내 프로필 `counts` 응답 값 감소 (invalidate 확인).
- [ ] e2e: `swipe-feed-more-delete-my.yaml` 신규 — `assertVisible` 수준까지만 (실제 DELETE 는 Evaluator 코드 추적으로 대체 가능 — CTA 검증 타협).
- [ ] typescript clean (`grep -v '@wrtn/'`).

## Screens / Components

- **SwipeFeedMoreSheet** (BottomSheet) — 소유자 분기 3메뉴:
  - Me variant: `MenuItem(Download)` + `MenuItem(Feedback)` + `MenuItem(Delete, destructive red)`
  - Other variant: `MenuItem(Download)` + `MenuItem(Feedback)` + `MenuItem(Report, Phase 3 placeholder)`
- **DeleteConfirmSheet** (BottomConfirmSheet) — horizontal 2 button (취소 + 삭제).
  - Title: "콘텐츠를 삭제할까요?"
  - Description: "삭제한 콘텐츠는 복구할 수 없어요."
- States: default(me) / default(other) / delete-confirm / report-placeholder-toast

## Implementation Hints

- `SwipeFeedMoreSheetProvider` 는 Provider + ref 패턴 (기존). 메뉴 config 객체를 prop 또는 context 로 주입.
- `BottomConfirmSheet` 호출부 예시: `swipe-feed-footer.tsx` 의 이미지 가이드 확인 패턴.
- Delete cache invalidation: QueryKey 통일 (`meme.query-key.ts` 상수).
- Toast: `Toast.show(...)` 기존 패턴.
- 신고하기 Phase 3 placeholder UX 는 **Prototype 단계에서 확정** 후 screen-spec 반영.
