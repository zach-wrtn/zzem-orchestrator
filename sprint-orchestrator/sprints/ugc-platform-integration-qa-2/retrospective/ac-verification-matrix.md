# AC Verification Matrix — qa-2

> **Purpose**: PRD `docs/prds/ugc-platform-integration-qa-2.md` 의 모든 Acceptance Criteria (AC-1.1 ~ AC-3.4) 가 (a) 어떤 prototype task 에 매핑됐는지, (b) 어떤 production code 가 fulfillment 했는지, (c) 본 sprint 머지로 추가 fulfillment 가 됐는지를 정리한다. **Phase 4 Build 의 핵심 발견** — prior sprint (ugc-platform-001/002/003) 가 PRD AC 의 majority 를 이미 구현한 상태였고, qa-2 의 build 단계는 polish/extension 위주였다.
>
> **Source repos**:
> - app: `~/dev/work/app-core-packages` (epic/ugc-platform-final base)
> - backend: `~/dev/work/wrtn-backend` (apple base)

---

## Group 001 — 카메라 / 프로필 사진 편집

### AC-1.1 — 프로필편집 진입 → 닉네임/사진 변경 가능

| Field | Value |
|-------|-------|
| Mapped tasks | app-001 (메인), app-002 (닉네임 활성), app-006 (사진 활성) |
| Production code | `ProfileEditScreen` (app-core-packages, prior ugc-platform-001 PR #794/#555) — 진입 + 닉네임/사진 양쪽 mutation 처리 |
| Status | **fulfilled** |
| Notes | 100% pre-implemented in ugc-platform-001. qa-2 prototype 이 spec 검증 + visual baseline 확보 역할만 수행. |

### AC-1.2 — 닉네임 변경: 키보드 → validation → 저장 → 결과 화면

| Field | Value |
|-------|-------|
| Mapped tasks | app-002 (저장가능), app-004 (키보드), app-011 (결과) |
| Production code | `ProfileEditScreen` 내 닉네임 input + `useUpdateProfile` mutation (prior sprint). validation [2,20]자 production 일치. 결과 화면은 MyProfileScreen rerender (별 navigate 없이 toast). |
| Status | **fulfilled** |
| Notes | qa-2 prototype 의 결과 화면 (app-011) 은 MY 프로필 rerender + top toast 패턴으로 검증. production 이 동일 동작. |

### AC-1.3 — 사진 변경: 라이브러리 선택 / 삭제 / 크롭 / 저장

| Field | Value |
|-------|-------|
| Mapped tasks | app-005 (시트 선택), app-008 (크롭), app-009 (앨범선택), app-010 (결과) |
| Production code | `ProfileEditScreen` 내 사진 영역 + `ImageCropper` 컴포넌트 (qa-2 PR #580 wiring) + presigned URL upload 흐름 (prior sprint). |
| Status | **fulfilled** |
| Notes | "Extended in PR #580" — ImageCropper wiring 이 본 sprint Phase 4 build 산출. 라이브러리 선택은 OS native picker 호출로 처리 (in-app picker app-009 prototype 은 시각 검증용으로만 활용). |

### AC-1.4 — 변경 중 뒤로가기 → 나가기 confirm modal (저장 안된 변경 보호)

| Field | Value |
|-------|-------|
| Mapped tasks | app-003 (닉네임 confirm), app-007 (사진 confirm) |
| Production code | `ProfileEditScreen` 내 BackButton + dirty-state guard + `ExitConfirmSheet` modal (prior sprint). |
| Status | **fulfilled** |
| Notes | 100% pre-implemented. prototype 이 두 confirm sheet 의 visual / 카피 baseline 만 확정. |

### AC-1.5 — 변경 완료 시 MY 프로필에 즉시 반영 (사진/닉네임)

| Field | Value |
|-------|-------|
| Mapped tasks | app-010 (사진변경완료), app-011 (닉네임변경완료) |
| Production code | React Query invalidate + MyProfileScreen rerender. **BE USER_AVATAR enum** 추가 (BE PR #842 + app PR #583) 로 사용자 활동 타임라인까지 갱신. |
| Status | **fulfilled** |
| Notes | "Extended in BE #842 + app #583" — 본 sprint 의 발견으로 USER_AVATAR enum 신규 추가, 사진 변경이 활동 타임라인에 노출되는 흐름 완결. |

---

## Group 002 — 차단 / 차단 관리

### AC-2.1 — 타유저 프로필 → 더보기 → "차단" → confirm modal → 차단 적용

| Field | Value |
|-------|-------|
| Mapped tasks | app-012 (더보기메뉴), app-013 (차단확인) |
| Production code | `OtherProfileScreen` 의 BottomSheet (prior sprint) + `BlockConfirmSheet` + `useBlockUser` hook. |
| Status | **fulfilled** |
| Notes | 100% pre-implemented in ugc-platform-003. qa-2 prototype 이 차단 confirm sheet 의 info row 구성 (양방향 차단 안내) 을 검증. |

### AC-2.2 — 차단된 사용자 프로필 진입 시 콘텐츠 숨김 + "차단됨" 상태 표시

| Field | Value |
|-------|-------|
| Mapped tasks | app-014 (프로필_차단됨) |
| Production code | `OtherProfileScreen` 의 isBlocked 분기 + `blocked-profile-state.tsx`. **본 sprint Phase 4 lint fix 에서 jsx-no-undef bug 발견 → PR #581 으로 수정.** |
| Status | **partially_fulfilled → fulfilled** (본 sprint 머지 후) |
| Notes | "Bug fixed in PR #581" — lint fix 가 prior sprint 의 누락된 import (jsx-no-undef ERROR) 를 노출. 본 sprint 머지 후 production 정상화. |

### AC-2.3 — 차단된 사용자 더보기 → "차단 해제" → 해제 → 프로필 복원

| Field | Value |
|-------|-------|
| Mapped tasks | app-015 (차단됨_더보기메뉴), app-016 (프로필_차단해제후) |
| Production code | `BlockedMoreActionsSheet` + `useUnblockUser` hook + `OtherProfileScreen` 정상 복원. **BE 차단 해제 endpoint 는 production 에 이미 존재** (BE reconciliation mini-sprint 에서 확인). |
| Status | **fulfilled** |
| Notes | 100% pre-implemented in prior sprint X (ugc-platform-003). useUnblockUser hook 의 production 위치 확인. |

### AC-2.4 — 설정 → 차단관리 리스트 → 일괄 해제 가능

| Field | Value |
|-------|-------|
| Mapped tasks | app-017 (리스트), app-018 (일괄 해제 confirm), app-019 (해제완료) |
| Production code | `BlockManagementListScreen` + bulk unblock mutation + `BlockManagementUnblockedScreen` (prior sprint). |
| Status | **fulfilled** |
| Notes | 100% pre-implemented in ugc-platform-003. prototype 의 가치는 (a) refresh button 노출 결정, (b) BlockCountSummary 행 유지 확인, (c) toast auto-show on mount UX 표준화. |

### AC-2.5 — 차단 / 해제 시 toast 또는 confirm 화면 1 step

| Field | Value |
|-------|-------|
| Mapped tasks | app-013 (toast trigger), app-016 (toast 결과), app-019 (toast on mount) |
| Production code | `useBlockUser` / `useUnblockUser` hook 의 onSuccess toast (prior sprint). |
| Status | **fulfilled** |
| Notes | 100% pre-implemented. prototype 이 toast 카피 표준화만 추가 — '차단했어요' / '차단을 해제했어요' / '차단 해제 완료' 3종 일관 표기. |

---

## Group 003 — 알림 (센터 + 설정)

### AC-3.1 — 알림센터 진입 → 미읽음 강조 + 시간순 정렬

| Field | Value |
|-------|-------|
| Mapped tasks | app-020 (알림센터_기본) |
| Production code | `NotificationCenterScreen` + `useNotifications` hook + sort/unread badge (prior ugc-platform-003 PR #804/#563). |
| Status | **fulfilled** |
| Notes | 100% pre-implemented in ugc-platform-003. prototype 이 row 높이 (72px) + dot+배경 동시 미읽음 강조 + lucide TypeIcon 4종 시각 표준 확정. |

### AC-3.2 — 알림 0건 시 empty_state 화면 (재진입 유도 CTA)

| Field | Value |
|-------|-------|
| Mapped tasks | app-021 (알림센터_노데이터) |
| Production code | `NotificationCenterScreen` 의 empty branch + `NotificationsEmptyScreen` 컴포넌트 (prior sprint). |
| Status | **partially_fulfilled** |
| Notes | "Copy conflict — Figma 부정 어조 vs persona positive tone" → PRD copy 변경 금지 룰 우선 채택 (Figma 카피 유지). v2.2 plan #3 (PR #42) 으로 향후 sprint 의 conflict 해결 룰 명문화. CTA destination 은 SearchTab navigate (DE 권고 채택) — production wiring 은 후속 sprint 에서 ('탐색하기' vs '친구 찾기' 카피 결정 미완). |

### AC-3.3 — 알림 설정 진입 → 4 카테고리 (푸시/좋아요/소식/팔로우) 개별 토글

| Field | Value |
|-------|-------|
| Mapped tasks | app-022 (알림설정_토글) |
| Production code | `NotificationSettingsScreen` + 4 토글 row + `useNotificationSettings` hook (prior ugc-platform-003). |
| Status | **fulfilled** |
| Notes | 100% pre-implemented. prototype 이 (a) saving silent indicator, (b) RowError + Toast 동시 표시 패턴, (c) BE default initial value 확인 추가. |

### AC-3.4 — 토글 변경 즉시 저장 (별도 저장 버튼 없음 — form persona 강제 룰 #2 와 충돌 가능 → archetype dogfood 핵심 케이스)

| Field | Value |
|-------|-------|
| Mapped tasks | app-022 (알림설정_토글) |
| Production code | `useNotificationSettings` mutation 즉시 호출 — BE 즉시 저장 (no debounce) — (prior ugc-platform-003 — BE reconciliation 에서 기존 endpoint 확인). |
| Status | **fulfilled** |
| Notes | "form persona waiver 정식화 in v2.2 plan #1 (PR #38)" — instant_save exception clause 가 form.md 에 명문화. dogfood 핵심 케이스로 PRD 가 의도한 충돌 발견 → 룰 진화로 흡수 — 본 sprint 의 가장 의미 있는 메커니즘 검증 사례. |

---

## Group 004 — Nav glue

### (PRD 명시 AC 없음 — 정합성 검증만)

| Field | Value |
|-------|-------|
| Mapped tasks | app-023 (설정 / 설정_메인메뉴) |
| Production code | `SettingsMainScreen` + 차단관리 / 알림설정 navigate row (prior sprint). |
| Status | **fulfilled** |
| Notes | "archetype enum extension in v2.2 plan #2 (PR #41)" — settings 화면이 form persona 4/4 미스피트로 nav_list archetype 신규 등재. production 은 이미 navigate row 패턴 (form persona 무관) 사용 중이라 wire-up 충돌 0. |

---

## Summary

| Status | Count | % |
|--------|------:|---:|
| **fulfilled** | 12 | 92.3% |
| **partially_fulfilled** | 1 | 7.7% (AC-3.2 카피 충돌) |
| **unfulfilled** | 0 | 0% |
| **Total** | 13 | 100% |

(AC-1.1 ~ AC-3.4 = 13 AC + Group 004 정합성 1건 — 13 정식 AC 기준)

### Key Findings

1. **Prior sprint pre-implementation rate**: 12/13 AC 의 production code 가 ugc-platform-001/002/003 에서 이미 머지된 상태. qa-2 의 Phase 4 build 가 polish/extension 위주였던 이유.
2. **Phase 4 추가 fulfillment (본 sprint 머지)**:
   - AC-1.3 ImageCropper wiring (PR #580)
   - AC-1.5 USER_AVATAR enum (BE #842 + app #583)
   - AC-2.2 blocked-profile-state.tsx jsx-no-undef bug fix (PR #581)
3. **부분 fulfillment 1건 (AC-3.2)**: 카피 충돌은 PRD copy 변경 금지 룰 적용 → Figma 카피 유지로 정책 결정. CTA destination 은 후속 sprint 에서 wire-up.
4. **dogfood 핵심 가치 (AC-3.4)**: PRD 가 의도적으로 form persona 와 충돌하는 AC 를 등록 → v2 pipeline 이 충돌 발견 → v2.2 plan 으로 룰 진화. 메커니즘 작동 입증.
