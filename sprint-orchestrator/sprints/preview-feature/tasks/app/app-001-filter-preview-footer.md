# APP-001 — FilterPreview Footer Dual-CTA

## Target
- `apps/MemeApp/src/presentation/meme/filter-preview.screen.tsx`
- `apps/MemeApp/src/presentation/meme/components/filter-preview-footer.tsx` (existing component referenced by Explore report)
- `apps/MemeApp/src/shared/constants/test-ids.ts`

## Context
FilterPreview는 현재 `[만들기 🪙{총액}]` 단일 버튼을 노출. preview-feature 적용 대상
필터(`hasDecompPreview: true`)에 한해 `[미리보기]` + `[만들기 🪙{총액}]` 두 버튼을
수평 배치한다.

## Objective
filter detail의 새 필드(`hasDecompPreview`)를 읽어 Footer를 dual-CTA로 분기 렌더한다.
기존 단일 [만들기] 경로(atomic workflow)는 보존 (AC 2.2.3).

## Specification

### Branch logic
- `filter.hasDecompPreview === true` → dual-CTA (좌: 미리보기 / 우: 만들기 🪙{총액}).
- otherwise → 기존 단일 CTA.

### Buttons
| Button | Label | Token | Action |
|---|---|---|---|
| 미리보기 (좌) | "미리보기" | `component.button.secondary.*` | `open-overlay → PreviewBottomSheet` (APP-002) |
| 만들기 (우) | "만들기 🪙{총액}" | `component.button.primary.*` | 기존 `/gen` 경로 (변경 없음) |

`{총액}` = `filter.requiredCredit` (parent).

### Spec data source
- 기존 filter detail GET 응답에 `hasDecompPreview`가 포함되어야 함 (BE 별도 작업 — DTO에 필드 추가). 본 태스크는 클라이언트 표시 로직만 다루며, 누락 시 fallback은 단일 CTA (NOT semantic-breaking — pattern completeness-008 회피: `hasDecompPreview === true`로 strict 비교).

### TestIDs (test-ids.ts)
```
meme.filterPreview.previewButton  # 미리보기
meme.filterPreview.createButton   # 만들기 (기존 id 유지)
```

## Acceptance Criteria — maps to AC 2.1.1, 2.2.3
- [ ] (AC 2.1.1) `hasDecompPreview: true` 필터에서 두 버튼이 수평 배치되어 노출된다.
- [ ] (AC 2.1.1) `hasDecompPreview: false` 필터에서는 기존 단일 [만들기] 버튼만 노출된다.
- [ ] (AC 2.2.3) [만들기] 버튼 동작은 변경되지 않는다 (회귀 0).
- [ ] [미리보기] 탭 → `PreviewBottomSheet` open (APP-002).
- [ ] testID 두 개 노출 (e2e 사용).

## Screens / Components

### Screen: FilterPreview (변경 영역만)
- screen_archetype: `detail`
- detail_state: `normal`
- 변경 영역: 화면 하단 sticky-bottom region — Footer dual-CTA.
- 비변경 영역: 화면 상단 hero/preview area, 헤더, 바디.

### Component: PreviewButton (좌)
- type: `button-secondary`
- label: "미리보기"
- size: `flex: 1`
- tokens.fill: `component.button.secondary.fill`

### Component: CreateButton (우)
- type: `button-primary`
- label: "만들기 🪙{총액}"
- size: `flex: 1`
- tokens.fill: `component.button.primary.fill`

## Implementation Hints
- 기존 Footer 구조는 그대로 두고 dual-CTA 분기만 추가 (slot-based composition 회피 — 화면 1개라 단순 분기로 충분).
