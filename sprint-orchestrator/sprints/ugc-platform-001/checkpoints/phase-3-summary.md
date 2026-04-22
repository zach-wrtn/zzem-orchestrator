# Phase 3 Checkpoint: ugc-platform-001

> Prototype 완료 요약. 이후 Phase (4/5)는 원본 spec/HTML 대신 본 파일을 우선 참조.

## Scope

Phase 1 프로필/네비게이션의 **5개 앱 태스크 중 4개 (app-003, 004, 005, 006)** 프로토타입 제작 + Figma 캐노니컬 리비전.
- app-001/002 (bottom tab navigator, 둘러보기 탭)은 Phase 3 프로토타입 범위 외 (구현만).

## Prototype Artifacts

| Task | Screen(s) | 상태 | 위치 |
|------|-----------|------|------|
| app-003 | MyProfileScreen | approved | `prototypes/app/app-003/` |
| app-004 | SettingsScreen + ComingSoonScreen | approved | `prototypes/app/app-004/` |
| app-005 | ProfileEdit + ImageSourceSheet + CropScreen + AlbumPicker + ExitConfirm | approved | `prototypes/app/app-005/` |
| app-006 | OtherUserProfile + MoreActionSheet + ErrorNotFound | approved | `prototypes/app/app-006/` |

- **Frame**: 375×812 (iPhone 13/14 기준) — app-003만 역사적으로 390×844 (후속 align 필요)
- **Fabrication risk**: 모두 `none` (Figma SSOT 재작성 후 fabrication 제거)
- **Baseline 보존**: 각 task 디렉토리에 `prototype.baseline.html` (v1) 동반

## Revision History

1. **v1 (initial)**: 첫 design-engineer 스폰 4개. PRD+component-patterns 기반 추론 포함 — fabrication_risk `low`
2. **v2 (Figma 리비전)**: Figma `7hozJ6Pvs09q98BxvChj08` 기준 재작성 — fabrication_risk `none`
3. **2026-04-22 user review**: 4/4 approved

## PRD Amendments (Phase 3.4)

`phase-3.4-prd-amendments.md` 4건:

| ID | 내용 | Resolution |
|----|------|-----------|
| DRIFT-01 | Settings에 `고객센터` 행 (Figma 有, Notion 無) | 8메뉴로 확장. Phase 1 ComingSoon placeholder, 실제 destination Phase 3 이월. **Notion 반영 완료** (block `34a0159c-...eaf1`) |
| DRIFT-02 | Other User 카운트 라벨 `팔로워/팔로잉/재생성된` | PRD §6 명시. MY와 동일 패턴 |
| DRIFT-03 | Save disabled 텍스트 `#C5C5C5` | 토큰 `--text_placeholder_disable` 추가. PRD 영향 없음 |
| DRIFT-04 | 하단 탭 canonical 라벨 | **`홈 / 탐색 / MY`** 확정. PRD.md + phase-2 checkpoint 동기화 |

## Phase 4 Impact

- **API 변경 없음**: 6 endpoints 그대로 (be-002/003/004).
- **app-001 (bottom tab)**: route name `home / explore / my` (canonical 라벨 반영).
- **app-004 (Settings)**: 메뉴 배열에 `customer-service` 항목 추가 + ComingSoon 라우팅 + e2e flow `settings-menu-full.yaml`에 검증 step 1개 추가.
- **app-006 (Other User)**: 카운트 3개 `follower/following/regenerated` — be-004 응답 필드 확인 필요.

## Design Tokens 추가

`prototypes/context/tokens.css`에 누적:
- `--text_primary`, `--text_white`, `--surface_white`, `--surface_secondary`, `--surface_button`
- `--outline_primary`, `--background_primary`
- `--profile_avatar_empty_bg`, `--profile_avatar_border`
- `--text_placeholder_disable` (DRIFT-03)
- `--text_tertiary`, `--text_secondary`
- `--sheet-handle`

## Gate Check (Phase 3 → Phase 4)

- [x] 4/4 app 태스크 프로토타입 generated + approved
- [x] `approval-status.yaml` 모든 화면 `status: approved`
- [x] Figma SSOT 기반 리비전 적용 (`fabrication_risk: none`)
- [x] Baseline v1 보존 (롤백 가능)
- [x] Drift 4건 모두 resolution 결정 + Notion SSOT 동기화
- [x] Canonical 탭 라벨 확정 (`홈 / 탐색 / MY`)
- [x] Phase 4 impact 정리 (API/route/token)
- [x] 갤러리 `prototypes/app/index.html` 업데이트 (revision badge + baseline 링크)

→ **Phase 4 (Build) 진입 가능**.
