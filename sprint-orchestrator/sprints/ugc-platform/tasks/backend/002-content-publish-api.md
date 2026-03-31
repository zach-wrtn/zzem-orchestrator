# BE-002: Content Publish API

## Target
- **User Story**: US1 (피드 공개)
- **Acceptance Criteria**: AC 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
- **API Contract**: `api-contract.yaml` — Content section

## Context
콘텐츠 공개/비공개 전환, 내 콘텐츠 목록 조회, CTA 분기, 페이백 안내 모달. 기존 콘텐츠 모델에 visibility 필드를 추가하여 피드 공개를 제어한다.

## Objective
- `PATCH /contents/:contentId/visibility` — 공개/비공개 전환
- `GET /profiles/me/contents` — 내 콘텐츠 목록 (visibility 필터)
- `GET /profiles/:userId/contents` — 타 유저 공개 콘텐츠
- `GET /contents/:contentId/cta` — CTA 버튼 타입 분기
- `GET /payback/info` — 페이백 정보 조회
- `POST /payback/info/seen` — 페이백 안내 모달 확인 마킹

## Specification

### Data Model Changes
- 기존 Content 모델에 필드 추가:
  - `visibility` (enum: public/private, default: public)
  - `promptType` (enum: filter/custom) — 커스텀 프롬프트 여부
- 기능 업데이트 이전 콘텐츠: `visibility = private` (마이그레이션 배치)
- 업데이트 이후 필터 기반 콘텐츠: `visibility = public`
- 커스텀 프롬프트 콘텐츠: `visibility = private` (공개 전환 불가)

### Visibility Toggle
- 커스텀 프롬프트 콘텐츠 공개 시도 시 400 에러 + 메시지
- 공개→비공개: 피드에서 제거
- 비공개→공개: 피드에 노출 (페이백 재지급 트리거)

### CTA Logic
- `GET /contents/:contentId/cta`:
  - `content.userId === currentUserId` → `regenerate`
  - `content.userId !== currentUserId` → `use_template`
  - 응답에 `filterId` 포함하여 클라이언트가 생성 화면 진입 가능

### Content List
- cursor pagination (createdAt 기준 내림차순)
- 타 유저 콘텐츠: public만 반환
- 내 콘텐츠: visibility query param으로 필터

### Implementation Hints
- `@Transactional()` for visibility toggle
- cursor pagination 기존 패턴 활용
- soft delete 지원

## Acceptance Criteria

### AC 1.1: 공개 기본 정책
- 필터 기반 콘텐츠 생성 시 `visibility = public`
- 기존 콘텐츠 `visibility = private` (마이그레이션)
- 워터마크/로고 없음 (기존 동작 유지)

### AC 1.2: 페이백 바텀시트
- `GET /payback/info` → 현재 페이백 비율 + hasSeen 반환
- `POST /payback/info/seen` → 1회성 마킹

### AC 1.3: 비공개 전환
- `PATCH /contents/:contentId/visibility {visibility: "private"}` → 성공
- 본인 콘텐츠만 변경 가능 (403 for others)

### AC 1.4: 커스텀 프롬프트 결과물
- `promptType = custom` 콘텐츠에 `visibility = public` 설정 시도 시 400
- 에러 메시지: "커스텀 프롬프트 콘텐츠는 공개할 수 없습니다"

### AC 1.5: 풀스크린 비율 정책
- 콘텐츠 응답에 미디어 메타데이터(비율) 포함 (클라이언트 렌더링)

### AC 1.6: 피드 CTA 버튼 분기
- `GET /contents/:contentId/cta` — 소유자 비교 후 ctaType 분기
- filterId 포함하여 생성 화면 진입 지원
