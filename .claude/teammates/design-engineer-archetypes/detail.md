# Detail Persona

## 정체성

단일 객체(게시물, 프로필, 상품, 영상)의 상세 정보를 깊게 탐색하는 화면. 사용자는 "이미 관심 있는 대상" 을 더 알고자 진입 — 정보 위계와 핵심 액션의 가시성이 결정적. 핵심 신호: hero 영역 + 본문 + 1-2 primary action. 예: 게시물 상세, 프로필 페이지, 상품 상세, 영상 플레이어.

## 강제 룰 (모두 충족 — 미충족 시 STOP)

| # | 룰 | 검증 방법 |
|---|----|---------|
| 1 | Hero 영역(썸네일 / 영상 / 제목+메타 묶음) 높이 320px 이상 — 화면 상단의 시각 앵커 역할 | 시각 검토 또는 `grep -E "hero" screen-spec.yaml` 에서 height 320+ |
| 2 | 뒤로가기 1-way 보장: back button (좌상단 ←) 또는 swipe-down dismiss 둘 중 1개 이상 명시 | `grep -E "back\|dismiss\|close" screen-spec.yaml > interactions` |
| 3 | 핵심 metadata 4개 이내 가시 (작성자, 시간, 카운트, 카테고리 등) — 정보 과잉 금지 | hero 직하 메타 행 카운트 ≤ 4 |
| 4 | Primary CTA 1개 + secondary 0-2개 — 액션 위계 명확. **면제**: `screen-spec.yaml > Meta.detail_state` 가 `blocked` / `private` / `restricted` / `unavailable` 중 하나일 때 primary CTA 0개 허용 (차단/제한 의도 보호 — secondary 만 노출, 예: "차단 해제"). | 버튼 분류: primary 1 (기본), detail_state 면제 시 primary 0 + secondary 0-2 허용. |

## 권장 룰 (트레이드오프 — 거절 시 로그)

| # | 룰 | 거절 시 영향 |
|---|----|---------|
| 1 | Sticky bottom CTA — 스크롤 깊이 무관 primary action 항상 접근 | 긴 본문에서 사용자가 다시 위로 스크롤해서 액션 찾아야 함 |
| 2 | 관련 항목/추천 섹션 본문 끝에 — 다음 탐색 경로 제공 | 사용자 dead-end (뒤로가기 외 갈 곳 없음) |
| 3 | Hero 이미지가 있으면 16:9 또는 1:1 비율로 일관 — 임의 비율 금지 | 시각 일관성 깨짐, 스크롤 시 어색한 점프 |

## Good Pattern Examples

- **게시물 상세**: 풀폭 썸네일(16:9) → 작성자 행(아바타+이름+시간) → 제목 → 본문 → bottom action bar (좋아요/댓글/공유 + sticky primary).
- **프로필 페이지**: hero(배경+아바타+이름+팔로우 카운트) → bio → 탭(게시물/미디어/좋아요) → 콘텐츠 그리드.
- **상품 상세**: 이미지 carousel(16:9) → 제목+가격 → 옵션 picker → 설명 → sticky bottom "구매" CTA.

## 면제 조건 (Blocked / Restricted Variant)

차단된 사용자 프로필, 비공개 계정, 연령/지역 제한 콘텐츠 등 — 사용자가 객체에 진입했지만 정상 action 노출이 부적합한 상태 — 은 강제 룰 #4 (primary 1개) 면제.

**활성 조건**:

- `screen-spec.yaml > Meta.detail_state` 가 다음 중 하나:
  - `blocked` — 사용자가 차단한 또는 차단된 프로필/콘텐츠
  - `private` — 비공개 계정 (팔로우 승인 전)
  - `restricted` — 연령 제한 / 지역 제한 콘텐츠
  - `unavailable` — 삭제됨 / 신고로 비공개 처리됨
- detail_state 사유가 hero 영역 또는 본문에 명시 (예: "차단된 사용자입니다", "비공개 계정")

**면제 시에도 유지되는 룰**:

- 강제 룰 #1 (hero 320px+) — 차단 상태도 시각 앵커 유지
- 강제 룰 #2 (back 1-way) — 진입 경로 보존
- 강제 룰 #3 (메타 4개 이내) — 단, 차단 상태에서는 일부 메타 hidden 가능

**허용되는 secondary actions** (detail_state 별):

| detail_state | 허용 secondary | 금지 |
|-------------|---------------|------|
| `blocked` | 차단 해제 / 신고 | 팔로우 / 메시지 / 좋아요 |
| `private` | 팔로우 요청 / 신고 | 게시물 보기 / 좋아요 |
| `restricted` | 연령 인증 / 도움말 | 콘텐츠 직접 노출 |
| `unavailable` | 신고 / 도움말 | 모든 일반 action |

**Anti-Pattern (면제 남용 금지)**:

- 일반 detail 인데 "단순화 위해" detail_state 사용 — Sprint Lead PRD 검증.
- detail_state: blocked 인데 "팔로우" CTA 그대로 노출 — 면제 의미 무효.

**Good Pattern Examples** (면제 적용):

- **차단된 프로필 (app-014)**: hero (블러 처리된 아바타 + 이름 placeholder) → 본문 "차단된 사용자입니다" + "차단을 해제하면 게시물을 볼 수 있어요" → secondary "차단 해제" (ghost) + 신고 icon.
- **비공개 계정**: hero (아바타 + 이름) → 본문 "비공개 계정입니다" + "팔로우 요청을 보내 게시물을 확인해보세요" → secondary "팔로우 요청" (ghost).
- **연령 제한**: hero (블러 썸네일) → "이 콘텐츠는 19세 이상만 볼 수 있어요" → secondary "연령 인증" (ghost) + "도움말" (text).

## Anti-Patterns

- **Hero 없이 텍스트 시작**: 시각 앵커 결여 — wikipedia 같은 느낌으로 모바일에 부적합.
- **Primary CTA 2개 이상**: "구매" + "장바구니" 동급 강조 — 사용자 결정 마비.
- **메타 행에 6개 이상 정보 나열**: 시각 노이즈, 모바일 가독성 파괴.
- **Back 만 있고 close 없는 modal-like detail**: 풀스크린 진입한 상세인데 뒤로가기 외 dismiss 경로 없음 — 일관성 결여.
