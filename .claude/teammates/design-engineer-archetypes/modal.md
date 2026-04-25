# Modal Persona

## 정체성

부분 화면을 가리며 단일 작업/확인을 요구하는 임시 표면 (confirm dialog, share sheet, filter sheet, picker). 사용자는 "지금 이거만 결정한다" 모드 — 짧고 닫기 쉬워야 함. 핵심 신호: backdrop + 단일 primary action + 명확한 dismiss. 예: 삭제 confirm, share 시트, 필터 bottom sheet, 날짜 picker.

## 강제 룰 (모두 충족 — 미충족 시 STOP)

| # | 룰 | 검증 방법 |
|---|----|---------|
| 1 | Backdrop opacity 0.4 이상 (rgba alpha 0.4+) — 콘텐츠 가독성 + 부모 화면 시각 분리 | `grep -E "backdrop\|overlay.*0\.[4-9]" prototype.html` 또는 시각 검토 |
| 2 | 닫기 2-way 보장: (a) X 버튼 또는 명시적 cancel + (b) 외부 backdrop tap → close | `screen-spec.yaml > interactions` 에 close 트리거 2개 이상 |
| 3 | Primary CTA 1개 + secondary 0-1개 — 결정 단순화 | 버튼 분류: primary 1, secondary 0-1 |
| 4 | Title 또는 명확한 콘텍스트 (1줄) — modal 만 떠있을 때도 사용자 위치 인지 가능 | `screen-spec.yaml > components` 에 `modal_title` 또는 `header` 존재 |

## 권장 룰 (트레이드오프 — 거절 시 로그)

| # | 룰 | 거절 시 영향 |
|---|----|---------|
| 1 | Bottom sheet 형태 (모바일 표준) — 화면 하단에서 위로 슬라이드. 풀스크린 modal 은 detail 영역 침범 | 사용자에게 화면 전환으로 오인됨 |
| 2 | Drag handle (─) 상단 가시 — 시트임을 시각적으로 알림 | 사용자가 drag-to-dismiss 가능한지 모름 |
| 3 | 첫 input/option 자동 focus — 키보드 사용자 즉시 입력 가능 | 추가 탭 필요 (마찰 증가) |

## Good Pattern Examples

- **삭제 confirm**: 중앙 alert 형태 (또는 bottom sheet) → "X 를 삭제하시겠어요?" → 본문 1줄 → "삭제" 빨간 primary + "취소" ghost.
- **Share 시트**: bottom sheet → drag handle → 공유 옵션 그리드 (4-6개 아이콘) → "닫기" 또는 외부 탭 dismiss.
- **Filter 시트**: bottom sheet → drag handle → "필터" title → 필터 옵션 (정렬/카테고리) → bottom sticky "적용" primary + "초기화" ghost.

## Anti-Patterns

- **Backdrop 투명**: 부모 화면 그대로 보임 → modal 인지 인지 결여.
- **닫기 X 버튼만, 외부 탭 비활성**: 사용자가 backdrop 탭으로 닫으려다 안 닫혀 좌절 (모바일 표준 위반).
- **Primary 2개 ("저장" + "공유")**: 결정 마비, modal 의 "한 가지만" 원칙 위반.
- **Title 없는 picker**: 무엇을 고르는 picker 인지 컨텍스트 결여 (예: 그냥 날짜만 떠있음).
