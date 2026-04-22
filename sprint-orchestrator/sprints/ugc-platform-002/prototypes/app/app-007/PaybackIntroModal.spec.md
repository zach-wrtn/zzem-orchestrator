# Screen Spec: PaybackIntroModal

> Machine-readable spec. App-007 — 최초 공개 1회성 페이백 안내 모달 (AC 4.4).
> BottomSheet 패턴 (component-patterns.md §10 + §5 BottomSheetWithHandle).

## Meta

```yaml
screen_name: "PaybackIntroModal"
task_id: "app-007"
sprint_id: "ugc-platform-002"
app: "ZZEM (MemeApp)"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light"
overlay_type: "bottom-sheet"
```

## Component Tree

```
Overlay [overlay-root] (div) #payback-intro-overlay
├── Backdrop [dimmed-layer] (div) #payback-intro-backdrop — dimmed rgba(0,0,0,0.40), NON-DISMISS
└── Sheet [bottom-sheet] (section) #payback-intro-sheet
    ├── Handle [decorative] (div) #sheet-handle — 40x4 pill
    ├── IllustrationWrap [container] (div) #illustration-wrap
    │   └── PaybackIllustration [inline-svg] (svg) #payback-illustration — 크레딧 coin + 하트 조합
    ├── TextGroup [container] (div) #text-group
    │   ├── Title [text] (h2) #payback-title — "쨈 런칭 기념 프로모션 크레딧 1% 페이백"
    │   └── Body [text] (p) #payback-body — "내 콘텐츠를 다른 유저가 재생성하면, 소비한 크레딧의 1%가 나에게 적립돼요."
    └── CTAButton [button-primary] (button) #payback-confirm-cta — "확인했어요"
```

### Component Details

```yaml
components:
  - name: "Backdrop"
    id: "payback-intro-backdrop"
    tag: "div"
    type: "container"
    position: "overlay"
    size: "full-width x full-height"
    tokens:
      fill: "semantic.background.dimmed → rgba(0,0,0,0.40)"
      text: "none"
      border: "none"
      radius: "none"
      spacing: "0"
    children: []
    notes: "Tap 비허용 — 1회성 안내이므로 CTA 탭으로만 dismiss."
    behavior:
      purpose: "모달 포커스 유지 + 배경 콘텐츠 시각 분리"
      user_action: "none (backdrop tap 닫기 금지)"
      feedback: "visual"
    a11y:
      role: "presentation"
      label: "배경 영역"

  - name: "Sheet"
    id: "payback-intro-sheet"
    tag: "section"
    type: "bottom-sheet"
    position: "sticky-bottom"
    size: "390 x wrap-content"
    tokens:
      fill: "semantic.background.normal → #FFFFFF"
      text: "semantic.label.normal → #212228"
      border: "none"
      radius: "28 28 0 0 (top only, §10)"
      spacing: "24 20 32 20"
    children: [sheet-handle, illustration-wrap, text-group, payback-confirm-cta]
    behavior:
      purpose: "1회성 페이백 프로모션 고지 컨테이너 (AC 4.4)"
      user_action: "CTA 탭으로 닫기"
      feedback: "navigation"
    layout:
      direction: "vertical"
      alignment: "center"
      sizing: "hug"

  - name: "Handle"
    id: "sheet-handle"
    tag: "div"
    type: "divider"
    position: "top"
    size: "40x4"
    tokens:
      fill: "--pe-sheet-handle → #A7A7A7"
      radius: "full (2px)"
      spacing: "0"
    children: []
    notes: "시각적 핸들만 — drag-dismiss 없음."
    a11y:
      role: "presentation"
      label: null

  - name: "IllustrationWrap"
    id: "illustration-wrap"
    tag: "div"
    type: "container"
    position: "top"
    size: "full-width x 120px"
    tokens:
      fill: "semantic.fill.brand-weak → #F5F0FF"
      radius: "lg (16px)"
      spacing: "20"
    children: [payback-illustration]
    layout:
      direction: "vertical"
      alignment: "center"
      sizing: "fill"

  - name: "PaybackIllustration"
    id: "payback-illustration"
    tag: "svg"
    type: "image"
    position: "center"
    size: "80x80"
    tokens:
      fill: "semantic.fill.brand-primary → #8752FA"
    children: []
    notes: "inline SVG (코인 + 하트). 실제 에셋 없음 — Prototype placeholder."
    a11y:
      role: "img"
      label: "크레딧 페이백 일러스트"

  - name: "Title"
    id: "payback-title"
    tag: "h2"
    type: "text"
    position: "top"
    size: "full-width x wrap"
    tokens:
      text: "semantic.label.normal → #212228"
      spacing: "0 0 8 0"
    children: []
    notes: "PRD 직역 — 수정 금지. font-size 20 / weight 700 / line-height 1.35."
    a11y:
      role: "heading"
      label: "쨈 런칭 기념 프로모션 크레딧 1% 페이백"
    constraints:
      max_lines: 2
      truncation: "none"
      content_policy: "PRD 원문 고정"

  - name: "Body"
    id: "payback-body"
    tag: "p"
    type: "text"
    position: "center"
    size: "full-width x wrap"
    tokens:
      text: "semantic.label.alternative → #6B6E76"
      spacing: "0"
    children: []
    notes: "PRD 직역. font-size 14 / weight 400 / line-height 1.5."
    a11y:
      role: "text"
      label: "내 콘텐츠를 다른 유저가 재생성하면, 소비한 크레딧의 1%가 나에게 적립돼요."
    constraints:
      max_lines: 3
      truncation: "none"
      content_policy: "PRD 원문 고정"

  - name: "CTAButton"
    id: "payback-confirm-cta"
    tag: "button"
    type: "button-primary"
    position: "bottom"
    size: "full-width x 52px"
    tokens:
      fill: "semantic.fill.brand-primary → #8752FA"
      text: "semantic.label.inverse → #FFFFFF"
      radius: "md (12px)"
      spacing: "14 16"
    children: []
    notes: "Single CTA. Tap → flag set + dismissing 상태 → close overlay."
    behavior:
      purpose: "1회성 안내 확인 + flag set"
      user_action: "tap"
      feedback: "visual + navigation (sheet dismiss)"
    states:
      default: "brand-primary fill + white label"
      pressed: "opacity 0.85"
      disabled: null
      loading: null
      error: null
    a11y:
      role: "button"
      label: "확인했어요, 페이백 안내 닫기"
    constraints:
      min_height: "52px"
      max_lines: 1
```

## Layout Spec

```yaml
layout_spec:
  type: overlay
  viewport: 390x844
  regions:
    - id: backdrop
      position: absolute
      inset: "0"
      z_index: 900
      interaction: "blocking but non-dismiss"
    - id: sheet
      position: absolute
      bottom: 0
      left: 0
      right: 0
      z_index: 901
      width: 390px
      height: auto
      border_radius_top: 28px
      padding: "12px 20px 32px"
      safe_area_bottom: "+24px"
      children:
        - id: sheet-handle
          type: centered
          margin_top: 0
          margin_bottom: 16px
          width: 40px
          height: 4px
        - id: illustration-wrap
          type: flex-column
          align: center
          justify: center
          height: 120px
          margin_bottom: 20px
        - id: text-group
          type: flex-column
          align: center
          text_align: center
          gap: 8px
          margin_bottom: 24px
        - id: payback-confirm-cta
          type: full-width
          height: 52px
```

## States

```yaml
states:
  default:
    description: "오픈 상태 (최초 공개 직후 노출)"
    active: true
    visible_components: [payback-intro-backdrop, payback-intro-sheet, sheet-handle, illustration-wrap, payback-illustration, text-group, payback-title, payback-body, payback-confirm-cta]
    hidden_components: []

  dismissing:
    description: "CTA 탭 직후 fade-out + slide-down (200ms)"
    visible_components: [payback-intro-backdrop, payback-intro-sheet]
    hidden_components: []
    transition:
      backdrop: "opacity 1 → 0 / 200ms ease-out"
      sheet: "translateY(0) → translateY(100%) / 200ms ease-out"
    next_state: "hidden (overlay unmounted + flag set)"

  hidden:
    description: "flag 이미 set 또는 dismiss 완료"
    visible_components: []
    hidden_components: [payback-intro-overlay]
```

## Interactions

```yaml
interactions:
  - trigger: mount
    target: "#payback-intro-overlay"
    action: open-overlay
    destination: "PaybackIntroModal"
    transition: slide-up (300ms ease-out)
    precondition: "userStorage['PAYBACK_INTRO_SHOWN'] !== true AND 최초 공개 이벤트"

  - trigger: tap
    target: "#payback-confirm-cta"
    action: close-overlay
    transition: slide-down + fade (200ms)
    side_effects:
      - "userStorage.setItem('PAYBACK_INTRO_SHOWN', true)"
      - "emit 'payback-intro-dismissed' event"

  - trigger: tap
    target: "#payback-intro-backdrop"
    action: none
    notes: "Backdrop tap 닫기 비허용 — AC 명시. 이벤트 무시."
```

## Visual Rules

```yaml
rules:
  - condition: "최초 공개 이벤트 + flag false + 로그인 상태"
    effect: "PaybackIntroModal overlay 마운트 + slide-up"
    example: "생성 완료 직후 자동 공개 성공 시점"

  - condition: "flag === true"
    effect: "overlay 렌더 안 함 (완전 스킵)"
    example: "2회차 이후 공개 시 — 모달 노출 금지"

  - condition: "비로그인"
    effect: "트리거 자체 skip"
    example: "인증 세션 없음 → 공개 기능 접근 불가"

  - condition: "CTA tap"
    effect: "flag set 후 sheet 닫힘. 이 외 경로로 닫힐 수 없음"
    example: "Android 백버튼, 앱 백그라운드 → 모달 유지 (재진입 시 다시 노출)"
```

## Labels (ko)

```yaml
labels:
  title: "쨈 런칭 기념 프로모션 크레딧 1% 페이백"
  body: "내 콘텐츠를 다른 유저가 재생성하면, 소비한 크레딧의 1%가 나에게 적립돼요."
  cta: "확인했어요"
  a11y:
    illustration: "크레딧 페이백 일러스트"
    cta_hint: "탭하면 안내가 닫혀요"
```

## Token Map

```yaml
tokens:
  backdrop: "semantic.background.dimmed → rgba(0,0,0,0.40)"
  sheet_fill: "semantic.background.normal → #FFFFFF"
  sheet_radius_top: "--wds-radius-28 → 28px"
  handle_fill: "--pe-sheet-handle → #A7A7A7"
  handle_radius: "--wds-radius-full → 9999px"
  illustration_bg: "semantic.fill.brand-weak → #F5F0FF"
  illustration_bg_radius: "--wds-radius-lg → 16px"
  illustration_accent: "semantic.fill.brand-primary → #8752FA"
  illustration_heart: "--wds-color-red-500 → #FF3B30"
  title_color: "semantic.label.normal → #212228"
  title_size: "--wds-font-size-2xl → 20px"
  title_weight: "--wds-font-weight-bold → 700"
  body_color: "semantic.label.alternative → #6B6E76"
  body_size: "--wds-font-size-md → 14px"
  body_weight: "--wds-font-weight-regular → 400"
  cta_fill: "semantic.fill.brand-primary → #8752FA"
  cta_label: "semantic.label.inverse → #FFFFFF"
  cta_radius: "--wds-radius-md → 12px"
  cta_height: "52px (tap target)"
  spacing_sheet_x: "--wds-spacing-20 → 20px"
  spacing_sheet_bottom: "--wds-spacing-32 → 32px"
  spacing_text_gap: "--wds-spacing-8 → 8px"
  spacing_block_gap: "--wds-spacing-20 → 20px"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 8
    with_token_map: 8
    with_html_mapping: 8
    score: "16 / 16 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "illustration: PRD가 'Prototype 에서 확정' 위임 → inline SVG placeholder (coin + heart)"
      - "sheet vs full-screen 선택: Prototype 확정 위임 → BottomSheet 선택 (§10 app 표준 패턴)"
    risk_level: "low"
    rationale: "PRD 직역 문구는 100% 보존. 시각적 구체화만 표준 UI 패턴 관례로 추가."
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "1 / 1 AC (AC-4.4 → PaybackIntroModal)"
    what_resolved: "8 / 8 토큰 그룹 확인"
```
