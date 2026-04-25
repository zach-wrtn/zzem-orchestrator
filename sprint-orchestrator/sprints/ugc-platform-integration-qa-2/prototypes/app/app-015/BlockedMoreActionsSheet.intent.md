# Assumption Preview — BlockedMoreActionsSheet (app-015)

> Sprint Lead 검토용. spec 에 없던 결정만 기록.

## Trigger

- `fabrication_risk: low` (신고 row 동존성 + toast 카피 + loading 패턴)
- task spec ↔ Figma 직접 검증 불가 (mcp permission denied) — sibling app-012 mirror 채택
- 구조적 새 컴포넌트는 0 — sibling app-012 의 ActionRow / Backdrop / Toast 그대로 재사용

## 1. Source-of-Truth 결정

| Source | 옵션 목록 |
|--------|----------|
| task spec (`tasks/app/app-015.md`) AC | "차단 해제" / "취소" |
| Sibling app-012 (Figma 37211:162175) | "프로필 URL 복사" / "차단" / "신고" |
| 본 화면 채택 (app-015) | "차단 해제" / "신고하기" |

**채택 근거**:
- AC-2.3 정확한 미러 구조 = sibling 더보기에서 "차단" 만 "차단 해제" 로 치환되는 패턴
- "URL 복사" 는 차단됨 상태에서 의미 약함 (= 사용자가 차단 해제 또는 신고 외에 차단된 사용자 URL 을 공유할 동기 낮음). 보수적으로 제외.
- "취소" row 는 sibling 동일하게 backdrop+ESC 로 대체 (모바일 표준)

→ Sprint Lead `proceed` / `adjust` (옵션 추가/제거) / `stop` (Figma 직접 확인 필요) 중 선택.

## 2. AC-2.3 "위험 강조 X" 해석

- 룰: "차단 해제 row 가 강조 (semantic.label.normal, 위험 강조 X — 해제는 안전 액션)"
- 본 화면: 차단 해제 row → label `wds.label.normal` (#212228, 검은색 neutral)
- sibling app-012 의 차단(block) row 는 destructive red (#FF3B30) — 의도적 시각 차별화
- 신고 row 는 sibling 패턴 mirror (destructive red 유지)

검증: 본 시트에 destructive red 가 등장하는 곳은 신고 row 와 parent surface 의 "차단됨" badge (parent context 한정).

## 3. Modal Persona 강제 룰 #3 picker exception

- 룰: Primary CTA 1 + secondary 0-1
- 본 화면: action picker (2 row, color hierarchy 만)
- 회피 방식: app-005/app-012 picker exception 명시 문서화
- spec 의 `## Picker Exception Documentation` 참조

## 4. Inferred Layout / Behavior

| 항목 | 결정 | 근거 |
|------|------|------|
| 옵션 row height | 56px | app-005 / app-012 동일 (iOS HIG action sheet 표준) |
| Divider 두께 / 색 | 1px / `--wds-line-alternative` (#F0F1F3) | sibling app-012 동일 |
| 차단 해제 tap 시 transition | row → loading state (1.0s) → success 토스트 + sheet dismiss | API mock, 실 구현은 navigate(app-016) |
| 차단 해제 loading copy | "차단 해제 중…" | app-013 BlockConfirmSheet 의 "차단 중…" mirror |
| 차단 해제 success 토스트 | "차단을 해제했어요" | app-016 task spec 의 "{nickname}님 차단을 해제했어요" 를 시트 내 단순화. 실 화면(app-016) 토스트는 분리. |
| 신고 row OOS 처리 | 토스트 "신고 기능은 곧 제공돼요" + dismiss | app-012 mirror |
| loading 중 close 무력화 | backdrop tap + ESC + 다른 row 모두 disabled | race condition 방지 (app-013 패턴) |

## 5. Asset Layer

- Icons: Lucide inline SVG
  - **unlock** (차단 해제) — open padlock 시각 의미 ("ban" 의 반대)
  - **flag** (신고) — sibling app-012 동일
- 부모 surface: app-014 (차단됨 프로필) mock 재사용 — "차단됨" badge + 콘텐츠 placeholder 영역. decorative aria-hidden.
- 새 자산 0건 (Pass 6 #6 placeholder-image 룰: parent_surface kind: real-image, needs_real_content: false — sibling 동일 처리)

## 6. Gate Questions

1. 옵션 구성 "차단 해제 / 신고" 2개 OK? Figma frame 37211:162152 에 "URL 복사" 또는 "취소" 가 명시되어 있다면 추가 필요 (현재 mcp 접근 불가하여 sibling 패턴 mirror).
2. 차단 해제 success 토스트 카피 "차단을 해제했어요" OK? app-016 의 nickname 인터폴레이션 카피 vs 시트 내 단순화 어느 쪽?
3. loading state 동안 다른 row 비활성 + backdrop 무력화 OK? (app-013 패턴 — race 방지가 표준이지만 confirm 불필요한 picker 라면 더 가벼울 수 있음.)
4. 차단 해제 후 navigate 시점 — 본 시트에서 즉시 (= app-016 push), 아니면 sheet dismiss 후 부모(app-014)에서 자동 새로고침?
