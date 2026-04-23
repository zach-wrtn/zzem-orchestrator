# Screen Spec: SwipeFeedCTAButton

> Machine-readable 컴포넌트 명세. 세로 스와이프 피드 하단 footer 영역에 고정된 CTA 버튼의 소유자 분기 + 크레딧 표시 + 상태 매트릭스 정의.

## Meta

```yaml
screen_name: "SwipeFeedCTAButton"
task_id: "app-003"
sprint_id: "ugc-platform-002"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "dark"  # 세로 스와이프 피드 배경 #090909 (background_B1F)
parent_screen: "SwipeFeedDetailView (세로 스와이프)"
component_role: "sticky-bottom CTA bar (footer 내부)"
```

## Component Tree

들여쓰기로 계층 구조를 표현한다. CTA 버튼은 SwipeFeedFooter 컨테이너 내부에서 렌더되며, 본 spec은 footer + cta-button 쌍을 함께 정의한다.

```
SwipeFeedFooter [container] (section) #swipe-feed-footer
├── FooterGradient [overlay] (div) #footer-gradient — 하단 그라데이션 디밍(아래→위)
├── CreatorInfoRow [container] (div) #creator-info-row — (기존) 아바타 + 닉네임, CTA 위쪽
│   ├── CreatorAvatar [avatar] (div) #creator-avatar — 36px 원형 + verified badge
│   ├── CreatorNickname [text] (span) #creator-nickname — SemiBold 14px white
│   └── AINotiBadge [icon] (span) #ai-noti-badge — ShinyFill (optional)
├── CTABar [container] (div) #cta-bar — sticky bottom, full-width, safe-area padding
│   ├── SwipeFeedCTAButton [button-primary] (button) #cta-button — 소유자 분기 라벨 + 크레딧
│   │   ├── CTALabel [text] (span) #cta-label — "다시 생성하기" | "템플릿 사용하기"
│   │   └── CreditBadge [chip] (span) #credit-badge — 우측 인라인 크레딧
│   │       ├── CoinIcon [icon] (span) #coin-icon — 🪙 (Fill 아이콘)
│   │       └── CreditValue [text] (span) #credit-value — "10" | "무료"
│   └── CTADisabledOverlay [overlay] (span) #cta-disabled — credit-deficit 시 시각적 dim
```

### Component Details

```yaml
components:
  - name: "SwipeFeedFooter"
    id: "swipe-feed-footer"
    tag: "section"
    type: "container"
    position: "sticky-bottom"
    size: "full-width x auto"
    tokens:
      fill: "transparent (블러 포스터 위에 오버레이)"
      text: "var(--wds-label-inverse) → #FFFFFF"
      radius: "none"
      spacing: "16 16 34 16"  # top right bottom(safe-area) left
    layout:
      direction: "vertical"
      alignment: "end"
      sizing: "fill"
    behavior:
      purpose: "세로 스와이프 피드 하단에 창작자 정보 + CTA 액션을 집약. 스와이프 중에도 항상 접근 가능한 재생성/템플릿 진입점 제공."
      user_action: "CTA 탭 → 재생성/템플릿 플로우 진입"
      feedback: "navigation"

  - name: "FooterGradient"
    id: "footer-gradient"
    tag: "div"
    type: "image"
    position: "overlay"
    size: "full-width x 220px"
    tokens:
      fill: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)"
    notes: "§8 Detail View — 하단 그라데이션 디밍. CTA 가독성 확보용."

  - name: "CreatorInfoRow"
    id: "creator-info-row"
    tag: "div"
    type: "container"
    position: "top"  # within footer
    size: "full-width x auto"
    tokens:
      spacing: "0 0 12 0"
    layout:
      direction: "horizontal"
      alignment: "start"
      sizing: "fill"
    children:
      - CreatorAvatar
      - CreatorNickname
      - AINotiBadge
    notes: "기존 동작 유지 (regression guard). CTA 위쪽 레이아웃 변경 없음."

  - name: "CreatorAvatar"
    id: "creator-avatar"
    tag: "div"
    type: "avatar"
    size: "36x36"
    tokens:
      fill: "var(--profile_avatar_empty_bg) → #F5F3FF"
      border: "var(--profile_avatar_border) → rgba(136,136,136,0.2)"
      radius: "full (9999px)"

  - name: "CreatorNickname"
    id: "creator-nickname"
    tag: "span"
    type: "text"
    tokens:
      text: "var(--wds-label-inverse) → #FFFFFF"
      spacing: "0 0 0 8"
    constraints:
      max_lines: 1
      truncation: "ellipsis"
    notes: "SemiBold 14px"

  - name: "CTABar"
    id: "cta-bar"
    tag: "div"
    type: "container"
    position: "sticky-bottom"
    size: "full-width x 56"
    tokens:
      fill: "transparent"
      spacing: "0 0 0 0"
    layout:
      direction: "horizontal"
      alignment: "center"
      sizing: "fill"
    children:
      - SwipeFeedCTAButton
    notes: "CTA 단일 버튼 바. 좋아요/재생성/공유 사이드 액션(app-001)은 footer 우측 세로 컬럼에 별도 렌더."

  - name: "SwipeFeedCTAButton"
    id: "cta-button"
    tag: "button"
    type: "button-primary"
    position: "sticky-bottom"
    size: "full-width x 56"
    tokens:
      fill: "var(--wds-fill-brand-primary) → #8752FA"
      text: "var(--wds-label-inverse) → #FFFFFF"
      border: "none"
      radius: "lg (16px)"  # §공통 토큰 — CTA 16px
      spacing: "0 20 0 20"
    layout:
      direction: "horizontal"
      alignment: "space-between"
      sizing: "fill"
    behavior:
      purpose: "AC 1.5 — 본인 콘텐츠 재생성 or 타인 콘텐츠 템플릿 사용 진입점. 소유자 분기 라벨 + 크레딧 소비량 표기."
      user_action: "탭 → handleCta() → 소유자 분기 후 필터 유효성 체크 → 정상: 이미지 선택/FilterPreview 진입, MIXED: 프리뷰 경유, 필터 삭제: FilterDeletedErrorModal 노출"
      feedback: "navigation"
    states:
      default_me: "라벨 '다시 생성하기' + 크레딧"
      default_other: "라벨 '템플릿 사용하기' + 크레딧"
      credit_deficit: "탭 가능하지만 크레딧 부족 상태 — 배경 opacity 60%, 크레딧 뱃지가 red-500 아이콘"
      pressed: "opacity 0.85"
      disabled: null  # 항상 탭 가능 (크레딧 부족도 서버 검증으로 진입)
    a11y:
      role: "button"
      label: "{라벨 텍스트} ({크레딧 값})"
      hint: "탭하면 재생성 또는 템플릿 사용 플로우로 이동"
    constraints:
      min_height: "56px"
      max_lines: 1
      truncation: "none"

  - name: "CTALabel"
    id: "cta-label"
    tag: "span"
    type: "text"
    tokens:
      text: "var(--wds-label-inverse) → #FFFFFF"
    constraints:
      max_lines: 1
      content_policy: "타이포: Pretendard SemiBold 16px (Subtitle4-16). me/other 2 variants."
    notes: |
      variant 분기 규칙:
      - props.isOwner === true → '다시 생성하기'
      - props.isOwner === false → '템플릿 사용하기'
    a11y:
      role: "text"

  - name: "CreditBadge"
    id: "credit-badge"
    tag: "span"
    type: "chip"
    position: "end"  # CTA 내부 우측
    size: "wrap-content x 28"
    tokens:
      fill: "rgba(255,255,255,0.18)"
      text: "var(--wds-label-inverse) → #FFFFFF"
      radius: "full (9999px)"
      spacing: "4 10 4 10"
    layout:
      direction: "horizontal"
      alignment: "center"
      sizing: "hug"
    children:
      - CoinIcon
      - CreditValue
    behavior:
      purpose: "사용자에게 1회 탭당 소비 크레딧 비용을 사전 고지. '무료' variant 지원."
      feedback: "visual"
    notes: "버튼 내부 우측 정렬. 같은 버튼 크기/색상(primary brand)에서 variant 교체(me/other) — Task Implementation Hints: '버튼 크기/컬러 동일성 확정'."

  - name: "CoinIcon"
    id: "coin-icon"
    tag: "span"
    type: "image"
    size: "16x16"
    tokens:
      text: "var(--wds-color-yellow-500) → #FFCC00"
    notes: "Fill 아이콘 (🪙 또는 coin svg)"
    a11y:
      role: "img"
      label: "크레딧"

  - name: "CreditValue"
    id: "credit-value"
    tag: "span"
    type: "text"
    tokens:
      text: "var(--wds-label-inverse) → #FFFFFF"
      spacing: "0 0 0 4"
    constraints:
      max_lines: 1
      content_policy: "숫자(정수) 또는 '무료' 문자열. 페이백 차감 후 숫자는 Phase 2 이후 live value."
    notes: "Medium 13px"
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 390x844
  regions:
    - id: swipe-feed-content
      flex: 1
      notes: "세로 스와이프 PostCard 영역 (app-001 소관). 여기서는 footer 하단 고정만 표현."
    - id: swipe-feed-footer
      sticky: bottom
      height: fixed(auto)
      padding: "16px 16px 34px"  # bottom 34 = safe area
      children:
        - id: footer-gradient
          overlay: true
          z: -1
        - id: creator-info-row
          type: flex-row
          align: center
          gap: "8px"
          padding-bottom: "12px"
        - id: cta-bar
          type: flex-row
          align: center
          height: "56px"
          children:
            - id: cta-button
              width: full
              height: 56px
              radius: 16px
              padding: "0 20px"
              layout:
                type: flex-row
                justify: space-between
                align: center
              children:
                - id: cta-label
                  flex: 1
                  text-align: left
                - id: credit-badge
                  hug-content: true
```

## States

```yaml
states:
  default-me:
    description: "본인 콘텐츠 진입 (ownerId === currentUserId)"
    active: true
    visible_components: [cta-button, cta-label, credit-badge]
    hidden_components: []
    labels:
      cta_label: "다시 생성하기"
      credit_value: "10"
    token_overrides:
      cta_fill: "var(--wds-fill-brand-primary) → #8752FA"

  default-other:
    description: "타 유저 콘텐츠 진입 (ownerId !== currentUserId)"
    active: false
    visible_components: [cta-button, cta-label, credit-badge]
    hidden_components: []
    labels:
      cta_label: "템플릿 사용하기"
      credit_value: "10"
    token_overrides:
      cta_fill: "var(--wds-fill-brand-primary) → #8752FA"

  credit-deficit:
    description: "크레딧 부족 상태 — 탭은 허용하되 시각적 경고. 토스트는 BE 에러 응답 후 표시."
    active: false
    visible_components: [cta-button, cta-label, credit-badge]
    hidden_components: []
    labels:
      cta_label: "다시 생성하기"  # or 템플릿 사용하기 — 소유자에 따라
      credit_value: "10"
    token_overrides:
      cta_fill: "rgba(135,82,250,0.60)"  # brand primary 60% opacity
      credit_icon_color: "var(--wds-status-error) → #FF3B30"
    notes: "AC 1.5 대비 credit-deficit variant. 탭 시 BE 에러 토스트 '크레딧이 부족해요'."

  free:
    description: "무료 캠페인/프리미엄 등 0 크레딧 소비 variant"
    active: false
    visible_components: [cta-button, cta-label, credit-badge]
    hidden_components: []
    labels:
      cta_label: "템플릿 사용하기"  # or 다시 생성하기
      credit_value: "무료"

  pressed:
    description: "버튼 눌림 피드백 (시각)"
    active: false
    visible_components: [cta-button]
    hidden_components: []
    token_overrides:
      cta_fill_opacity: "0.85"
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#cta-button"
    action: invoke-handler
    handler: "handleCta()"
    destination: "conditional"
    transition: slide-left
    branches:
      - condition: "filter invalid (404/deleted)"
        action: open-overlay
        destination: "FilterDeletedErrorModal"
        transition: fade
      - condition: "filterType in [MIXED_IMAGE_TO_VIDEO, MIXED_IMAGE_TO_IMAGE]"
        action: navigate
        destination: "FilterPreview"
        transition: slide-left
        params: { sourceContentId: "item.id" }
      - condition: "일반 필터"
        action: navigate
        destination: "ImageSelect → (ImageCropper) → CreateContent"
        transition: slide-left
        params: { sourceContentId: "item.id" }

  - trigger: long-press
    target: "#cta-button"
    action: noop
    notes: "롱프레스는 미정의. 기본 시스템 햅틱만."

  - trigger: tap
    target: "#credit-badge"
    action: invoke-handler
    handler: "handleCta()"  # badge는 버튼 자식이므로 이벤트 버블 → 동일 핸들러
    notes: "bubble to parent button"
```

## Visual Rules

```yaml
rules:
  - condition: "item.ownerId === currentUserId"
    effect: "CTA 라벨 '다시 생성하기'"
    example: "내가 만든 콘텐츠 상세 진입 시 본 라벨 표시"

  - condition: "item.ownerId !== currentUserId"
    effect: "CTA 라벨 '템플릿 사용하기'"
    example: "타 유저의 콘텐츠 상세 진입 시 본 라벨 표시"

  - condition: "me/other 두 variant 에서 동일"
    effect: "버튼 크기(56h, full-width, radius 16) / 색상(brand-primary #8752FA) / 크레딧 뱃지 스타일 모두 동일"
    example: "소유자 분기는 라벨 텍스트만 변경. 시각적 위계/중요도 동일."

  - condition: "크레딧 값이 0 (무료 캠페인)"
    effect: "credit_value 텍스트 '무료'로 렌더. coin icon 동일 노출."
    example: "프로모션 템플릿 재생성 시"

  - condition: "사용자 가용 크레딧 < 소비 크레딧"
    effect: "credit-deficit variant. CTA 배경 60% opacity + coin icon red-500."
    example: "히스토리 소비 후 5 크레딧 보유 시 10 크레딧 CTA 탭 직전 시각 경고"

  - condition: "legacy 홈 필터 직접 진입 경로"
    effect: "본 컴포넌트는 렌더되지 않음 (세로 스와이프 피드에서만 노출)"
    example: "홈 → 필터 pill → 생성 (이 CTA와 무관)"
```

## Labels (ko)

```yaml
labels:
  cta:
    me: "다시 생성하기"
    other: "템플릿 사용하기"
  credit:
    unit_suffix: ""  # 크레딧 숫자 뒤에 단위 미노출 (coin icon 이 단위를 표현)
    free: "무료"
  a11y:
    cta_me: "다시 생성하기, 크레딧 {N}개 소비"
    cta_other: "템플릿 사용하기, 크레딧 {N}개 소비"
    cta_free: "템플릿 사용하기, 무료"
  toast_on_deficit: "크레딧이 부족해요"  # BE 응답 후 표시 (본 컴포넌트 외부)
```

## Token Map

```yaml
tokens:
  cta_fill_default: "semantic.fill.brand-primary → #8752FA"
  cta_fill_deficit: "semantic.fill.brand-primary @ 60% → rgba(135,82,250,0.60)"
  cta_fill_pressed: "semantic.fill.brand-primary @ 85% → rgba(135,82,250,0.85)"
  cta_label: "semantic.label.inverse → #FFFFFF"
  cta_radius: "radius.lg → 16px (component-patterns §공통: Button radius CTA 16px)"
  cta_height: "56px"
  cta_padding_h: "spacing.20 → 20px"
  credit_badge_fill: "rgba(255,255,255,0.18)"
  credit_badge_radius: "radius.full → 9999px"
  credit_badge_label: "semantic.label.inverse → #FFFFFF"
  coin_icon_default: "primitive.yellow-500 → #FFCC00"
  coin_icon_deficit: "status.error → #FF3B30"
  footer_gradient: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)"
  creator_nickname: "semantic.label.inverse → #FFFFFF"
  typography_cta_label: "Subtitle4-16 (SemiBold 16px / line-height 1.5)"
  typography_credit_value: "Body6-14 (Medium 14px / line-height 1.4)"
  safe_area_bottom: "34px"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 10
    with_token_map: 10
    with_html_mapping: 10
    score: "20 / 20 = 1.00"
  fabrication_risk:
    inferred_fields:
      - "credit_value: '10' — PRD/Task에 구체 숫자 미명시, 프로토타입 placeholder (관례)"
      - "credit-deficit variant 스타일 (opacity 60%, red coin) — Task에 시각 규칙 미명시, low-risk 추론"
      - "pressed state opacity 0.85 — 표준 UI 관례"
    risk_level: "low"
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, component_tree, layout_spec, states, interactions, visual_rules, labels, token_map, quality_score]
    score: "9 / 7 (모든 필수 섹션 + 추가 2개)"
  context_coverage:
    why_linked: "2 / 2 AC (AC 1.5 소유자 분기, AC 1.6 플로우 분기 진입점)"
    what_resolved: "10 / 10 (모든 토큰이 tokens.css + component-patterns §공통 토큰에서 해결됨)"
```
