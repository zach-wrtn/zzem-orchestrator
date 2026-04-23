# Phase 3 Checkpoint: ugc-platform-003 (Prototype)

**Sprint**: ugc-platform-003 (follow-up)
**Generated**: 2026-04-23
**Gate**: AUTO-SKIPPED → Phase 4 direct

## Auto-Skip Rationale

Per `phase-prototype.md` §Auto-Skip 조건:

- App 태스크들이 `### Screens / Components` 명시적 섹션 없이 `## Specification` 안의 `### {ScreenName}` 서브헤더로 컴포넌트를 기술 → 스킬 auto-skip 매칭.
- `docs/designs/DESIGN.md` 미존재 (component-patterns.md 만 존재) → Design Engineer 의 §A.0 선행 읽기 조건 미충족.

## Design Reference (Phase 4 빌드 시 참조)

프로토타입 대신 다음 자료가 시각적 SSOT 역할:
- `docs/designs/component-patterns.md` — Figma 역추출 컴포넌트 패턴 라이브러리 (feed card, 탭바, profile header, settings row, bottom sheet 등)
- `design-tokens/` (symlink → wds-tokens main) — 색상, 간격, radius
- Phase 1/2 기구현 컴포넌트 (우선 재사용):
  - BottomConfirmSheet (useBottomConfirmSheet) — Phase 2 UnpublishConfirmSheet 패턴
  - PublishToggleRow (iOS-style Switch 51×31) — Phase 2
  - ProfileCountRow, ProfileHeader — Phase 1
  - SettingsBody canonical order — Phase 1
  - HomeHeader (코인 + MyButton) — Phase 1

## Screen Coverage (태스크 spec 내 기술)

| Task | 주요 화면/컴포넌트 | 기존 재사용 | 신규 |
|------|--------------------|-------------|------|
| app-001 | FollowButton | regular-button pattern | 3-state text (팔로우/팔로잉/맞팔로우) |
| app-002 | FollowerListScreen, FollowingListScreen | meme-collection list pattern | avatar + nickname + FollowButton row |
| app-003 | BlockConfirmSheet, BlockedProfileState | UnpublishConfirmSheet horizontal 2-btn | BlockedProfileState placeholder |
| app-004 | BlockManagementScreen, UnblockConfirmSheet | list + sheet 재사용 | unblock row variant |
| app-005 | ContentReportBottomSheet | — | 100자 TextInput + counter |
| app-006 | NotificationCenterScreen, HomeHeaderBellButton, PushPermissionBanner, NotificationEmptyState | list pattern | bell + red dot, category dot 색상 (임시 primary-pink/blue/yellow) |
| app-007 | NotificationSettingsScreen, NotificationToggleRow | PublishToggleRow Switch | 4-toggle layout, disabled variant |
| app-008 | (no UI — push handler) | — | — |

## Amendments (inline defaults — 구현 시 재확인)

- **Category dot 색상** (NotificationCenter): 임시 `LIKE=primary-pink, FOLLOW=primary-blue, PAYBACK=primary-yellow`. Phase 4 구현 시 디자이너와 직접 확정 또는 design-tokens/semantic/color 값 채택.
- **PushPermissionBanner 디자인**: 색상/위치/아이콘 — Figma 직접 참조 (phase-3 PRD frontmatter `figma` 링크). Phase 4 구현 시 최종 매칭.

## Regression Guard (Phase 4 에 이월)

- Phase 2 PublishToggleRow Switch 컴포넌트는 그대로 재사용 (복제 금지).
- HomeHeader 수정 시 코인 아이콘 + MyButton 위치 불변.
- SettingsBody canonical order: "알림 설정" → "차단 관리" → "고객센터".

## Next Phase

Phase 4: Build — 4 groups loop (Contract → Implement → Merge → Evaluate → Accept/Fix).
