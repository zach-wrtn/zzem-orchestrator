# Modal Persona

## 정체성

부분 화면을 가리며 단일 작업/확인을 요구하는 임시 표면 (confirm dialog, share sheet, filter sheet, picker). 사용자는 "지금 이거만 결정한다" 모드 — 짧고 닫기 쉬워야 함. 핵심 신호: backdrop + 단일 primary action + 명확한 dismiss. 예: 삭제 confirm, share 시트, 필터 bottom sheet, 날짜 picker.

## 강제 룰 (모두 충족 — 미충족 시 STOP)

| # | 룰 | 검증 방법 |
|---|----|---------|
| 1 | Backdrop opacity 0.4 이상 (rgba alpha 0.4+) — 콘텐츠 가독성 + 부모 화면 시각 분리 | `grep -E "backdrop\|overlay.*0\.[4-9]" prototype.html` 또는 시각 검토 |
| 2 | 닫기 2-way 보장: (a) X 버튼 또는 명시적 cancel + (b) 외부 backdrop tap → close | `screen-spec.yaml > interactions` 에 close 트리거 2개 이상 |
| 3 | Primary CTA 1개 + secondary 0-1개 — 결정 단순화. **면제**: `screen-spec.yaml > Meta.modal_subtype: picker` 또는 `action_sheet` 명시 시 — 모든 메뉴 옵션 N개 동등 행동 (iOS HIG 스타일). 단, cancel/dismiss row 1개 명시 필수 (권장 룰 #4 참조). | 버튼 분류: primary 1, secondary 0-1. modal_subtype: picker/action_sheet 시 N개 동등 옵션 + cancel/dismiss 1개. |
| 4 | Title 또는 명확한 콘텍스트 (1줄) — modal 만 떠있을 때도 사용자 위치 인지 가능 | `screen-spec.yaml > components` 에 `modal_title` 또는 `header` 존재 |

## 권장 룰 (트레이드오프 — 거절 시 로그)

| # | 룰 | 거절 시 영향 |
|---|----|---------|
| 1 | Bottom sheet 형태 (모바일 표준) — 화면 하단에서 위로 슬라이드. 풀스크린 modal 은 detail 영역 침범 | 사용자에게 화면 전환으로 오인됨 |
| 2 | Drag handle (─) 상단 가시 — 시트임을 시각적으로 알림 | 사용자가 drag-to-dismiss 가능한지 모름 |
| 3 | 첫 input/option 자동 focus — 키보드 사용자 즉시 입력 가능 | 추가 탭 필요 (마찰 증가) |
| 4 | Picker / action sheet 패턴 시 명시적 cancel row 또는 dismiss-only 가시 — N개 옵션이 동등이라 사용자가 "선택 안 함" 경로 필요 | 사용자가 picker 진입 후 빠져나갈 경로 모호 (특히 backdrop tap 영역 작은 sheet) |

## Good Pattern Examples

- **삭제 confirm**: 중앙 alert 형태 (또는 bottom sheet) → "X 를 삭제하시겠어요?" → 본문 1줄 → "삭제" 빨간 primary + "취소" ghost.
- **Share 시트**: bottom sheet → drag handle → 공유 옵션 그리드 (4-6개 아이콘) → "닫기" 또는 외부 탭 dismiss.
- **Filter 시트**: bottom sheet → drag handle → "필터" title → 필터 옵션 (정렬/카테고리) → bottom sticky "적용" primary + "초기화" ghost.

## 면제 조건 (Picker / Action Sheet)

iOS HIG action sheet 또는 picker 패턴 — 메뉴 옵션 N개가 모두 동급 navigation 또는 action — 은 본질적으로 primary 1개 룰과 충돌. 다음 조건 명시 시 강제 룰 #3 면제:

**활성 조건**:

- `screen-spec.yaml > Meta.modal_subtype: picker` 또는 `action_sheet` 명시
- 옵션 row 가 모두 동일 시각 가중치 (background 동일 / typography 동일)
- cancel row 또는 dismiss-only (backdrop tap 가능) 1개 이상 가시

**면제 시에도 유지되는 룰**:

- 강제 룰 #1 (backdrop opacity 0.4+) — sheet 모달 인지 유지
- 강제 룰 #2 (닫기 2-way) — 외부 backdrop tap + cancel row
- 강제 룰 #4 (title 또는 컨텍스트) — "공유 옵션", "앨범 선택" 등

**권장 룰 변형 (picker 적용 시)**:

- 권장 #1 (bottom sheet) → 권장 강제 (action sheet 는 거의 항상 bottom)
- 권장 #4 (cancel/dismiss row) → 신규 권장 룰 (picker 에 한해 의미)

**Subtype 분류 가이드**:

| modal_subtype | 정의 | 룰 #3 |
|--------------|------|------|
| `dialog` | confirm/alert — 결정형 | 강제 (기본) |
| `picker` | 옵션 N개 중 1개 선택 (즉시 적용) | 면제 |
| `action_sheet` | 옵션 N개 = N개 다른 action | 면제 |
| `sheet` | 본문 + bottom CTA (필터/공유 sheet) | 강제 (기본) |

**Anti-Pattern (면제 남용 금지)**:

- 본질적으로 confirm 인데 (예: "삭제하시겠어요? 예/아니오") `action_sheet` 로 분류 회피 — Sprint Lead PRD 검증.
- picker 에 1 옵션이 destructive (예: "이 앨범 삭제") — 일반 picker 가 아니라 dialog 분리.

**Good Pattern Examples** (면제 적용):

- **사진 라이브러리 picker**: bottom sheet → "사진 선택" title → 옵션 row 4개 (최근/즐겨찾기/앨범별/모든사진) → cancel row 하단 sticky.
- **앨범 picker**: bottom sheet → "앨범 선택" title → 앨범 row N개 (썸네일+이름+개수) → 외부 backdrop tap dismiss.
- **더보기 메뉴 (action sheet)**: bottom sheet → 옵션 row 4개 (저장/공유/신고/숨김) → cancel row 하단 (구분선 위).

## Anti-Patterns

- **Backdrop 투명**: 부모 화면 그대로 보임 → modal 인지 인지 결여.
- **닫기 X 버튼만, 외부 탭 비활성**: 사용자가 backdrop 탭으로 닫으려다 안 닫혀 좌절 (모바일 표준 위반).
- **Primary 2개 ("저장" + "공유")**: 결정 마비, modal 의 "한 가지만" 원칙 위반.
- **Title 없는 picker**: 무엇을 고르는 picker 인지 컨텍스트 결여 (예: 그냥 날짜만 떠있음).
