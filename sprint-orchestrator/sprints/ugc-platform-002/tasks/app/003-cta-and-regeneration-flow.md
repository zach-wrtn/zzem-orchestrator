# app-003 · CTA 분기 + 재생성 플로우 (AC 1.5, 1.6)

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: be-002 (sourceContentId 파라미터 지원)

## Target

`app/apps/MemeApp/src/presentation/swipe-feed/components/`:
- `swipe-feed-cta-button.tsx`
- `swipe-feed-footer.tsx`
`app/apps/MemeApp/src/domain/meme/meme.usecase.ts` (useGenerateMemeUseCase 확장)
`app/apps/MemeApp/src/shared/routes/` (필요 시 라우팅 파라미터)

## Context

현재 세로 스와이프 하단 CTA 는 `"템플릿 사용하기"` 고정 문구 + 크레딧 아이콘. 콘텐츠 소유자 비교 로직 없음. PRD AC 1.5 는:
- **타 콘텐츠**: "템플릿 사용하기" — 해당 필터/프리셋으로 새 콘텐츠 생성 (이미지 업로드 화면 경유).
- **내 콘텐츠**: "다시 생성하기" — 동일 필터로 재생성 (프리뷰 없이, MIXED 예외).

AC 1.6:
- 재생성/템플릿 사용하기 모두 이미지 선택 화면 진입. 단 MIXED (`MIXED_IMAGE_TO_VIDEO`, `MIXED_IMAGE_TO_IMAGE`) 은 프리뷰 경유 (기존 흐름).
- 원본 필터가 삭제된 경우 → 모달 `"원본 게시글이 사라져서 다시 만들 수 없어요"` 노출 → 취소 시 피드 유지.

페이백 조건 (AC 1.2, 4.1) 을 위해 재생성 요청에 **`sourceContentId` 를 BE 로 전달** 해야 한다. "템플릿 사용하기" 는 타인 콘텐츠의 id 를 source 로, "다시 생성하기" 는 본인 콘텐츠 (self-regeneration 이라 BE 에서 페이백 제외) id 를 source 로 전송.

## Objective

CTA 버튼 텍스트를 소유자에 따라 분기 + 재생성 플로우 진입 시 `sourceContentId` 를 생성 요청에 포함.

## Specification

### Button Text 분기
- Props: `item.ownerId`, `currentUserId`.
- `ownerId === currentUserId` → 버튼 라벨 `"다시 생성하기"`.
- 그 외 → `"템플릿 사용하기"`.
- 크레딧 표시는 유지 (기존).

### Navigation
- 탭 시 기존 `handleCta()` 흐름 재사용 (이미지 선택 → ImageCropper → FilterPreview or 직접 생성).
- 차이점:
  - FilterPreview / CreateContent 경로 진입 시, **navigation params 에 `sourceContentId: item.id` 추가** (route.types.ts 확장 필요).
  - `useGenerateMemeUseCase()` 최종 API 호출 시 `sourceContentId` body 에 포함.

### MIXED 필터 분기
- `item.filterType` 검사. `MIXED_IMAGE_TO_VIDEO`, `MIXED_IMAGE_TO_IMAGE` → **프리뷰 경유** (기존 동작 유지).
- 그 외 일반 필터 → 프리뷰 없이 필터 생성 화면 직진입 (기존 동작).

### 삭제된 필터 에러 모달
- `handleCta()` 시작 지점에서 filter 유효성 체크:
  - 기존 필터 조회 훅 (`useGetFilterByIdUseCase` 등) 결과가 404/삭제 상태 → 모달 노출.
- `BottomConfirmSheet` or alert modal:
  - Title: `"원본 게시글이 사라져서 다시 만들 수 없어요"`
  - Action: `"확인"` (단일 버튼).
- 모달 닫은 후 피드 유지 (네비게이션 없음).

### Route Params
- 관련 route types 에 `sourceContentId?: string` 추가:
  - `FilterPreview` route (기존).
  - 필터 생성 진입 route (기존).
- 호출부 전수 점검 (rubric C7 v3): 모든 `navigation.navigate('FilterPreview', ...)` / navigate to create flow 호출부에서 sourceContentId 전달 여부 확인.
- Legacy 경로 (홈에서 필터 직접 선택) 에서는 `sourceContentId` **미전달** (undefined) — 페이백 대상 아님.

### BE API 호출 시
- 생성 요청 body 에 `sourceContentId: string | undefined` 포함.
- BE 에서 `SOURCE_CONTENT_NOT_PUBLIC` / `SOURCE_CONTENT_DELETED` 에러 수신 시 FE 토스트 적절히 처리:
  - `SOURCE_CONTENT_DELETED`: 피드에서 해당 아이템 invalidate + 모달 (삭제된 필터 에러 모달과 유사).
  - `SOURCE_CONTENT_NOT_PUBLIC`: 희귀 케이스 (원본 비공개 전환 타이밍). 토스트 `"이 콘텐츠는 이제 비공개예요"` + 피드 invalidate.

### Regression Guard
- 기존 legacy 경로 (홈 필터 직선택 → 생성) 동작 변화 없음 (`sourceContentId` 미전달).
- Phase 1 `profile-to-swipe-feed.yaml` flow 통과.

### Out of Scope
- 실제 페이백 처리 (be-003).
- 공유 / 좋아요 로직.

## Acceptance Criteria

- [ ] CTA 버튼 텍스트가 소유자에 따라 분기 (`"다시 생성하기"` vs `"템플릿 사용하기"`).
- [ ] 탭 시 이미지 선택 / FilterPreview 네비게이션에 `sourceContentId` 전달.
- [ ] MIXED 필터는 프리뷰 경유 / 그 외는 직진입 (기존 동작 유지).
- [ ] 삭제된 필터 원본 → 에러 모달 노출.
- [ ] BE 생성 요청 body 에 `sourceContentId` 포함 (network tab 또는 mock 검증).
- [ ] Legacy 홈 필터 진입 경로 변화 없음 (regression: home-tabs, home-header-elements 통과).
- [ ] `SOURCE_CONTENT_DELETED` / `SOURCE_CONTENT_NOT_PUBLIC` 에러 핸들링 (토스트 + invalidate).
- [ ] route.types.ts 확장 후 모든 navigate 호출부 점검 (rubric C7 v3) — `yarn typescript | grep -v '@wrtn/'` 신규 에러 0.
- [ ] e2e: 기존 `profile-to-swipe-feed.yaml` 확장 — CTA 탭 후 다음 화면 assertVisible.

## Screens / Components

- **SwipeFeedCTAButton** (Component, 세로 스와이프 하단) — 소유자 분기 라벨:
  - Me variant: label "다시 생성하기"
  - Other variant: label "템플릿 사용하기"
  - 크레딧 표시 영역 (coin icon + 숫자 / 무료)
- **FilterDeletedErrorModal** (Modal / BottomConfirmSheet single action):
  - Title: "원본 게시글이 사라져서 다시 만들 수 없어요"
  - Action: "확인"
- States: default(me) / default(other) / credit-deficit / deleted-filter-error
- **SSOT 선언 (DRIFT-02)**: 본 태스크의 `.sf-creator` + `.sf-footer` + `.cta-button` 구조가 SwipeFeed footer 전체 레이아웃의 SSOT. app-001 / app-004 / 기타 SwipeFeed 참조 태스크는 본 spec 의 layout/spacing/color 토큰을 그대로 따른다.

## Implementation Hints

- `swipe-feed-footer.tsx` (라인 180-254) `handleCta()` 가 진입점. 소유자 분기는 함수 상단에서 판정.
- `useGetFilterByIdUseCase` 가 없으면 생성 요청 시점에 BE 가 리턴하는 에러를 기다려도 UX 허용.
- `navigation.navigate` 의 param typing: `route.types.ts` 의 `FilterPreview` / create flow 타입에 `sourceContentId?` 추가.
- 모달 구현: `BottomConfirmSheet` 단일 액션 버전 or `RNAlert`.
- Prototype 단계에서 "다시 생성하기" / "템플릿 사용하기" 버튼 크기/컬러 동일성 확정.
