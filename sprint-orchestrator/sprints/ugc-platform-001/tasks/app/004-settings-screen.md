# app-004 · 설정 화면 — 7개 메뉴 + 진입점

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: app-003 (진입점 — 톱니바퀴)

## Target

`app/apps/MemeApp/src/presentation/settings/` (기존 화면 확장).

## Context

기존 Settings 화면은 앱 버전, 로그아웃, 약관 링크 정도만 보유. PRD는 다음 7개 메뉴 + 앱버전을 요구한다:
1. 계정
2. 비밀번호
3. 서비스 이용 약관
4. 개인정보 처리방침
5. 알림 설정 (진입점만, 기능은 Phase 3)
6. 차단 관리 (진입점만, 기능은 Phase 3)
7. 탈퇴하기
8. 앱버전

## Objective

AC 2.8이 지정한 설정 메뉴 7종+앱버전을 노출하고, 각 메뉴의 진입점만 구축한다. Phase 3에서 채워질 화면은 "준비 중" 빈 화면으로 대체.

## Specification

### Screens / Components
- **SettingsScreen** (기존 확장): `SettingsList`에 7종 메뉴를 정렬.
- **NotificationSettingsPlaceholder**, **BlockManagementPlaceholder** (신규): "준비 중" 빈 화면. Phase 3에서 교체.
- **AccountSettingsScreen**, **PasswordSettingsScreen**: 기존 auth 플로우 재사용(없으면 동일하게 placeholder + 외부 webview 링크 허용).
- **WithdrawConfirmSheet**: 기존 탈퇴 흐름 있으면 재사용.

### Behavior
- 메뉴 탭 순서 PRD 준수.
- 약관/개인정보 항목은 기존 `webview-routes` 패턴 재사용.
- 알림 설정 / 차단 관리 탭 시 placeholder 화면으로 이동. "Phase 3에서 연결 예정" 등 임의 문구 금지. 단순 "준비 중" 안내.
- 앱버전은 기존 표기 로직 유지.

### KB Contract Clauses
- completeness-001 (critical): 모든 새 screen(알림·차단 placeholder)에 진입점(메뉴 row) 배치 확인.
- completeness-002 (major, freq 1): 신규 훅/유틸은 실제 호출부와 함께 구현.

### Tests
- Maestro flow 신규: `settings-menu-full.yaml`
  - 프로필 탭 → 톱니바퀴 openLink → `assertVisible`로 7개 메뉴 row 확인.
  - 알림 설정 row → 준비 중 placeholder `assertVisible`.

## Acceptance Criteria

- [ ] Settings 화면에 7개 메뉴 + 앱버전이 PRD 명시 순서대로 노출.
- [ ] 알림 설정 / 차단 관리 탭 시 placeholder 화면이 로딩 오류 없이 노출.
- [ ] 약관 / 개인정보 / 탈퇴하기 / 앱버전은 기존 동작 유지.
- [ ] Maestro `settings-menu-full.yaml` 통과.

## Implementation Hints

- 참조: 기존 `presentation/settings/settings.screen.tsx` 및 `settings-menu.yaml` 기존 flow.
- Placeholder는 공용 컴포넌트 `ComingSoonScreen(title)` 으로 구현해 재사용.
