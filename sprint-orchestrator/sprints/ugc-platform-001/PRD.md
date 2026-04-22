# PRD — ugc-platform-001

## 원본

- **Notion (SSOT)**: [AI UGC Platform 1 — 프로필 & 네비게이션](https://www.notion.so/AI-UGC-Platform-1-33b0159c6b5981249f14cbb4ac053ee5)
- **KB 미러**: `~/.zzem/kb/products/ugc-platform/phase-1-profile/prd.md` (Notion 동기화본)
- **Product Overview**: `~/.zzem/kb/products/ugc-platform/prd.md`
- **Notion ID**: `33b0159c-6b59-8124-9f14-cbb4ac053ee5`

## 스코프 요약

앱의 네비게이션 골격(하단 탭 바 3탭)과 프로필 시스템(MY 3탭, 프로필 편집, 타 유저 프로필, 설정)을 구축한다. UGC Platform 제품의 Phase 1에 해당하며, Phase 2(피드 인터랙션 & 페이백)와 Phase 3(소셜 & 알림)의 선행 조건이다.

### 포함

- 하단 탭 바 3탭 네비게이션 (홈 / 탐색 / MY) — Figma icon-only, 라벨은 accessibilityLabel / route name / analytics key용 canonical
- MY 탭: 3개 하위 탭 (좋아요 껍데기, 업로드, 저장) — 좋아요 실제 기능은 Phase 2, 소셜 실제 기능은 Phase 3
- 프로필 편집 (닉네임, 프로필 이미지, 소개, 링크)
- 타 유저 프로필 조회 화면
- 설정 화면 진입점 — 차단 관리·알림 설정 등 실제 기능은 Phase 3

### 제외 (다른 Phase로 이월)

- 팔로우/좋아요/알림 실제 동작 (Phase 2, 3)
- 피드 세로 스와이프 인터랙션 (Phase 2)
- 크레딧 페이백 시스템 (Phase 2)
- 차단/신고 처리 (Phase 3)

## KPI 기여

UGC 플랫폼 DAU, 프로필 방문율, 팔로우 전환율 상승 기반 마련.

## 설계 참조

- Figma: https://www.figma.com/design/7hozJ6Pvs09q98BxvChj08/Wrtn-X_%EC%A8%88_Sprint-File?node-id=37160-25098
- Component Pattern Library: `docs/designs/component-patterns.md`
- MemeApp Design System: `docs/designs/DESIGN.md`

## 이전 스프린트 히스토리

- `ugc-platform-001` (2026-03-29, completed) — 기존 단일 PRD 기반 7/7 PASS, 30/30 AC. 2026-04-09 orchestrator 전면 리셋으로 artifacts 삭제. 원격 브랜치 `wrtn-backend origin/zzem/ugc-platform-001`만 잔존.
- `ugc-profile-nav-001` (2026-04-07~09, completed → reset) — Phase 1 전용 재시도. 3그룹 PASS, Figma 보정 완료. 2026-04-09 reset에 포함.

본 스프린트(`ugc-platform-001` v2)는 전면 리셋 후 KB two-axis 마이그레이션 및 Harness v4 개선사항을 반영한 Phase 1 재실행이다. 브랜치 네임스페이스는 `sprint/` 전환 (`sprint/ugc-platform-001`)으로 과거 `zzem/ugc-platform-001`과 격리.
