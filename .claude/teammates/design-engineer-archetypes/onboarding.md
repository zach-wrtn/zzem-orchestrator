# Onboarding Persona

## 정체성

다단계 진행을 거쳐 초기 상태를 만드는 화면 (가입, 첫 사용 튜토리얼, 설정 마법사). 사용자는 "처음 진입" 상태 — 인지 부담 높고 이탈 위험 큼. 핵심 신호: 진행 표시(progress) + 단일 큰 primary CTA + skip 옵션. 예: 회원가입 step 1/2/3, 첫 사용 walkthrough, 알림 권한 요청.

## 강제 룰 (모두 충족 — 미충족 시 STOP)

| # | 룰 | 검증 방법 |
|---|----|---------|
| 1 | Step indicator 또는 progress bar 가 화면 상단에 가시 — 사용자 위치 인지 가능 (예: "2 / 4" 또는 도트 4개 중 2번째 강조) | `grep -E "progress\|step" screen-spec.yaml > components` |
| 2 | Primary CTA 1개, 56px height 이상 — 큰 손가락 타겟 + 시각 강조 | `grep -E "primary.*height\|56" screen-spec.yaml` 또는 시각 검토 |
| 3 | Skip / dismiss 1-way 명시: "건너뛰기" 또는 X 버튼 — 강제 진행 금지 | `grep -E "skip\|건너\|close" screen-spec.yaml > interactions` |
| 4 | 마지막 step 완료 시 명확한 "다음 화면" 또는 success state 정의 — dead-end 금지 | `screen-spec.yaml > states` 에 `success` 또는 `next_screen` 명시 |

## 권장 룰 (트레이드오프 — 거절 시 로그)

| # | 룰 | 거절 시 영향 |
|---|----|---------|
| 1 | Illustration 또는 hero icon 이미지 (160-240px) — 단조로운 텍스트 화면 회피 | 첫 사용 환영감 약화, 이탈률 상승 위험 |
| 2 | 본문은 1 headline + 1-2 sentence — 긴 설명 금지 | 사용자가 읽기 전에 이탈 |
| 3 | 이전 step 으로 돌아가기 (←) 좌상단에 제공 — 정정 기회 | 사용자가 입력 정정 시 처음부터 재시작해야 함 |

## Good Pattern Examples

- **3-step 회원가입**: 상단 progress dots → illustration → headline ("X 만들기") → 1-2줄 설명 → 큰 입력 1개 → 56px+ "다음" 버튼.
- **권한 요청 (알림/위치/사진)**: 중앙 illustration → 이유 설명 → "허용" 큰 primary + "나중에" ghost.
- **튜토리얼 walkthrough**: 4-5 screen carousel, 각 화면 동일 구조 (illust + headline + body + 큰 다음 버튼). 마지막 화면은 "시작하기" → 본 앱 진입.

## Anti-Patterns

- **Skip 버튼 숨김**: 사용자 강제 진행 — 신뢰 손상, 앱스토어 부정 리뷰.
- **Step indicator 없음**: 사용자가 "몇 단계 남았는지" 모름 — 이탈률 증가.
- **Primary CTA 가 작거나 stroke-only**: 시각 위계 결여 — 모바일 첫 사용자가 다음 행동 불명확.
- **단일 화면에 입력 5개 이상**: form archetype 의 영역. onboarding 은 step 당 입력 1-3개로 분할.
