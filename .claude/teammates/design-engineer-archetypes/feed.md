# Feed Persona

## 정체성

동질 아이템 N개를 무한/페이지네이션 스크롤로 소비하는 화면. 사용자는 "둘러본다 / 발견한다" 모드 — 의사결정 부담 낮고 시각적 흐름 중요. 핵심 신호: 같은 시각 단위(카드/리스트 아이템)의 반복, 새로고침 행위, 빈 결과 분기. 예: 홈 피드, 검색 결과, 알림 리스트, 친구 활동.

## 강제 룰 (모두 충족 — 미충족 시 STOP)

| # | 룰 | 검증 방법 |
|---|----|---------|
| 1 | `screen-spec.yaml > states` 에 `loading` (skeleton) 상태 정의됨 — 첫 로드 시 회색 placeholder 카드 N개 노출 | `grep -A5 "states:" screen-spec.yaml` 에서 loading 키 존재 확인 |
| 2 | `screen-spec.yaml > states` 에 `empty` 상태 정의됨 — 결과 0건 분기 (empty_state archetype 권고 적용) | 위와 동일, empty 키 존재 |
| 3 | 첫 viewport (390×844) 에 동질 아이템 6개 이상 가시 (헤더/네비 제외 본문 영역) | 시각 검토 — 카드 높이 × 6 ≤ 본문 높이 |
| 4 | 새로고침 인터랙션 1개 이상: pull-to-refresh 힌트 또는 명시적 refresh 버튼 (`screen-spec.yaml > interactions`) | `grep -E "refresh\|pull" screen-spec.yaml` |

## 권장 룰 (트레이드오프 — 거절 시 로그)

| # | 룰 | 거절 시 영향 |
|---|----|---------|
| 1 | 무한 스크롤 시 마지막 카드 직후 loading spinner 또는 "더 보기" 버튼 — 끝 인지 가능 | 사용자가 끝에 도달했는지 모호 (모바일 UX 표준 결여) |
| 2 | 카드 간 spacing 토큰 1단계 (`--spacing-12` 또는 `--spacing-16`) — 너무 빽빽 또는 너무 헐렁 금지 | 시각 위계 약화, 정보 밀도 부적절 |
| 3 | 필터/정렬 컨트롤이 있으면 sticky header 로 스크롤 중에도 접근 가능 | 사용자가 깊게 스크롤 후 필터 변경에 큰 마찰 |

## Good Pattern Examples

- **수직 카드 피드**: 썸네일 + 제목 + 메타 + 1 액션. 카드 높이 일관 (이미지 비율 고정 16:9 또는 1:1). loading 시 동일 높이 회색 placeholder 6장.
- **컴팩트 리스트**: 64-72px 행 높이, 좌측 아바타 + 우측 텍스트 2줄. 100+ 아이템 가정 — virtualization 불필요한 prototype 에서는 50개 더미.
- **그리드 (2-3열)**: 정사각 또는 포트레이트 썸네일. spacing 12-16px. loading 시 동일 모양 placeholder.

## Anti-Patterns

- **carousel 강요**: feed archetype 에 가로 carousel 사용 — feed 는 수직 스크롤이 표준. carousel 은 detail 페이지의 보조 영역에서만.
- **첫 viewport 5개 미만**: 카드를 너무 크게 만들어 첫 화면에 1-3개만 노출 — 발견형 사용자 의도와 충돌.
- **loading 상태 생략**: 빈 화면 → 갑자기 데이터 채워짐 — UX 단절.
- **필터 모달만**: 필터를 모달로만 노출 (인라인 chip 없음) — 모바일 표준은 sticky chip + 모달 병행.
