# Task 004: 설정 화면 재구성

- **Group**: 2
- **AC**: 2.8

## Target

설정 화면을 PRD 기준으로 재구성한다. 7개 메뉴 항목 노출.

## Context

- 기존 `SettingsScreen` 존재 (`~/presentation/settings/settings.screen.tsx`)
- 현재 설정 화면 구조와 PRD 요구사항 간 차이 확인 필요
- 일부 메뉴(알림 설정, 차단 관리)는 진입점만 구현, 실제 기능은 PRD 3에서

## Objective

설정 화면을 PRD 기준 7개 메뉴로 재구성한다.

## Specification

### 진입
- 프로필 화면 우상단 톱니바퀴 아이콘 → 설정 화면

### 메뉴 항목 (순서)
1. 프로필 편집 → ProfileEditScreen으로 이동
2. 알림 설정 → "준비 중" 표시 (PRD 3)
3. 차단 관리 → "준비 중" 표시 (PRD 3)
4. 서비스 이용약관 → WebView
5. 개인정보 처리방침 → WebView
6. 로그아웃 → 확인 다이얼로그 후 로그아웃
7. 탈퇴 → 기존 UnregisterScreen으로 이동

### Screens / Components
- `SettingsScreen` (기존 파일 수정)
- 설정 메뉴 리스트 UI

## Acceptance Criteria

1. 프로필 화면 우상단 톱니바퀴 아이콘이 노출된다
2. 톱니바퀴 탭 시 설정 화면으로 이동한다
3. 7개 메뉴 항목이 PRD 순서대로 노출된다
4. "프로필 편집" 탭 시 프로필 편집 화면으로 이동한다
5. "알림 설정" 탭 시 "준비 중" 메시지가 표시된다
6. "차단 관리" 탭 시 "준비 중" 메시지가 표시된다
7. "서비스 이용약관" 탭 시 약관 웹뷰로 이동한다
8. "개인정보 처리방침" 탭 시 개인정보 웹뷰로 이동한다
9. "로그아웃" 탭 시 확인 다이얼로그 후 로그아웃이 실행된다
10. "탈퇴" 탭 시 탈퇴 화면으로 이동한다

### Implementation Hints

- 기존 `SettingsScreen` 참조 (`~/presentation/settings/settings.screen.tsx`)
- WebView 네비게이션 패턴 참조 (`~/presentation/webview/`)
