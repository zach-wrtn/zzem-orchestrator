# Assumption Preview — MoreActionsSheet (app-012)

> Sprint Lead 검토용. spec 에 없던 결정만 기록.

## Trigger

- `fabrication_risk: low` (toasts copy + URL 복사 옵션 Figma 우선 채택)
- task spec ↔ Figma frame **불일치** — gate 결정 필요

## 1. Source-of-Truth 충돌 해소

| Source | 옵션 목록 |
|--------|----------|
| task spec (`tasks/app/app-012.md`) | "차단" / "신고" / "취소" |
| Figma `37211:162175` (canonical) | "프로필 URL 복사" / "차단하기" / "신고하기" |

**채택**: Figma. 이유:
- `feedback_canonical_prd_first.md` 정신은 PRD canonical 이지만, frame 명세는 Figma가 surface 이므로 디자인 표면 truth = Figma
- task spec 의 "취소" row 는 모바일 표준 (backdrop tap / ESC) 으로 대체 — close 2-way 충족
- "프로필 URL 복사" 는 task spec 미언급이지만 Figma 명시 — 채택. 미채택 시 Figma 와 불일치한 prototype 양산.

→ Sprint Lead `proceed` / `adjust (옵션 추가/제거)` / `stop (PRD 보강 필요)` 중 선택 요청.

## 2. Modal Persona 강제 룰 #3 picker exception

- 룰: Primary CTA 1 + secondary 0-1
- 본 화면: action picker (3 row, hierarchy color로만 표현)
- 회피 방식: app-005 사진선택 동일 패턴 (picker exception 명시 문서화)
- spec 의 `## Picker Exception Documentation` 참조

## 3. Inferred Layout / Behavior

| 항목 | 결정 | 근거 |
|------|------|------|
| 옵션 row height | 56px | app-005 사진선택 row + iOS HIG action sheet 표준 |
| Divider 두께 / 색 | 1px / `--wds-line-alternative` (#F0F1F3) | row 간 분리 (Figma full-bleed divider 시각적 추출) |
| 차단 row tap 시 transition | 현재 sheet dismiss → app-013 modal open (replace-overlay) | navigation push 보다 modal stack 자연스러움 (mobile UX) |
| 신고 row OOS 처리 | 토스트 "신고 기능은 곧 제공돼요" + dismiss | task spec 'OUT OF SCOPE 표시 only' 명시 |
| URL 복사 토스트 카피 | "링크가 복사되었어요" | iOS 표준 대화체 (assumption — 정확 카피는 Sprint Lead 확정 필요) |

## 4. Asset Layer

- Icons: Lucide inline SVG — `link` (URL 복사), `ban` (차단), `flag` (신고)
- 부모 surface (시각 컨텍스트): app-013 와 동일한 mock 프로필 화면 재사용 — 새 자산 0건

## 5. Gate Questions

1. Figma 옵션 채택 (URL 복사 추가) OK? 아니면 task spec 의 "취소 row" 형태로 회귀?
2. 신고 row 토스트 카피 "신고 기능은 곧 제공돼요" 그대로 OK?
3. URL 복사 토스트 카피 "링크가 복사되었어요" 그대로 OK?
4. 차단 row 전환을 navigation push (= Stack screen) 가 아닌 modal replace 로 처리 OK?
