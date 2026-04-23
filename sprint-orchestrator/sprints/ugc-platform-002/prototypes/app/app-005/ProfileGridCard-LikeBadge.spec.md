# Screen Spec: ProfileGridCard-LikeBadge

> 프로필 그리드 카드 (MY / 타유저 프로필 게시물 탭) 우하단 좋아요 badge 컴포넌트.
> heart icon (12×12) + 좋아요 수 (실제 숫자, 축약 없음, 0 포함).
> Phase 1 app-003 FeedGrid2Col 카드 레이아웃 유지, 좋아요 badge 만 추가.

## Meta

```yaml
screen_name: "ProfileGridCard-LikeBadge"
task_id: "app-005"
sprint_id: "ugc-platform-002"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844 (MyProfileScreen / OtherUserProfileScreen host)"
theme: "light"
host_screen: "MyProfileScreen | OtherUserProfileScreen"
host_layout: "FeedGrid2Col, col-gap 1px, card aspect 1:1 또는 4:5, border-radius 4px (Phase 1 §1 pattern)"
```

## Component Tree

```
ProfileScreen (MY | OtherUser)
└── FeedGrid2Col [grid-container] (section) #feed-grid — 2 columns, 1px gap
    └── ProfileGridCard [card] (article) #card-{n}  — 1:1 | 4:5
        ├── CardMedia [image] (div) #card-media — 썸네일 (gradient placeholder)
        ├── GradientOverlay [overlay] (div) #card-overlay — 하단 어두운 그라데이션 (텍스트 가독성)
        ├── TopRow [container] (div) #card-top-row
        │   ├── NewBadge [badge] (span) #badge-new — 선택적 (신규)
        │   └── PrivacyIcon [icon] (span) #icon-privacy — 선택적 (비공개 탭 lock icon)
        ├── BottomRow [container] (div) #card-bottom-row — (Phase 1 기존)
        │   ├── RegenBadge [inline-count] (span) #regen-count ← 기존 (축약 포맷, app-001 소관)
        │   │   ├── RegenIcon [svg] — 회전 화살표 12×12
        │   │   └── RegenCountText [text] — "382" | "8.6천" | "0"
        │   └── LikeBadge [inline-count] (span) #like-count ★ (app-005 scope)
        │       ├── HeartIcon [svg] — 12×12 heart (filled 단색)
        │       └── LikeCountText [text] — "0" | "42" | "8,600" (**실제 숫자, 축약 없음**)
```

### Component Details

```yaml
components:
  - name: ProfileGridCard
    type: card
    id: "card-{n}"
    tag: article
    position: "grid cell"
    size: "(390-1)/2 = 194.5 x [1:1=194.5 | 4:5=243]"
    tokens:
      background: "var(--wds-color-neutral-100) (placeholder)"
      radius: "var(--wds-radius-xs) → 4px (§1 pattern)"
      gap_within_grid: "1px (§1 magazine grid)"
    layout:
      direction: "stacked (media + overlays)"
      sizing: fixed
    a11y:
      role: button
      label: "콘텐츠 카드 {index}"
      hint: "탭하면 세로 스와이프 피드로 이동"

  - name: GradientOverlay
    type: overlay
    id: card-overlay
    tag: div
    size: "full (card)"
    tokens:
      background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.45) 100%)"
    layout:
      sizing: fill
    a11y:
      role: presentation
      label: null
    notes: "하단 카운트 뱃지 가독성 확보. Phase 1 app-003 유지"

  - name: BottomRow
    type: container
    id: card-bottom-row
    tag: div
    position: "absolute bottom-left / bottom-right 분할"
    size: "full-width, padding 6px 8px"
    layout:
      direction: horizontal
      alignment: space-between
      sizing: fill
    notes: "좌: RegenBadge (app-001/phase1 기존). 우: LikeBadge ★(app-005 신규)"

  - name: LikeBadge
    type: inline-count
    id: like-count
    tag: span
    position: "card-bottom-row right"
    size: "auto x 16"
    tokens:
      color: "var(--wds-color-neutral-0) → #FFFFFF"
      font_size: "var(--wds-font-size-xs) → 12px"
      font_weight: "var(--wds-font-weight-semibold) → 600"
      line_height: "1.35"
      gap_icon_to_text: "var(--wds-spacing-2) → 2px"
      text_shadow: "0 1px 2px rgba(0,0,0,0.45) (미디어 위 가독성, Phase 1 regen-count 관례)"
      opacity: "0.9"
    behavior:
      purpose: "AC 3.3 — 좋아요 수를 그리드 카드에도 항상 노출 (실제 숫자, 축약 없음, 0 포함)"
      user_action: null  # 카드 전체가 tap target (상세 이동). badge 단독 탭 없음.
      feedback: null
    states:
      default: "heart filled (#FFFFFF) + count text (e.g. '42')"
      zero: "heart filled (#FFFFFF) + '0'"
      large: "heart filled (#FFFFFF) + '8,600' (ko-KR locale 천단위 콤마, **축약 금지**)"
    layout:
      direction: horizontal
      alignment: center
      sizing: hug
    a11y:
      role: text
      label: "좋아요 {n}"
    constraints:
      max_lines: 1
      truncation: none
      content_policy: "likeCount.toString() 또는 Intl.NumberFormat('ko-KR'). **korean-count 포매터 사용 금지** (app-001 재생성과 구분). 0 도 반드시 노출."

  - name: HeartIcon
    type: svg-icon
    id: like-icon
    tag: svg
    size: "12 x 12"
    tokens:
      fill: "var(--wds-color-neutral-0) → #FFFFFF"
    a11y:
      role: presentation
      label: null
    notes: "filled heart (outlined 사용 금지 — 배지 표시 목적. liked 여부 구분은 뱃지에서 안 함; 토글 UI 는 SwipeFeed LikeButton 만 담당)"

  - name: LikeCountText
    type: text
    id: like-count-text
    tag: span
    tokens:
      font: "600 12px/1.35 Pretendard"
      color: "#FFFFFF"
      text_shadow: "0 1px 2px rgba(0,0,0,0.45)"
    constraints:
      max_lines: 1
      content_policy: "실제 숫자. 4자리 이상 ko-KR 천단위 콤마 (관례). 축약 절대 금지."

  - name: RegenBadge
    type: inline-count
    id: regen-count
    tag: span
    position: "card-bottom-row left"
    size: "auto x 16"
    tokens:
      color: "var(--wds-color-neutral-0) → #FFFFFF"
      font_size: "12px"
      font_weight: "600"
    notes: "Phase 1 app-003 기존 유지. korean-count 포매터 사용 (축약). app-005 scope 아님 — 위치 및 존재만 참조."

  - name: NewBadge
    type: badge
    id: badge-new
    tag: span
    position: "card top-left, padding 8px"
    size: "auto x 20"
    tokens:
      background: "#0080C6 (§1 pattern)"
      color: "#FFFFFF"
      font: "600 12px"
      padding: "4px 8px"
      radius: "8px"
    notes: "선택적. app-005 scope 아님."

  - name: PrivacyIcon
    type: icon
    id: icon-privacy
    tag: span
    position: "card top-right, padding 8px"
    size: "16 x 16"
    tokens:
      fill: "#FFFFFF"
    notes: "비공개 탭 cards 에만 lock icon. Phase 1 유지."
```

## Layout Spec

```yaml
layout_spec:
  type: grid
  viewport: 390x844
  host: ProfileScreen (scroll body)
  regions:
    - id: feed-grid
      layout: "grid-template-columns: 1fr 1fr"
      gap: "1px"
      padding: "0"
      children:
        - id: "card-{n}"
          aspect: "1/1 또는 4/5 (§1 pattern 교차)"
          position: relative
          children:
            - id: card-media
              position: absolute
              inset: 0
            - id: card-overlay
              position: absolute
              inset: 0
              pointer_events: none
            - id: card-top-row
              position: absolute
              top: "8px"
              left: "8px"
              right: "8px"
              justify: space-between
            - id: card-bottom-row
              position: absolute
              bottom: "6px"
              left: "8px"
              right: "8px"
              direction: horizontal
              justify: space-between
              align: center
              children:
                - id: regen-count    # Phase 1 기존
                  direction: horizontal
                  gap: "2px"
                - id: like-count     # ★ app-005 scope
                  direction: horizontal
                  gap: "2px"
```

## States

```yaml
states:
  card-default:
    description: "좋아요 수 > 0 인 일반 카드 (공개/비공개/타유저 공통)"
    active: true
    visible_components: [card-media, card-overlay, card-bottom-row, regen-count, like-count]
    hidden_components: []
    labels:
      like_count: "42"
      regen_count: "382"

  card-zero-likes:
    description: "AC 3.3 — 좋아요 0 인 카드도 뱃지 '0' 항상 노출 (숨김 금지)"
    visible_components: [card-media, card-overlay, card-bottom-row, regen-count, like-count]
    hidden_components: []
    labels:
      like_count: "0"
      regen_count: "0"

  card-large-count:
    description: "4자리 이상 — ko-KR 천단위 콤마 (축약 절대 금지)"
    visible_components: [card-media, card-overlay, card-bottom-row, regen-count, like-count]
    hidden_components: []
    labels:
      like_count: "8,600"        # NOT "8.6천"
      regen_count: "1.2만"        # app-001 소관 — 재생성은 축약 (혼동 금지)

  card-private:
    description: "비공개 탭 카드 — lock icon + 좋아요 뱃지 동일 노출 (본인만 보는 콘텐츠도 셀프 좋아요 카운트 표시)"
    visible_components: [card-media, card-overlay, card-top-row, icon-privacy, card-bottom-row, like-count]
    hidden_components: []
    labels:
      like_count: "1"

  card-new:
    description: "신규 뱃지 + 좋아요 뱃지 공존"
    visible_components: [card-media, card-overlay, card-top-row, badge-new, card-bottom-row, like-count]
    hidden_components: []
    labels:
      like_count: "3"

  empty:
    description: "콘텐츠 없음 — Phase 1 empty-state (app-003) 유지. 본 spec scope 아님"
    visible_components: [empty-state-view]
    hidden_components: [feed-grid]

  loading:
    description: "skeleton grid (Phase 1 유지)"
    visible_components: [skeleton-grid]
    hidden_components: [feed-grid]

  error: null
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#card-{n}"
    action: navigate
    destination: "SwipeFeedScreen (initialContentId={card-id})"
    transition: "slide-up (Phase 1 profile-to-swipe-feed)"
    notes: "카드 전체가 tap target — LikeBadge 단독 탭 없음"

  - trigger: tap
    target: "#like-count"
    action: none
    notes: "배지 단독 탭 없음. 카드 탭과 merge. SwipeFeed 로 이동 후 LikeButton 으로 토글."
```

## Visual Rules

```yaml
rules:
  - condition: "likeCount === 0"
    effect: "뱃지 '0' 노출 (숨김/축약 금지)"
    example: "신규 업로드: heart 12x12 + '0' (white)"

  - condition: "likeCount >= 1000"
    effect: "ko-KR locale 천단위 콤마. **축약 금지** (재생성 뱃지와 구분)"
    example: "8600 → '8,600' (NOT '8.6천'); 재생성은 '8.6천' 으로 축약 (app-001 소관)"

  - condition: "tab === 'private' (본인 비공개)"
    effect: "LikeBadge 동일 노출 (셀프 좋아요 카운트도 카드에 반영)"
    example: "AC 3.1 self-like 적용된 비공개 카드 — '1'"

  - condition: "tab === 'liked' (좋아요 탭 — app-006)"
    effect: "LikeBadge 동일 노출. liked 탭에서도 카드 디자인 동일."
    example: "좋아요 탭 그리드 — 각 카드 우하단 heart + count"

  - condition: "배지 위치"
    effect: "card-bottom-row 우측. 좌측은 RegenBadge (Phase 1 유지)."
    example: "좌: 회전화살표+'382' | 우: heart+'42'"
```

## Labels (ko)

```yaml
labels:
  a11y:
    card: "콘텐츠 카드"
    like_badge: "좋아요 {n}"
    regen_badge: "재생성 {n}"
    new: "신규"
    private: "비공개"
  count_display:
    like_zero: "0"
    like_small: "42"
    like_liked_increment: "43"
    like_large: "8,600"    # 축약 금지, 천단위 콤마
```

## Token Map

```yaml
tokens:
  card_radius: "radius.xs → 4px (§1 magazine grid)"
  card_gap: "1px (§1)"
  card_media_placeholder: "var(--wds-color-neutral-100)"
  overlay_gradient: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.45) 100%)"
  badge_text_color: "primitive.color.neutral-0 → #FFFFFF"
  badge_text_shadow: "0 1px 2px rgba(0,0,0,0.45)"
  badge_font_size: "font.size.xs → 12px"
  badge_font_weight: "font.weight.semibold → 600"
  badge_line_height: "1.35"
  badge_opacity: "0.9"
  badge_gap: "spacing.2 → 2px"
  heart_icon_size: "12 x 12"
  heart_icon_fill: "primitive.color.neutral-0 → #FFFFFF"
  bottom_row_padding: "6px 8px"
  new_badge_bg: "#0080C6 (§1 spec)"
  new_badge_radius: "radius.sm → 8px"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 6
    with_token_map: 6
    with_html_mapping: 6
    score: "12 / 12 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "badge_text_shadow 0 1px 2px rgba(0,0,0,0.45) (Phase 1 regen-count 관례 재사용)"
      - "overlay_gradient 하단 45% 어두운 — §1 pattern 일반 관례"
      - "4자리 이상 ko-KR 천단위 콤마 (task Specification 명시)"
    risk_level: low
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "1 / 1 (AC 3.3 — 실제 숫자로 그리드에도 노출) — 연결"
    what_resolved: "6 / 6 components"
```
