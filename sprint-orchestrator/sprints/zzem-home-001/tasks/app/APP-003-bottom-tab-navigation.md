# APP-003: Bottom Tab Navigation

## Target
`app-core-packages/apps/MemeApp/src/app/navigation/`

## Context
현재 앱은 단일 스택 네비게이터(`createNativeStackNavigator`)로 구성되어 있다.
PRD는 홈/검색/My 3탭 하단 네비게이션을 요구한다.

### 기존 구현
- **루트 네비게이터**: `root-navigator.tsx` (스택 기반)
- **홈 화면**: HomeScreen이 기본 루트
- **네비게이션**: `navigation.navigate()` 방식
- **탭 없음**: 하단 탭바 미구현

### 참조 파일
- `app/navigation/root-navigator.tsx`
- `app/navigation/` 전체
- `presentation/home/home.screen.tsx`

## Objective
하단 3탭 네비게이션(홈, 검색, My)을 구현하고, 기존 스택 네비게이터를 탭+스택 하이브리드 구조로 전환한다.

## Specification

### 1. 탭 네비게이터 구조
```
RootStack
├── TabNavigator (main)
│   ├── HomeTab → HomeScreen (+ 기존 스택 스크린들)
│   ├── SearchTab → SearchPlaceholderScreen
│   └── MyTab → MyPlaceholderScreen
├── ... (기존 모달/오버레이 스크린들)
```

### 2. 탭 바 UI
- 3개 탭: 홈, 검색, My
- 각 탭: 아이콘 + 라벨
- 활성 탭: 채워진(filled) 아이콘
- 비활성 탭: 아웃라인(outlined) 아이콘
- 탭 바 배경: 앱 테마 색상 (WDS 토큰)
- 탭 바 상단 경계선: 1px separator

### 3. 알림 뱃지
- My 탭에 빨간 알림 점 표시 (`useGetUnreadBadgeUseCase()` 활용)
- `hasUnread: true` 시 My 탭 아이콘 우상단에 빨간 점

### 4. 탭 전환 동작
- 탭 전환 시 각 탭의 스크롤 위치/상태 유지
- 같은 탭 재탭 시 최상단 스크롤 (홈 탭 한정)
- 검색/My 탭은 placeholder 화면 (이 스프린트 범위 밖)

### 5. Placeholder 화면
- **SearchPlaceholderScreen**: "검색" 텍스트 + 아이콘 (중앙 정렬)
- **MyPlaceholderScreen**: "마이페이지" 텍스트 + 아이콘 (중앙 정렬)

## Acceptance Criteria

### AC 7.1: 하단 네비게이션 표시
- Given 홈 화면에서
- When 하단 영역을 볼 때
- Then 홈(활성), 검색, My 3개 탭이 아이콘+라벨과 함께 표시된다
- And 현재 탭(홈)은 채워진 아이콘으로 구분된다
- And 비활성 탭은 아웃라인 아이콘으로 표시된다

### AC 7.2: 탭 전환
- Given 하단 네비게이션이 표시된 상태에서
- When 비활성 탭(예: 검색)을 탭하면
- Then 해당 화면으로 전환되며 탭 아이콘 상태가 변경된다

### AC 7.3: My 탭 알림 뱃지
- Given `useGetUnreadBadgeUseCase()`가 `hasUnread: true`를 반환할 때
- When 하단 네비게이션을 볼 때
- Then My 탭 아이콘에 빨간 알림 점이 표시된다

### AC 7.4: 기존 네비게이션 호환
- Given 탭 네비게이터가 적용된 상태에서
- When 기존 스택 기반 화면 이동(예: 필터 상세, 설정)을 수행하면
- Then 기존과 동일하게 화면 전환이 작동한다
- And 탭 바는 상세 화면에서 숨겨진다

### AC 7.5: Placeholder 화면
- Given 검색 또는 My 탭을 탭하면
- Then placeholder 화면이 표시된다

### Screens / Components

| Screen / Component | 설명 |
|---|---|
| TabNavigator | 하단 3탭 (홈, 검색, My) |
| BottomTabBar | 커스텀 탭 바 (아이콘 + 라벨 + 뱃지) |
| SearchPlaceholderScreen | 검색 탭 placeholder |
| MyPlaceholderScreen | My 탭 placeholder |

### Implementation Hints
- React Navigation의 `createBottomTabNavigator` 사용.
- 기존 `root-navigator.tsx` 구조에서 HomeScreen을 TabNavigator로 래핑.
- 모달/오버레이 스크린(필터 상세, 설정 등)은 RootStack에 유지 → 탭 바 위에 표시.
- WDS ThemeStyleSheet로 탭 바 스타일링.
- 아이콘: WDS 아이콘 시스템 또는 기존 아이콘 라이브러리 사용.
