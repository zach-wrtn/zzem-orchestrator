# Nav List Persona

## 정체성

설정/계정/도움말 메뉴 — 사용자가 다음 화면으로 이동할 진입점들을 동질 list 로 나열하는 화면. 사용자는 "어디 가야 하지" 모드 — list 항목을 빠르게 스캔하고 정확히 1개를 선택. 핵심 신호: row 단위 list (icon + label + chevron 또는 value) + 그루핑 (섹션 헤더). 예: 설정 메인, 계정 메뉴, 알림 인덱스, 도움말 카테고리, 프로필 메뉴.

## 강제 룰 (모두 충족 — 미충족 시 STOP)

| # | 룰 | 검증 방법 |
|---|----|---------|
| 1 | 모든 row 가 동일 높이 (44px 이상, iOS HIG 표준) — 시각 리듬 유지 | 시각 검토 또는 `grep -E "list-row\|min-height: 44" prototype.html` |
| 2 | 각 row 우측에 affordance (chevron `>` 또는 value 또는 toggle) — 무엇이 일어날지 시각적으로 알림 | `screen-spec.yaml > components` 의 list-row 정의에 `trailing` 필드 존재 |
| 3 | 섹션 헤더 또는 명시적 그루핑 — flat 50개 list 금지. 7±2 항목 단위로 그룹 | `grep -E "section-header\|group-label" screen-spec.yaml` 또는 시각 검토 |
| 4 | Primary action 0개 (모든 row 가 동등 navigation 진입점) — 강조 버튼 금지 | 버튼 분류: 모든 row 가 같은 시각 가중치, primary CTA 부재 정상 |

## 권장 룰 (트레이드오프 — 거절 시 로그)

| # | 룰 | 거절 시 영향 |
|---|----|---------|
| 1 | Leading icon 모든 row 동일 크기 (24px 또는 28px) + 동일 색상 룰 — 일관성 | 일부 row 에 icon, 일부에 없음 → 시각 노이즈 |
| 2 | Destructive action (예: "로그아웃", "계정 삭제") 은 별 섹션 + 빨간 텍스트 — 사고 방지 | 일반 row 와 섞이면 사용자가 실수 클릭 |
| 3 | Search bar 상단 sticky (항목 20개 이상 시) — 빠른 접근 | 사용자가 스크롤해서 찾아야 함, 마찰 |

## Good Pattern Examples

- **설정 메인**: "계정" 섹션 (프로필/이메일/비밀번호) → "알림" 섹션 (push/email toggle) → "프라이버시" 섹션 → 최하단 "로그아웃" (단독 섹션, 빨간 텍스트).
- **도움말 인덱스**: search bar sticky → 카테고리 row 6개 (각각 icon + label + chevron) → 하단 "고객센터 문의" text link.
- **계정 메뉴**: 프로필 hero → "내 활동" 섹션 (게시물/좋아요/저장) → "관리" 섹션 (차단/숨김) → 로그아웃.

## Anti-Patterns

- **Row 높이 불균일**: 일부 row 는 44px, 일부는 60px (서브타이틀 포함 등) → 시각 리듬 깨짐. 서브타이틀 필요 시 row 전체 56px 일관.
- **Chevron 없는 navigation row**: 어디로 갈지 시각 단서 부재 → 사용자에게 "버튼인가 정보인가" 혼란.
- **Primary CTA 추가**: 화면 하단에 "저장" 같은 primary 버튼 → nav_list 의 본질 (모두 동등) 위반. instant 저장 토글이면 form archetype + instant_save 사용.
- **Flat 30+ row, 헤더 없음**: 사용자가 스캔 불가. 섹션 헤더 필수.
- **Destructive 가 일반 row 사이 섞임**: "로그아웃" 이 "이메일 변경" 옆에 있으면 사고 위험.

## Form / Feed / Detail 와의 차이

- **vs form**: form 은 input → 서버 제출. nav_list 는 row → 다른 화면 navigation. nav_list 에 toggle 이 섞여 있으면 → form (instant_save) 으로 분류.
- **vs feed**: feed 는 콘텐츠 소비 (사용자가 읽기/보기 의도). nav_list 는 navigation (이동 의도). pull-to-refresh / skeleton 미적용.
- **vs detail**: detail 은 단일 객체. nav_list 는 N개 진입점 동등 나열.
