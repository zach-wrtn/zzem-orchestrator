# app-008 · 크레딧 히스토리 페이백 행 (AC 4.2)

- **Group**: 003
- **Owner**: fe-engineer
- **Depends on**: be-003 (CreditHistory PAYBACK 엔트리)

## Target

`app/apps/MemeApp/src/presentation/credit/componenets/credit-history-body.tsx` (경로명 오타 — 기존 folder: `componenets`)
`app/apps/MemeApp/src/data/credit/credit.mapper.ts`
`app/apps/MemeApp/src/data/credit/credit.model.ts`

## Context

기존 크레딧 히스토리 화면 (`credit-history.screen.tsx`) + body (`credit-history-body.tsx`) 는 Phase 1 이전부터 존재. 다양한 `transactionType` 을 구분 렌더하고 있다 (충전/차감/환불 등).

AC 4.2: 페이백 발생 시 크레딧 히스토리에 **"크레딧 페이백"** 타이틀 + **콘텐츠 썸네일** 로 노출. BE 는 `be-003` 에서 PAYBACK 타입 엔트리 생성.

## Objective

크레딧 히스토리 row 에 PAYBACK 타입을 식별하고, 썸네일 + 타이틀 UI 로 렌더하는 variant 추가.

## Specification

### DTO / Entity 매핑
- BE `CreditHistoryListResponseDto` 는 기존 `title`, `thumbnail`, `description`, `amount`, `transactionType` 필드 제공.
- `transactionType` enum 에 `PAYBACK` 추가 (be-003 에서 enum 확장).
- `credit.mapper.ts` 에서 새 enum 값 매핑. Zod 스키마 확장.

### Row UI
- Variant 분기:
  - `transactionType === 'PAYBACK'` → `PaybackHistoryRow`:
    - 좌측: content thumbnail (작은 square, 48×48 or 56×56, Prototype 확정).
    - 중앙: title `"크레딧 페이백"` + description (optional — "{재생성자 닉네임}님이 재생성" 류, BE 가 내려주면 표시).
    - 우측: amount `"+{N} 크레딧"` (양수 강조 — promotion 컬러 토큰).
  - 그 외 기존 타입 → 기존 렌더 유지.

### Filter Chip
- 히스토리 화면에 filter chip 있으면 (예: "적립/사용") `payback` 을 어떤 칩에 묶을지 Prototype 확정. 기본: "적립" 칩에 포함.
- `CreditMapper.toCreditHistoryChipEntityCollection()` 에서 PAYBACK 타입이 포함되도록 확인.

### Regression Guard
- 기존 타입의 row 렌더 회귀 없음.
- 페이지네이션 동작 유지 (cursor 기반 — base64 encoded createdAt).

### Deep-link
- 썸네일 탭 시 원본 콘텐츠 세로 스와이프 진입? — PRD 미명시. 본 스프린트 Scope: **no-op** (탭 핸들러 없음). Prototype 에서 선택적 확정.

### Out of Scope
- 페이백 애니메이션 / 알림.
- 어드민 회수 row (비즈니스 룰: 회수 시 별도 row).

## Acceptance Criteria

- [ ] `transactionType === 'PAYBACK'` 엔트리가 `PaybackHistoryRow` variant 로 렌더.
- [ ] thumbnail, title ("크레딧 페이백"), amount (+N 크레딧) 가 올바르게 표시.
- [ ] 기존 타입 (충전/차감/환불) row 렌더 회귀 없음.
- [ ] Filter chip 에 "적립" (or Prototype 확정 칩) 으로 분류.
- [ ] Zod / entity 매핑이 PAYBACK 타입을 허용 (unit test).
- [ ] 빈 히스토리 / 페이지네이션 동작 유지.
- [ ] e2e: 기존 credit history flow 에 PAYBACK 엔트리 렌더 확장 (seed 기반).
- [ ] `yarn typescript | grep -v '@wrtn/'` 신규 에러 0.

## Screens / Components

- **CreditHistoryRow-Payback** (Component variant, CreditHistory 리스트 내 row):
  - Left: content thumbnail (48×48 or 56×56 — Prototype 확정)
  - Center column:
    - Title: "크레딧 페이백" (bold)
    - Description (optional BE-provided): "{재생성자 닉네임}님이 재생성" 류
  - Right: amount `+{N} 크레딧` (promotion green color, bold)
- **CreditHistoryScreen-WithPayback** (Screen variant — payback 엔트리 포함 전체 리스트):
  - 기존 필터 chip bar + 혼합 row 리스트 (충전/차감/페이백)
  - PAYBACK row 는 별도 variant (위)
- States: default / empty / loading / with-payback-entries

## Implementation Hints

- 기존 row component 구조 파악 후 switch-case / variant 추가.
- Content thumbnail 은 BE 응답의 `thumbnailUrl` 그대로. 없는 경우 fallback (기본 이미지).
- 디자인 토큰: promotion amount 는 기존 `success` / `accent` 계열 color.
- Prototype 단계에서 썸네일 크기, description 형식, 탭 동작 확정.
- 경로 오타 (`componenets`) 는 수정하지 말고 그대로 사용 (대규모 rename 은 scope 외).
