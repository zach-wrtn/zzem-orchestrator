# Task 001: 3탭 네비게이션 구조

- **Group**: 1
- **AC**: 2.1

## Target

현재 Stack-only 네비게이션을 하단 3탭(홈/탐색/MY) 탭 바 + Stack 구조로 전면 재구성한다.

## Context

- 현재: `createNativeStackNavigator`로 모든 화면이 flat Stack
- 목표: Bottom Tab Navigator (3탭) 위에 각 탭별 Stack Navigator 배치
- 탭 1 — 홈: 그리드 피드. 헤더에 좌측 ZZEM 로고, 우측 크레딧 + 알림(종) 아이콘
- 탭 2 — 탐색(돋보기): 그리드 피드 숏컷. 홈과 동일 콘텐츠 풀/추천 로직
- 탭 3 — MY(프로필): 기존 '내가 만든 밈' 버튼 대체

## Objective

Bottom Tab Navigator를 도입하고 기존 Stack 화면들을 올바른 위치에 배치한다.

## Specification

### 탭 바 구조
- 3개 탭: 홈 / 탐색 / MY
- 비회원: MY 탭 탭 시 로그인 페이지로 리다이렉트

### 기존 화면 재배치
- HomeScreen → 탭 1 (홈)의 루트
- 탐색 화면 → 탭 2의 루트 (초기에는 HomeScreen과 동일한 컴포넌트 사용 가능)
- ProfileScreen (신규) → 탭 3의 루트
- Settings, MemeViewer, SwipeFeed 등 → 공통 Stack (탭 위에 모달/push)

### Screens / Components
- `BottomTabNavigator` — 3탭 탭바 컨테이너
- `HomeTab` — 홈 탭 Stack
- `ExploreTab` — 탐색 탭 Stack
- `ProfileTab` — MY 탭 Stack
- 탭 아이콘: 홈(집), 탐색(돋보기), MY(사람)

## Acceptance Criteria

1. 앱 하단에 3개 탭(홈/탐색/MY)이 노출된다
2. 각 탭을 탭하면 해당 탭의 루트 화면으로 이동한다
3. 탭 간 이동 시 각 탭의 스크롤 상태가 유지된다
4. 비회원이 MY 탭을 탭하면 로그인 화면으로 이동한다
5. 기존 HomeScreen 기능이 탭 1에서 정상 동작한다
6. Settings, MemeViewer 등 상세 화면은 탭 위에 push로 표시된다

### Implementation Hints

- `@react-navigation/bottom-tabs` 패키지 참조
- 기존 `root-navigator.tsx` 패턴 참조 (`app-core-packages/apps/MemeApp/src/app/navigation/`)
- `RootStackParamList` 타입 확장 필요 (`~/shared/routes`)
