# Evaluation Criteria: zzem-home-001

## Overview
App-only 스프린트. 기존 백엔드 엔드포인트를 활용하여 홈 화면 UI를 PRD-002 요구사항에 맞게 조정.

## Group 001: Home Screen Content (APP-001 + APP-002)

### Evaluation Focus

#### APP-001: Home Screen UI
| 영역 | 검증 방법 |
|---|---|
| 헤더 레이아웃 | 코드에서 렌더링 순서 확인: 로고(좌) + 코인 + 알림벨(우). 설정/My 버튼 제거 확인 |
| 알림 뱃지 | `useGetUnreadBadgeUseCase()` 연동 확인. `hasUnread` 조건부 렌더링 추적 |
| 랭킹 Top 3 | `COLLAPSED_COUNT` 값이 3인지 확인. 렌더링 로직 추적 |
| 신규 템플릿 전체보기 | 섹션 헤더에 전체보기 네비게이션 존재 확인 |
| 퀵 액션 | 기존 동작 회귀 없음 확인 |
| 필터 칩 | 기존 동작 회귀 없음 확인 |

#### APP-002: Content Grid
| 영역 | 검증 방법 |
|---|---|
| 데이터 소스 전환 | "추천" 선택 시 `GET /feeds/grid` 호출, 다른 칩 선택 시 `GET /filters` 호출 추적 |
| 카드 구성 | FeedGridItem 컴포넌트에 썸네일, 이름, 프로필, 좋아요 4요소 존재 확인 |
| 좋아요 낙관적 UI | `useMutation`의 `onMutate`에서 캐시 갱신, `onError`에서 롤백 로직 확인 |
| 무한 스크롤 | `nextCursor` 기반 추가 로드 로직 확인 |
| 텍스트 말줄임 | `numberOfLines` 또는 CSS ellipsis 적용 확인 |

### Edge Cases to Probe
- 피드 응답이 빈 배열일 때 빈 상태 처리
- 좋아요 토글 중 빠른 연속 탭 시 debounce/throttle 여부
- 긴 크리에이터 이름(20자+) 말줄임 처리
- 프로필 이미지 null 시 기본 아바타 표시
- 필터 칩 전환 시 스크롤 위치 초기화

### Evaluator Calibration
- **Critical**: 데이터 소스 전환 로직 오류 (잘못된 API 호출), 좋아요 롤백 미구현
- **Major**: 카드 필수 요소 누락, 무한 스크롤 미작동
- **Minor**: 간격/패딩 불일치, 아이콘 스타일 차이

---

## Group 002: Bottom Tab Navigation (APP-003)

### Evaluation Focus

| 영역 | 검증 방법 |
|---|---|
| 탭 구조 | `createBottomTabNavigator` 사용 확인. 3탭 (Home, Search, My) 구성 |
| 아이콘 상태 | 활성 탭: filled, 비활성: outlined 아이콘 분기 확인 |
| My 탭 뱃지 | `useGetUnreadBadgeUseCase()` 연동 확인. 빨간 점 렌더링 |
| 스택 호환성 | 기존 스택 스크린(필터 상세, 설정 등) 네비게이션 동작 확인 |
| 탭 바 숨김 | 상세 화면 진입 시 탭 바 숨김 확인 |
| Placeholder | 검색/My 탭에 placeholder 화면 렌더링 확인 |

### Edge Cases to Probe
- 홈 탭 재탭 시 스크롤 최상단 이동 여부
- 탭 전환 후 뒤로가기 동작
- 딥링크로 특정 화면 진입 시 탭 상태 정확성
- 탭 바와 Safe Area 간격 (iPhone notch 대응)

### Evaluator Calibration
- **Critical**: 기존 네비게이션 동작 깨짐, 탭 전환 시 크래시
- **Major**: 탭 바 숨김 미작동, 뱃지 미표시
- **Minor**: 탭 전환 애니메이션 부재, placeholder UI 불완전
