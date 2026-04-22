# Screen Spec: LikeButton

> 세로 스와이프 피드 우측 액션 바 내 좋아요 버튼 컴포넌트.
> heart icon + count text 세로 정렬. 축약 없는 실제 숫자, 0 포함.
> `DoubleTapLikeOverlay` 제스처 재사용.

## Meta

```yaml
screen_name: "LikeButton"
task_id: "app-005"
sprint_id: "ugc-platform-002"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844 (SwipeFeed host)"
theme: "dark-overlay (feed media backdrop)"
host_screen: "SwipeFeedScreen"
host_layout: "action-bar right-column (app-001 참조: 좋아요 → 재생성 → 공유 → 더보기)"
```

## Component Tree

```
SwipeFeedScreen [frame: 390x844]
└── SwipeFeedActionBar [container] (aside) #action-bar — 우측 수직 스택 (position: absolute; right: 12px; bottom: 140px)
    ├── LikeButton [composite-button] (button) #action-like ★ (app-005 scope)
    │   ├── LikeIconButton [icon-button] (span) #like-icon
    │   │   └── HeartIcon [svg-icon] — filled (liked) | outlined (not-liked)
    │   └── LikeCountLabel [text] (span) #like-count — "0" | "123" | "124" | "8600"
    ├── RegenerateCountButton [composite-button] (button) #action-regen — (app-001 scope, reference-only)
    ├── ShareButton [icon-button] (button) #action-share — (app-001 scope, reference-only)
    └── MoreButton [icon-button] (button) #action-more — (app-001 scope, reference-only)

Gesture Layer (overlay on media):
└── DoubleTapLikeOverlay [overlay] (div) #double-tap-overlay — existing; 재사용 (burst heart animation)
```

### Component Details

```yaml
components:
  - name: LikeButton
    type: composite-button
    id: action-like
    tag: button
    position: "action-bar row 1 (top)"
    size: "52 x 64 — icon 28x28 + count row"
    tokens:
      background: "transparent"
      icon_fill_liked: "var(--wds-color-red-500) → #FF3B30"
      icon_stroke_not_liked: "var(--wds-color-neutral-0) → #FFFFFF"
      label: "var(--wds-color-neutral-0) → #FFFFFF"
      label_font: "var(--wds-font-weight-semibold) var(--wds-font-size-xs)/1.35 var(--wds-font-family-primary)"
      shadow: "0 1px 2px rgba(0,0,0,0.35) (text-shadow for media legibility)"
      gap: "var(--wds-spacing-4) → 4px (icon→label)"
    layout:
      direction: vertical
      alignment: center
      sizing: fixed
    behavior:
      purpose: "AC 3.1 셀프 좋아요 허용 + AC 3.3 좋아요 수 실제 숫자 노출"
      user_action: "단일 탭 → 좋아요 토글 (POST/DELETE /v2/contents/:id/likes). 더블탭 (media area) → DoubleTapLikeOverlay 경유 동일 훅 호출"
      feedback: "visual (icon fill swap + count delta) + haptic (light impact on toggle)"
    states:
      default: "heart outlined, count=likeCount (실제 숫자, 0 포함)"
      not_liked_zero: "heart outlined white, label='0'"
      not_liked_with_count: "heart outlined white, label=likeCount.toString() (예: '123')"
      liked: "heart filled red (#FF3B30), label=likeCount.toString() (예: '124')"
      self_liked: "heart filled red (self-own content 포함, disable 없음). label=likeCount.toString()"
      pending_optimistic: "heart fill 즉시 swap, count 즉시 ±1 (Optimistic). 서버 응답으로 re-sync (idempotent)"
      error_rollback: "onError 시 원 상태로 복구 (heart + count 모두)"
      disabled: null   # 셀프 좋아요 허용 — 비활성 조건 없음
      loading: null    # mutation; UI는 optimistic 우선
    a11y:
      role: button
      label_not_liked: "좋아요 {likeCount}"
      label_liked: "좋아요 취소 {likeCount}"
      hint: "두 번 탭하여 좋아요 토글"
    constraints:
      min_height: "56px (tappable)"
      max_lines: "1 (count)"
      truncation: none
      content_policy: "likeCount.toString() 또는 new Intl.NumberFormat('ko-KR').format(likeCount) — **축약 금지**. 0 포함 항상 노출."

  - name: LikeIconButton
    type: icon-button
    id: like-icon
    tag: span
    size: "28 x 28"
    tokens:
      touch_target: "44 x 44 (expanded hit-slop)"
    states:
      not_liked: "outlined heart (stroke=white 2px, fill=none)"
      liked: "filled heart (#FF3B30, scale 1.0 → 1.2 bounce 160ms on toggle)"
    a11y:
      role: img
      label: "하트 아이콘"

  - name: LikeCountLabel
    type: text
    id: like-count
    tag: span
    tokens:
      font: "var(--wds-font-weight-semibold) 13px/1.35 var(--wds-font-family-primary)"
      color: "#FFFFFF"
      text_shadow: "0 1px 2px rgba(0,0,0,0.35)"
    constraints:
      max_lines: 1
      truncation: none
      content_policy: "**실제 숫자 (축약 없음)**. '0' 도 표시. 4자리 이상 시 'ko-KR' locale 천단위 콤마 (관례)"

  - name: DoubleTapLikeOverlay
    type: overlay
    id: double-tap-overlay
    tag: div
    size: "390 x (media area 높이)"
    position: absolute
    tokens:
      burst_color: "var(--wds-color-red-500) → #FF3B30"
      burst_size: "96 x 96"
      burst_duration: "600ms ease-out"
    behavior:
      purpose: "AC 3.1 — 더블탭 제스처로 좋아요 토글 (Phase 1 기존 구현 재사용)"
      user_action: "media 영역 더블탭"
      feedback: "visual (heart burst + scale 0.6→1.4→1.0 + fade out)"
    states:
      hidden: "opacity 0, pointer-events none"
      burst: "opacity 1 → 0, heart scale pop (기존 구현 훅 그대로)"
    a11y:
      role: "presentation (decorative; 접근성은 LikeButton가 담당)"
      label: null
```

## Layout Spec

```yaml
layout_spec:
  type: absolute-overlay
  viewport: 390x844
  host: SwipeFeedScreen
  regions:
    - id: action-bar
      position: "absolute"
      anchor: "right"
      offset: "right: 12px; bottom: 140px"
      direction: vertical
      gap: "var(--wds-spacing-20) → 20px"
      children:
        - id: action-like       # ★ app-005 scope
          direction: vertical
          gap: "var(--wds-spacing-4) → 4px"
          children:
            - id: like-icon
            - id: like-count
        - id: action-regen      # app-001 scope (reference)
        - id: action-share      # app-001 scope (reference)
        - id: action-more       # app-001 scope (reference)
    - id: double-tap-overlay
      position: "absolute"
      anchor: "media-area"
      pointer_events: "none (burst 시만 visible)"
```

## States

```yaml
states:
  not-liked-zero:
    description: "좋아요 없음 — heart outlined, count '0' 노출 (축약/숨김 금지)"
    active: true
    visible_components: [action-like, like-icon, like-count]
    hidden_components: []
    tokens_applied:
      like-icon: "stroke #FFFFFF, fill none"
      like-count: "'0' text #FFFFFF"
    labels:
      count: "0"

  not-liked-with-count:
    description: "타인이 좋아요한 카운트 있음, 내가 좋아요 안 함"
    visible_components: [action-like, like-icon, like-count]
    hidden_components: []
    tokens_applied:
      like-icon: "stroke #FFFFFF, fill none"
      like-count: "'123' text #FFFFFF"
    labels:
      count: "123"

  liked:
    description: "내가 좋아요 한 상태 (+1 반영)"
    visible_components: [action-like, like-icon, like-count]
    hidden_components: []
    tokens_applied:
      like-icon: "fill #FF3B30, stroke none"
      like-count: "'124' text #FFFFFF"
    labels:
      count: "124"

  self-liked:
    description: "AC 3.1 — 내가 만든 콘텐츠에 내가 좋아요 (셀프 좋아요 허용, 버튼 disable 금지)"
    visible_components: [action-like, like-icon, like-count]
    hidden_components: []
    tokens_applied:
      like-icon: "fill #FF3B30, stroke none"
      like-count: "'1' text #FFFFFF"
    labels:
      count: "1"

  pending-optimistic:
    description: "토글 직후 optimistic update — UI 이미 반영, 서버 응답 대기"
    visible_components: [action-like, like-icon, like-count]
    hidden_components: []
    notes: "heart fill 즉시 swap + count ±1. 서버 응답 `LikeToggleResponse` 로 idempotent re-sync."

  error-rollback:
    description: "onError 시 원상복구 (toast 없음 — silent rollback 가능)"
    visible_components: [action-like, like-icon, like-count]
    hidden_components: []
    notes: "Phase 1 favorite usecase optimistic 패턴 재사용"

  double-tap-burst:
    description: "미디어 영역 더블탭 시 heart burst (DoubleTapLikeOverlay)"
    visible_components: [action-like, double-tap-overlay]
    hidden_components: []
    notes: "600ms 이후 overlay 자동 소멸. action-like 는 liked 상태로 동기 전이."

  loading: null
  error: null
  empty: null
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#action-like"
    action: toggle-state
    state_key: "liked"
    effects:
      - "optimistic: if liked → liked=false, likeCount-=1; else liked=true, likeCount+=1"
      - "api: liked ? POST /v2/contents/:id/likes : DELETE /v2/contents/:id/likes"
      - "onSuccess: cache sync with LikeToggleResponse { contentId, liked, likeCount }"
      - "onError: rollback"

  - trigger: double-tap
    target: "#double-tap-overlay (media area)"
    action: toggle-state
    state_key: "liked"
    condition: "항상 liked=true 로 set (idempotent). 이미 liked 면 no-op (burst animation 만 재생)."
    effects:
      - "DoubleTapLikeOverlay burst animation 재생"
      - "LikeButton toggle 훅 호출 (nextState=true)"

  - trigger: long-press
    target: "#action-like"
    action: none
    notes: "Phase 2 scope 없음 — 동작 없음"
```

## Visual Rules

```yaml
rules:
  - condition: "likeCount === 0"
    effect: "count text '0' 노출 (숨김 금지, 축약 금지)"
    example: "신규 콘텐츠: heart outlined + '0'"

  - condition: "liked === true"
    effect: "heart fill=#FF3B30 (red-500), outline stroke 없음"
    example: "count 124, heart filled red"

  - condition: "item.ownerId === myUserId"
    effect: "LikeButton 동작 동일 (셀프 좋아요 허용, disable 없음)"
    example: "AC 3.1 — 본인 콘텐츠에도 heart 탭 가능, count +1"

  - condition: "likeCount >= 1000"
    effect: "ko-KR locale 천단위 콤마 표시 (관례). **축약 금지** (korean-count 미사용)"
    example: "8600 → '8,600' (NOT '8.6천')"

  - condition: "optimistic mutation in flight"
    effect: "UI 이미 target state 반영, 서버 응답 대기 중에도 추가 탭 허용 (debounce 필요 시 100ms)"
```

## Labels (ko)

```yaml
labels:
  a11y:
    like_not_liked_template: "좋아요 {n}"   # 예: "좋아요 0", "좋아요 123"
    like_liked_template: "좋아요 취소 {n}"   # 예: "좋아요 취소 124"
    hint: "두 번 탭하여 좋아요 토글"
  toast:
    error_silent: null   # PRD 명시 없음 — silent rollback
  count_display:
    zero: "0"
    sample_small: "123"
    sample_liked: "124"
    sample_large: "8,600"   # ko-KR locale 천단위 (축약 아님)
```

## Token Map

```yaml
tokens:
  background: "transparent (media overlay)"
  icon_fill_liked: "primitive.color.red-500 → #FF3B30"
  icon_stroke_not_liked: "primitive.color.neutral-0 → #FFFFFF"
  count_text: "primitive.color.neutral-0 → #FFFFFF"
  count_text_shadow: "0 1px 2px rgba(0,0,0,0.35) (media legibility)"
  count_font_size: "font.size.sm → 13px"
  count_font_weight: "font.weight.semibold → 600"
  gap_icon_to_count: "spacing.4 → 4px"
  gap_action_items: "spacing.20 → 20px"
  icon_size: "28 x 28"
  touch_target: "44 x 44 (hit-slop)"
  burst_color: "primitive.color.red-500 → #FF3B30"
  burst_duration: "600ms"
  bounce_duration: "160ms"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 4
    with_token_map: 4
    with_html_mapping: 4
    score: "8 / 8 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "count_text_shadow (media legibility 관례 — PRD 명시 없으나 white text over image 표준)"
      - "touch_target 44x44 hit-slop (WCAG 관례)"
      - "4자리 이상 ko-KR 천단위 콤마 (task Specification 명시)"
    risk_level: low
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "2 / 2 (AC 3.1 self-like, AC 3.3 실제 숫자) — 모두 연결"
    what_resolved: "4 / 4 components (heart icon, count label, composite button, overlay)"
```
