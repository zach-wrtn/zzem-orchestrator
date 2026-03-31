# APP-002: Content Grid with Social Features

## Target
`app-core-packages/apps/MemeApp/src/presentation/home/`

## Context
현재 홈 화면 그리드는 `GET /filters` 엔드포인트에서 필터(템플릿) 목록을 가져와 표시한다.
PRD는 크리에이터 프로필(아바타+이름)과 좋아요(버튼+카운트)가 포함된 콘텐츠 카드를 요구한다.
`GET /feeds/grid` 엔드포인트가 이미 이 데이터를 제공한다 (`userProfile`, `isFavorited`, `favoriteCount`).

### 기존 구현
- **데이터 소스**: `useGetFiltersUseCase(tag)` → `GET /filters`
- **그리드**: LegendList 2열 매거진 레이아웃
- **카드**: FilterListItem (썸네일 + 제목 + 사용 횟수)
- **페이지네이션**: 커서 기반 무한 스크롤

### 참조 파일
- `presentation/home/componenets/home-body.tsx`
- `presentation/home/componenets/filter-list/filter-list-item.tsx`
- `domain/meme/meme.usecase.ts`
- `data/meme/meme.repository-impl.ts`

## Objective
홈 화면 콘텐츠 그리드를 피드 기반으로 전환하고, 크리에이터 프로필과 좋아요 기능을 추가한다.

## Specification

### 1. 데이터 소스 전환
- "추천"(기본) 필터 선택 시: `GET /feeds/grid` 사용
- 특정 카테고리 칩 선택 시: 기존 `GET /filters` 유지 (칩별 피드 없음)
- 커서 기반 무한 스크롤 유지

### 2. 콘텐츠 카드 재설계
각 카드 구성:
- **썸네일**: 기존 2열 매거진 비율 유지
- **템플릿 이름**: `filterTitle` 표시, 긴 텍스트는 말줄임(...) 처리
- **크리에이터 프로필**: 아바타(원형, 20px) + 닉네임 (하단 좌측)
- **좋아요**: 하트 아이콘 + 카운트 (하단 우측)
- 카드 탭 → 해당 템플릿 상세/생성 화면 이동

### 3. 좋아요 토글
- 하트 아이콘 탭 → `PUT /likes` 호출
- 낙관적 UI: 즉시 하트 상태 + 카운트 반영
- API 실패 시 롤백
- `isFavorited` 상태로 하트 채움/빈 하트 구분

### 4. 레이아웃 유지
- 2열 매거진(Pinterest) 레이아웃 (LegendList)
- 기존 간격/패딩 유지 (6px 열 간격, 16px 행 간격)
- 무한 스크롤 threshold 유지 (0.5)

## Acceptance Criteria

### AC 6.1: 매거진형 그리드 표시
- Given 홈 화면에서 "추천" 필터가 선택된 상태에서
- When 콘텐츠 그리드를 볼 때
- Then 2열 매거진 레이아웃으로 카드가 표시된다
- And 각 카드에 썸네일, 템플릿 이름, 크리에이터 프로필(아바타+이름), 좋아요 버튼+카운트가 포함된다

### AC 6.2: 좋아요 토글
- Given 콘텐츠 카드가 표시된 상태에서
- When 하트 아이콘을 탭하면
- Then 좋아요 상태가 즉시 토글되고 카운트가 반영된다
- And API 호출이 실패하면 이전 상태로 롤백된다

### AC 6.3: 카드 탭 네비게이션
- Given 콘텐츠 카드가 표시된 상태에서
- When 카드를 탭하면
- Then 해당 템플릿의 상세/생성 화면으로 이동한다

### AC 6.4: 무한 스크롤
- Given 콘텐츠 그리드가 표시된 상태에서
- When 하단까지 스크롤하면
- Then 추가 콘텐츠가 자동으로 로드된다
- And 로딩 인디케이터가 하단에 표시된다

### AC 6.5: 필터 전환 시 데이터 소스
- Given "추천" 필터가 선택된 상태에서 피드 그리드가 표시될 때
- When 다른 카테고리 칩(예: "무료")을 탭하면
- Then 해당 카테고리의 필터 목록으로 그리드가 갱신된다

### AC 6.6: 긴 텍스트 처리
- Given 템플릿 이름이나 크리에이터 이름이 표시 영역을 초과할 때
- Then 텍스트가 말줄임(...)으로 처리된다

### Screens / Components

| Screen / Component | 설명 |
|---|---|
| HomeBody | 그리드 데이터 소스 전환 로직 (피드 vs 필터) |
| FeedGridItem | 새 카드 컴포넌트 (썸네일 + 이름 + 크리에이터 + 좋아요) |
| LikeButton | 좋아요 토글 (낙관적 UI + 롤백) |

### Implementation Hints
- 데이터 소스 전환: `home-body.tsx`에서 `selectedChipKey === "all"` 시 피드 훅, 아닌 경우 기존 필터 훅 사용.
- 피드 훅: `meme.usecase.ts`에 `useGetGridFeedUseCase` 추가 또는 기존 훅 확인.
- 좋아요 낙관적 UI: React Query `useMutation`의 `onMutate`에서 캐시 직접 갱신, `onError`에서 롤백.
- 카드 레이아웃: 기존 `filter-list-item.tsx` 참조하되 하단에 프로필+좋아요 행 추가.

## API Dependency
- **GET /feeds/grid**: `api-contract.yaml#/paths/~1feeds~1grid/get`
- **PUT /likes**: `api-contract.yaml#/paths/~1likes/put`
- FE는 contract 기반으로 구현. 기존 BE 엔드포인트 사용.
