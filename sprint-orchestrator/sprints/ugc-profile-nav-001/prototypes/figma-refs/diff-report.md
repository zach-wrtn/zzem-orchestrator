# Diff Report — 프로토타입 vs Figma

> 분석일: 2026-04-09
> 총 이슈: ~70개 (Critical 25+, Major 24+, Minor 19+)

## 프로토타입별 요약

| 프로토타입 | Critical | Major | Minor | 상세 |
|-----------|----------|-------|-------|------|
| 001-tab-navigation | 8 | 10 | 8 | [diff-001](diff-001-tab-navigation.md) |
| 003-profile-edit | 11 | 10 | 11 | [diff-003](diff-003-profile-edit.md) |
| 004-settings-screen | 1 | 4 | — | [diff-004](diff-004-settings.md) |
| 005-other-user-profile | 5 | — | — | [diff-005](diff-005-other-user.md) |

---

## Critical 이슈 Top 10 (보정 우선순위)

### 1. [001] AC 2.5 Detail View 전체 미구현
세로 스와이프 피드가 플레이스홀더 수준. PostCard(blur bg + gradient dimming), Side Action Buttons 5개, 4개 진입 variant, 하단 CTA+토글 전부 없음.

### 2. [003] 사진 크롭/앨범 선택 화면 없음
프로필 편집에서 사진 변경 시 크롭 화면, 앨범 3-column 그리드 선택 화면 미구현.

### 3. [003] 저장 버튼 활성화 로직 없음
dirty-state 감지 없음. 저장 버튼이 항상 비활성. Figma에 닉네임/사진 변경 시 활성화되는 2개 상태 존재.

### 4. [003] 닉네임 텍스트필드 컴포넌트 틀림
언더라인 스타일 → Figma는 filled rounded box (surface_secondary bg, rounded-16).

### 5. [003] 나가기 확인 바텀시트 없음
뒤로가기 시 미저장 변경사항 확인 다이얼로그 미구현.

### 6. [005] 타유저 프로필에 탭이 있음 (있으면 안됨)
Figma: 탭 없이 직접 그리드. 프로토타입: "게시물" 탭이 표시됨.

### 7. [005] 생성실패 상태 미구현
"생성 실패" 텍스트 + CancelStroke X 버튼 상태 없음.

### 8. [005] 생성중 썸네일 시각 처리 틀림
프로토타입: 흰색 오버레이+시계 아이콘. Figma: 다크 그라디언트+흰색 텍스트+로고 스피너.

### 9. [001] 프로필 탭 아이콘 Stroke→Fill 미전환
활성 탭에서 MediaFill/LockFill/HeartFill로 교체해야 하는데 색상만 변경.

### 10. [004] 소식알림 토글 vs 알림설정 네비게이션 (PRD-Figma 충돌)
Figma: 토글 스위치. PRD: 별도 화면 네비게이션. 프로덕트 결정 필요.

---

## PRD-Figma 충돌 목록

| 항목 | PRD | Figma | 프로토타입 현재 |
|------|-----|-------|---------------|
| 설정 메뉴 - 알림 | "알림 설정" (별도 화면) | "소식 알림" (토글) | PRD 따름 |
| 설정 메뉴 - 차단관리 | 있음 (준비중) | 없음 | PRD 따름 |
| 설정 메뉴 - 프로필편집 | 있음 | 없음 (별도 진입) | PRD 따름 |
| 설정 메뉴 - 고객센터 | 없음 | 있음 | 없음 |
| 설정 메뉴 - 앱버전 | 없음 | 있음 | 없음 |

→ **기본 방침: PRD 우선, Figma 비주얼 스타일 적용**
