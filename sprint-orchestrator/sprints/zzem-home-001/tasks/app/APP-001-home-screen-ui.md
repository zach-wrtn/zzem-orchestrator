# APP-001: Home Screen UI Redesign

## Target
`app-core-packages/apps/MemeApp/src/presentation/home/`

## Context
현재 홈 화면은 대부분의 PRD 요구사항을 충족하지만, 헤더와 일부 섹션에 조정이 필요하다.

### 기존 구현
- **헤더**: 로고 + 크레딧 버튼 + My버튼(unread badge) + 설정 버튼
- **퀵 액션**: MainServiceSection 4종 (Beta 배지 포함)
- **신규 템플릿**: NewFilterSection (가로 스크롤)
- **실시간 랭킹**: TrendingFilterSection (4개 → 접기/펼치기)
- **필터 칩**: FilterChips (API 기반, FlashList)

### 참조 파일
- `presentation/home/componenets/home-header/home-header.tsx`
- `presentation/home/componenets/main-service/main-service-section.tsx`
- `presentation/home/componenets/filter-list/new-filter-section.tsx`
- `presentation/home/componenets/filter-list/trending-filter-section.tsx`
- `presentation/home/componenets/filter-chips/`

## Objective
PRD-002 US1~US5에 맞게 홈 화면 헤더와 섹션을 조정한다.

## Specification

### 1. 헤더 재구성 (US1)
- 좌측: 앱 로고 (기존 유지)
- 우측: 코인 버튼 (기존 크레딧 버튼 유지) + 알림 벨 버튼 (설정 버튼 대체)
- 알림 벨: 읽지 않은 알림 시 빨간 점 표시 (`useGetUnreadBadgeUseCase()` 활용)
- 알림 벨 탭 → 알림 목록 화면으로 네비게이션 (화면이 없으면 placeholder)
- My버튼 제거 (하단 탭으로 이동 예정 — APP-003에서 처리)
- 설정 버튼 제거

### 2. 퀵 액션 메뉴 확인 (US2)
- 4종 표시 확인: 비디오 생성, 이미지 생성, 댄스 챌린지, 주인공 바꾸기
- Beta 배지: `resultType === "character-swap"` 시 보라색 "Beta" 배지 (기존 구현 확인)
- 각 버튼 탭 → 해당 생성 화면 이동 (기존 동작 유지)

### 3. 신규 템플릿 섹션 (US3)
- 섹션 헤더 "쨈 신규 템플릿" + 우측 화살표(→) 전체보기 버튼
- 가로 스크롤 카드: 80×100px 썸네일 + 이름
- 전체보기 탭 → 신규 템플릿 전체 목록 화면 이동
- 기존 NewFilterSection 기반으로 조정

### 4. 실시간 랭킹 (US4)
- `CONFIG.COLLAPSED_COUNT`를 3으로 변경 (현재 4)
- 각 항목: 순위 번호(보라색) + 썸네일 + 이름 + 콘텐츠 유형 태그 + "만들기" 버튼
- "더보기" 링크로 확장 (기존 펼치기/접기 동작 유지)
- 기존 TrendingFilterSection 기반

### 5. 카테고리 필터 칩 (US5)
- 기존 FilterChips 동작 유지 (API 기반 칩 목록)
- "추천" 칩이 기본 선택 상태
- 칩 선택 시 콘텐츠 그리드 필터링 (기존 동작)
- 가로 스크롤 (기존 FlashList)

## Acceptance Criteria

### AC 1.1: 헤더 레이아웃
- Given 인증된 사용자가 홈 화면에 진입하면
- When 헤더를 볼 때
- Then 좌측에 로고, 우측에 코인 아이콘과 알림 벨 아이콘이 표시된다
- And 설정 버튼과 My버튼은 표시되지 않는다

### AC 1.2: 알림 뱃지 표시
- Given `useGetUnreadBadgeUseCase()`가 `hasUnread: true`를 반환할 때
- When 헤더를 볼 때
- Then 알림 벨 아이콘 우상단에 빨간 점이 표시된다

### AC 2.1: 퀵 액션 메뉴
- Given 홈 화면이 로드되면
- When 퀵 액션 영역을 볼 때
- Then 비디오 생성, 이미지 생성, 댄스 챌린지, 주인공 바꾸기 4개 버튼이 아이콘+라벨로 표시된다

### AC 2.2: Beta 배지
- Given 주인공 바꾸기 메뉴의 `resultType === "character-swap"`일 때
- When 퀵 액션 메뉴를 볼 때
- Then 해당 버튼에 보라색 "Beta" 배지가 표시된다

### AC 3.1: 신규 템플릿 섹션
- Given 홈 화면이 로드되면
- When "쨈 신규 템플릿" 섹션을 볼 때
- Then 섹션 헤더와 가로 스크롤 카드 리스트가 표시된다
- And 각 카드에 썸네일(80×100px)과 이름이 표시된다

### AC 3.2: 신규 템플릿 전체보기
- Given 섹션 헤더의 우측 화살표를 탭하면
- Then 신규 템플릿 전체 목록 화면으로 이동한다

### AC 4.1: 실시간 랭킹 표시
- Given 홈 화면이 로드되면
- When "실시간 랭킹" 섹션을 볼 때
- Then 1~3위 템플릿이 순위 번호(보라색), 썸네일, 이름, 유형 태그, "만들기" 버튼과 함께 표시된다

### AC 4.2: 랭킹 더보기
- Given 랭킹 3위까지 표시된 상태에서
- When "더보기"를 탭하면
- Then 추가 랭킹 항목이 펼쳐진다

### AC 5.1: 필터 칩 표시
- Given 홈 화면이 로드되면
- When 필터 영역을 볼 때
- Then 카테고리 필터 칩이 가로 스크롤로 표시되며 첫 번째 칩이 기본 선택 상태이다

### AC 5.2: 필터 선택
- Given 필터 칩이 표시된 상태에서
- When 특정 칩을 탭하면
- Then 해당 칩이 선택 상태로 변경되고 콘텐츠 그리드가 필터링된 결과로 갱신된다

### Screens / Components

| Screen / Component | 설명 |
|---|---|
| HomeHeader | 로고 + 코인 + 알림 벨 (뱃지 포함) |
| MainServiceSection | 퀵 액션 4종 (기존 유지) |
| NewFilterSection | 신규 템플릿 가로 스크롤 + 전체보기 |
| TrendingFilterSection | 실시간 랭킹 Top 3 + 더보기 |
| FilterChips | 카테고리 필터 칩 (기존 유지) |

### Implementation Hints
- 헤더 레이아웃: 기존 `home-header.tsx` 참조. `HomeHeaderMyButton`, 설정 버튼 제거 후 알림 벨 추가.
- 알림 벨 뱃지: 기존 `useGetUnreadBadgeUseCase()` 훅 재활용.
- 랭킹 축소: `trending-filter-section.tsx`의 `CONFIG.COLLAPSED_COUNT` 값 변경.
- 신규 템플릿 전체보기: `new-filter-section.tsx`의 섹션 헤더에 화살표 버튼 추가.
