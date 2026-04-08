# Task 002: 프로필 화면 (MY 3탭)

- **Group**: 1
- **AC**: 2.1, 2.2, 2.5

## Target

프로필 화면을 구현한다. 프로필 헤더(이미지, 닉네임, 카운트) + 3탭(게시물/비공개/좋아요) + 그리드 콘텐츠 목록.

## Context

- 기존 프로필/MY 화면 없음. 완전 신규 구현
- Clean Architecture: domain(entity/repository/usecase) → data(model/mapper/repository-impl/query-key) → presentation(screen/hooks)
- API: `GET /api/v1/user-profile/me`, `GET /api/v1/content/user/:profileId`

## Objective

MY 탭의 루트 화면으로 프로필 화면을 구현한다.

## Specification

### 프로필 헤더
- 프로필 이미지 (미설정 시 회색 디폴트 아바타)
- 닉네임
- 팔로워 / 팔로잉 / 재생성된 카운트 (숫자 포맷: 8,600 → "8.6천", 12,500 → "1.2만")
- "프로필 편집" 버튼
- "프로필 공유" 버튼

### 3탭 구조
- 게시물(공개) / 비공개 / 좋아요
- 디폴트 랜딩 탭: 공개 콘텐츠 있으면 게시물 탭 → 없으면 비공개 탭 → 둘 다 없으면 게시물 탭
- 좋아요 탭: 빈 껍데기 (PRD 2에서 구현)

### 콘텐츠 그리드
- 각 탭에 2~3열 그리드로 콘텐츠 썸네일 노출
- 커서 페이지네이션으로 무한 스크롤
- 콘텐츠 탭 → 세로 스와이프 피드 진입 (해당 탭의 콘텐츠만)
- 빈 상태: "아직 콘텐츠가 없습니다" 메시지

### 숫자 포맷 규칙
- 1,000 미만: 그대로 표시 (예: 999)
- 1,000~9,999: X.X천 (예: 8,600 → "8.6천")
- 10,000 이상: X.X만 (예: 12,500 → "1.2만")

### Screens / Components
- `ProfileScreen` — 메인 프로필 화면
- `ProfileHeader` — 프로필 정보 + 버튼
- `ProfileContentTabs` — 3탭 탭 바
- `ContentGrid` — 콘텐츠 그리드 (재사용 가능)
- `CountFormatter` — 숫자 포맷 유틸

## Acceptance Criteria

1. MY 탭 진입 시 프로필 헤더에 프로필 이미지, 닉네임, 3개 카운트가 노출된다
2. 프로필 이미지 미설정 시 회색 디폴트 아바타가 노출된다
3. 3개 탭(게시물/비공개/좋아요)이 노출되고 탭 전환이 동작한다
4. 디폴트 탭은 공개 콘텐츠 존재 시 게시물 탭, 없으면 비공개 탭, 둘 다 없으면 게시물 탭이다
5. 게시물 탭에 `isPublished=true`인 콘텐츠만 노출된다
6. 비공개 탭에 `isPublished=false`인 콘텐츠만 노출된다
7. 좋아요 탭은 빈 껍데기로 "준비 중" 또는 빈 상태가 표시된다
8. 콘텐츠 그리드에서 아이템 탭 시 세로 스와이프 피드로 진입하며 해당 탭의 콘텐츠만 노출된다
9. 카운트가 숫자 포맷 규칙에 따라 표시된다 (8600 → "8.6천")
10. 콘텐츠가 없는 탭에 빈 상태 메시지가 표시된다

### Implementation Hints

- Clean Architecture: `~/domain/profile/`, `~/data/profile/`, `~/presentation/profile/`
- Zod entity 스키마 패턴 참조 (`~/domain/meme/entities/`)
- React Query useCase 패턴 참조 (`~/domain/meme/`)
- 그리드: `FlatList` 또는 `FlashList` with `numColumns`
