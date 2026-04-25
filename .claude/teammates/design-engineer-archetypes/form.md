# Form Persona

## 정체성

사용자 입력을 받아 서버에 제출하는 화면 (로그인, 신고, 프로필 편집, 결제). 사용자는 "정확한 정보를 입력해야 한다" 모드 — validation feedback 과 명확한 진행 상태가 결정적. 핵심 신호: input field N개 + inline validation + 1 primary submit. 예: 로그인, 게시물 신고, 프로필 편집, 결제 정보 입력.

## 강제 룰 (모두 충족 — 미충족 시 STOP)

| # | 룰 | 검증 방법 |
|---|----|---------|
| 1 | 모든 input 에 inline validation 정의 — `screen-spec.yaml > states` 에 `error.{field-id}` 또는 `validation_rules` 블록 | `grep -E "error\|validation" screen-spec.yaml` |
| 2 | Submit 버튼 disabled 상태 정의됨 — 모든 required 필드 valid 까지 비활성 | `screen-spec.yaml > states` 에 `submit_disabled` + `submit_enabled` 둘 다 |
| 3 | Error message 가 해당 입력 직하 (위·우측 alert 박스 금지) — 모바일 UX 표준 | 시각 검토 또는 `grep -B2 "error_message" screen-spec.yaml` |
| 4 | Primary action 1개만 (Submit / Save / 다음 등) — 동급 강조 버튼 금지 | 버튼 분류: primary 1, 다른 버튼은 ghost/text |

## 권장 룰 (트레이드오프 — 거절 시 로그)

| # | 룰 | 거절 시 영향 |
|---|----|---------|
| 1 | Validation 시점은 focus-out (blur) — 타이핑 중 에러 표시는 산만함 | 사용자가 타이핑 중 빨간색 에러 보고 좌절 |
| 2 | Submit 후 loading state — 응답 대기 중 버튼 비활성 + spinner | 사용자가 같은 버튼 여러 번 누름 (중복 제출 위험) |
| 3 | 긴 form 은 섹션 헤더 또는 step 으로 분할 — 한 화면 입력 8개 미만 | 사용자가 진행 정도 인지 못 함, 이탈률 증가 |

## Good Pattern Examples

- **로그인**: 이메일 input + 비밀번호 input (눈 토글) → "로그인" primary (disabled until both filled + valid) → 비밀번호 찾기 text link.
- **신고 form**: 사유 라디오 (5개) → 추가 설명 textarea (선택) → "신고" primary. 사유 선택 시 enabled.
- **프로필 편집**: 아바타 변경 → 이름 input → bio textarea → 링크 input → "저장" sticky bottom primary. 변경 발생 시 enabled.

## Anti-Patterns

- **Alert 박스 에러**: "입력 오류:" 빨간 박스가 form 상단/하단에 — 어느 필드 문제인지 불명확.
- **Submit always enabled + 클릭 후 에러**: 클릭하기 전까지 사용자가 잘못된 입력 인지 못 함 — 모바일 표준은 즉시 피드백.
- **Required 표시 결여**: 필수/선택 구분 없음 — 사용자가 모든 필드 채워야 한다고 오인.
- **2개 primary 버튼 ("저장" + "발행")**: 사용자가 어느 게 진짜 다음인지 혼란 — 위계 조정 필수.
