# Assumption Preview: NotificationCenterScreen

## Meta

```yaml
task_id: "app-020"
screen_name: "NotificationCenterScreen"
generated_at: "2026-04-25T00:00:00Z"
spec_fabrication_risk: "low"
spec_context_coverage: "5 / 5 = 1.0"
exemplar_inlined: "v2-dogfood-free-tab-app-001-freetabscreen"
```

## Inferred Layout Decisions

```yaml
inferred_layout:
  - decision: "행 높이 72px 고정 (avatar 40 + padding 16*2)"
    rationale: "feed.md Good Pattern '컴팩트 리스트' = 64-72px 행. 첫 viewport (744px body) 에 10개 노출 가능 → 강제 룰 #3 (6+ items) 충족 + 여유"
    alternatives:
      - "행 80px (avatar 48px) — 좀 더 헐렁한 위계, 첫 viewport 9개"
      - "행 64px (avatar 36px) — 정보 밀도 최대, 첫 viewport 11개"
    would_break_if: "Sprint Lead 가 avatar 48px 요구 시 → row padding/gap 재조정"

  - decision: "미읽음 강조 = 좌측 6px UnreadDot + 행 배경 brand-weak (--purple-50 #F5F0FF) 동시 사용"
    rationale: |
      task spec '미읽음 dot / 배경색 차이' 양쪽 명시. PRD AC-3.1 '미읽음 강조'.
      tokens.css 에 --wds-fill-brand-weak 등재되어 있어 raw hex 회피 (Pass 6 #1).
    alternatives:
      - "dot 만 — 배경 동일 흰색"
      - "배경만 brand-weak — dot 없음"
    would_break_if: "사용자가 '둘 중 하나만' 요구 시 → 행 styling 단일화"

  - decision: "TypeIcon (lucide heart/user-plus/message-circle/bell) 16px subordinate"
    rationale: "PRD AC-3.3 의 4 카테고리 (푸시/좋아요/소식/팔로우) 와 1:1 매핑 — 알림 종류 즉시 식별. lucide-style inline SVG 사용 (Pass 6 #2 회피)"
    alternatives:
      - "TypeIcon 생략 — actor + 텍스트로만 종류 식별"
      - "TypeIcon 별 색 (좋아요=red, 팔로우=brand) — 시각 다양성"
    would_break_if: "'아이콘 색 차별화' 요구 시 → 토큰 4종 (--type-like/follow/comment/news) 추가 필요"

  - decision: "EmptyView 를 본 화면에 reference state 로만 포함 (실 분기는 app-021)"
    rationale: |
      task context: 'empty_state 정의 (참고: app-021 에서 별도 화면 다룸)'.
      feed archetype 강제 룰 #2 (empty 상태 정의) 충족 + app-021 와 중복 회피.
    alternatives:
      - "EmptyView 생략 — empty 상태 미정의 (강제 룰 #2 위반 위험)"
      - "EmptyView full — app-021 와 동일 디자인 통째로"
    would_break_if: "app-021 가 empty_state archetype 으로 다른 디자인 채택 시 본 reference state 무시"
```

## Placeholder / Content Choices

```yaml
placeholders:
  - component_id: ".actor-avatar"
    kind: avatar
    current: "단일 색 fill (--wds-fill-brand-weak) + 이니셜 1글자"
    source: "context-engine.assets.avatars (kind: gradient-token)"
    needs_real_content: false
    note: "RN 구현 시 사용자 avatar URL 받아 <Image> 로 교체. 40px subordinate 위치이므로 gradient-token 으로 의도."

  - component_id: ".notification-thumbnail"
    kind: image
    current: "토큰화된 그라디언트 (--thumb-purple, --thumb-neutral)"
    source: "context-engine.assets.feed_thumbnails (kind: gradient-token)"
    needs_real_content: false
    note: "POST 썸네일 — 실 구현 시 game/메미 이미지 URL 로 교체"

  - component_id: ".notification-list li (text)"
    kind: list-item
    current: "8개 sample (actor + action + time) — 한국어 카피"
    source: "hardcoded sample (시각 검증용 더미)"
    needs_real_content: true
    note: |
      RN 구현 시 GET /v2/me/notifications 응답으로 교체.
      api-contract.yaml § GET /v2/me/notifications 참조.
      sample 카피는 PRD AC-3.3 '4 카테고리' 와 일치하게 like × 3 / follow × 2 / comment × 2 / news × 1 구성.
```

## Interactions Not In PRD

```yaml
implicit_interactions:
  - interaction: "tap on .notification-row → toggle-state row-read"
    rationale: |
      PRD 명시 인터랙션 = 'row tap → deeplink (선택)'. prototype 단계는
      deeplink 대상 화면 미존재 — 대신 미읽음→읽음 토글로 시각 효과 시연.
      RN 구현 시 deeplink (target post / profile / 댓글 위치) 로 교체.
    removable: false
    note: "toggle 효과 자체는 사용자에게 의미있는 상태 변화 — 시연 가치 있음"

  - interaction: "swipe-down on #body-scroll → toggle-state loading"
    rationale: "feed archetype 강제 룰 #4 — pull-to-refresh. PRD task spec 에도 'pull-to-refresh' 명시"
    removable: false

  - interaction: "tap on #settings-button → navigate app-022"
    rationale: "PRD AC-3.3 entry — 알림설정 화면 진입. task spec 명시"
    removable: false
```

## Anti-Slop Pre-Check (예상)

```yaml
anti_slop_risks:
  - item: "#1 (hex-not-in-tokens)"
    risk: "thumbnail gradient 등 카테고리별 토큰 미등재 색 사용 가능성"
    mitigation: "context-engine.assets.feed_thumbnails 에 토큰화된 색만 사용 — neutral / purple-50/100/500 등 등재 토큰만 사용"

  - item: "#2 (emoji-in-interactive)"
    risk: "TypeIcon / Header back/settings 에 ← ⋮ 같은 기호 placeholder 또는 emoji 유입"
    mitigation: "lucide inline SVG (chevron-left, settings, heart, user-plus, message-circle, bell) 6종 사용. interactive 요소 내 emoji 0"

  - item: "#3 (border-left card slop)"
    risk: "미읽음 행을 border-left 로 강조하는 Material/Tailwind slop 패턴 유입"
    mitigation: "UnreadDot (좌측 6px circle absolute) + 행 배경 fill 사용. border-left 0회"

  - item: "#10 (exemplar drift)"
    risk: |
      exemplar = free-tab 2-col 그리드 카드 (FreeRosterCard).
      본 화면 = 알림 리스트 (avatar + text rows).
      구조 차별 자연 — drift warning 위험 낮음.
    mitigation: "list vs grid 구조 차이 자체가 80%+ 일치 회피. exemplar 의 token compliance / persona 4/4 / refresh 패턴만 참조"
```

## Gate Questions for Sprint Lead

```yaml
gate_questions:
  - "행 높이 72px (현재) vs 80px (헐렁) vs 64px (밀도) 중 어느 것?"
  - "미읽음 강조: dot + 배경 동시 (현재) vs dot 만 vs 배경만 중 어느 것?"
  - "TypeIcon (lucide 4종) 노출 (현재) vs 생략 vs 색 차별화 중 어느 것?"
  - "EmptyView reference state 본 화면 포함 (현재) vs 생략 (app-021 만)?"
```

## User Action

| 선택 | 동작 |
|------|------|
| **proceed** | Step C(HTML 생성) 진행. 가정 모두 승인. |
| **adjust** | 특정 `inferred_layout` 또는 `placeholder` 항목 변경 지시. DE가 Screen Spec을 수정한 뒤 preview 재생성. |
| **stop** | 이 화면의 프로토타입 생성 중단. PRD 보강 필요. |

## Exemplar References

> Inlined per A.2 §"Exemplars 입력 처리". screenshot_path 만 시각 참조 — prototype HTML 직접 읽지 않음.

```yaml
exemplars:
  - id: "v2-dogfood-free-tab-app-001-freetabscreen"
    sprint_id: "v2-dogfood"
    task_id: "free-tab-app-001"
    screen_name: "FreeTabScreen"
    archetype: "feed"
    why_curated: |
      v2 dogfood validation 2026-04-25. Pass 6 9/9 + feed persona 4/4
      (skeleton/empty/refresh/6+ items). verify 22 clicks. Demonstrates
      full tokenization (no raw hex), gradient asset slots, control-panel preserved.
    screenshot_path: "sprint-orchestrator/dogfood/v2-exercise/free-tab-app-001/screenshots/default.png"
    dimension_focus: |
      - archetype_fit: feed persona 4 강제 룰 (skeleton/empty/6+/refresh) 모두 충족 패턴
      - token_compliance: tokens.css 정의 외 hex 0개 (control-panel 제외)
      - interaction_completeness: refresh 인터랙션 (pull + button) 양 패턴 동시 제공
    structural_divergence: |
      exemplar = 2-col 그리드 카드 (4:5 aspect, 1px gap).
      app-020 = 수직 알림 리스트 (72px 행, avatar + text + meta).
      list-vs-grid 구조 자연 차별 — exemplar drift warning 발생 위험 낮음.
```
