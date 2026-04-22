# Phase 3.4 — PRD Amendments

> **스프린트**: ugc-platform-001
> **트리거**: Phase 3.3 Figma 리비전 리뷰 시 발견된 PRD ↔ Figma drift
> **승인**: 2026-04-22 (zach)
> **후속**: Phase 3.5 Refined PRD (필요 시) / Phase 4 Build 입력

## 요약

Figma 캐노니컬 리비전(Phase 3.3.4) 결과, PRD와 Figma 간 3건의 drift가 식별됨.
모두 스코프 추가 아닌 **문서 정합성** 차원이며, Phase 4 빌드에 차단 요소 없음.
다만 **DRIFT-01 (고객센터)** 은 신규 routing decision이 필요하므로 본 문서에서 합의.

---

## DRIFT-01 · 설정 메뉴에 `고객센터` 행 추가

### Discovery
- **Source**: Figma node `37174:21780` (Settings)
- **현재 PRD 서술** (Notion `33b0159c-6b59-8124-9f14-cbb4ac053ee5` §4): 7개 메뉴 (계정 · 비밀번호 · 알림설정 · 차단관리 · 이용약관 · 개인정보 처리방침 · 탈퇴하기 · 앱버전)
- **Figma 실제**: 8개 — 위 7개 + `고객센터` (차단관리와 이용약관 사이 위치)

### Amendment
| 항목 | 결정 |
|------|------|
| **Settings 메뉴 개수** | 7 → **8** |
| **위치** | Group 02 내 순서: 알림설정 → 차단관리 → **고객센터** → 이용약관 → 개인정보 처리방침 |
| **라우팅** | Phase 1에서는 **ComingSoonScreen placeholder로 고정** (알림설정/차단관리와 동일 패턴). 실제 destination(메일링/웹뷰/인앱 문의 폼)은 **Phase 3 (소셜·신고)** 에서 결정 |
| **Placeholder 문구** | 기존 ComingSoon 공용 템플릿 "준비 중" 재사용 |
| **AC 영향** | `settings-menu-full.yaml` e2e flow에 `고객센터` 진입 + ComingSoon 노출 검증 1 step 추가 |
| **API 영향** | 없음 (라우팅만, BE endpoint 불필요) |

### Rationale
- Figma가 SSOT인 상황에서 메뉴 drop은 UX 회귀. 추가가 기본 방향.
- 라우팅이 Phase 1 범위 밖이므로 placeholder 고정이 scope creep 최소화.

---

## DRIFT-02 · Other User Profile 카운트 라벨 정렬

### Discovery
- **Source**: Figma node `37160:78423` (Other User Profile)
- **현재 PRD 서술** (§6): 카운트 라벨 명시적 열거 없음 (추상 서술)
- **Baseline v1 프로토타입 오기재**: `게시물 / 팔로워 / 팔로잉`
- **Figma 실제**: `팔로워 / 팔로잉 / 재생성된` — **MY 프로필과 동일 3-항목 패턴**

### Amendment
| 항목 | 결정 |
|------|------|
| **PRD §6 카운트 항목 명시** | `팔로워 / 팔로잉 / 재생성된` 고정 |
| **MY 프로필 일관성** | 두 화면 동일 count row 컴포넌트 사용 (재사용 권장) |
| **AC 영향** | `other-user-profile.yaml` e2e 카운트 3개 assertion은 변경 없음 (라벨 문자열만 스펙에서 align) |
| **API 영향** | 없음 (응답 스키마 `followerCount / followingCount / regeneratedCount` 이미 존재 가정 — be-004에서 확인) |

### Rationale
- Baseline의 `게시물` 카운트는 존재하지 않는 필드. Figma는 3-count 패턴으로 통일.

---

## DRIFT-03 · Save 버튼 disabled 상태 텍스트 컬러

### Discovery
- **Source**: Figma node `37160:79939` (Profile Edit)
- **Baseline v1**: `#262626` (near-black) — 활성처럼 보임
- **Figma 실제**: `#C5C5C5` (light-gray)

### Amendment
| 항목 | 결정 |
|------|------|
| **PRD 변경** | 불필요 (텍스트 컬러는 디자인 토큰 수준) |
| **토큰 추가** | `--text_placeholder_disable: #C5C5C5` (이미 `prototypes/context/tokens.css`에 반영) |
| **AC 영향** | 없음 (시각 명세, maestro 검증 대상 아님) |

---

## DRIFT-04 · 하단 탭 canonical 라벨 정렬

### Discovery
- **Source**: Figma icon-only bottom nav (텍스트 라벨 없음)
- **Sprint PRD.md L16 원본**: `홈 / 생성 / MY`
- **Phase 2 checkpoint**: `홈 / 둘러보기 / 프로필`
- 두 문서 간 불일치 — 구현 시 route name / `accessibilityLabel` / analytics key로 필요

### Amendment
| 항목 | 결정 |
|------|------|
| **Canonical 라벨** | **`홈 / 탐색 / MY`** (2026-04-22 승인) |
| **용도** | React Navigation route name, `accessibilityLabel`, analytics event key |
| **UI 표시** | 없음 (Figma icon-only, 텍스트 미노출) |
| **동기화 완료** | sprint `PRD.md` L16 + `checkpoints/phase-2-summary.md` 갱신 |

---

## Follow-ups (참고)

- ~~**Phase 2 checkpoint vs 본 PRD 라벨 불일치**~~ → DRIFT-04로 해소 (2026-04-22).
- ~~**Notion 원본 업데이트**: §4 Settings에 `고객센터` 반영~~ → 2026-04-22 완료 (Notion block `34a0159c-6b59-8165-af3a-e9900550eaf1`).

## Gate (Phase 3.4 → 3.6)

- [x] Drift 4건 모두 resolution 결정 (DRIFT-01~04)
- [x] DRIFT-01 라우팅 결정 (placeholder 고정, Phase 3 이월)
- [x] AC/API 영향 평가 완료 (break 없음)
- [x] Notion 원본 동기화 완료 (`33b0159c-6b59-8124-9f14-cbb4ac053ee5`)
- [x] Sprint PRD.md + phase-2 checkpoint canonical 라벨 정합
