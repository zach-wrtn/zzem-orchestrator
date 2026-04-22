# Screen Spec: SettingsScreen (Figma-aligned)

> Machine-readable 화면 명세. Design Engineer agent가 이 파일을 읽어 HTML 프로토타입을 생성한다.
> **Updated 2026-04-21** from Figma frame `설정` (375×812). Structure now matches Figma exactly.

## Meta

```yaml
screen_name: "SettingsScreen"
task_id: "app-004"
sprint_id: "ugc-platform-001"
app: "ZZEM (MemeApp)"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "375x812 (Figma) / 390x844 (prototype wrap)"
theme: "light"
pattern_source:
  - "Figma: 설정 (375×812)"
  - "docs/designs/component-patterns.md §4 Settings Screen"
```

## Component Tree

```
SettingsScreen [frame: 375x812]
├── StatusBar [system] (div)
├── HeaderBar (header)  # h-48, pl-12 pr-44 py-4
│   ├── BackButton (button) #btn-back  — ArrowshortLeft_Fill_L 24
│   └── Title (h1) — "설정" (18px SemiBold, #262626)
│   # NOTE: no right icon; pr-44 reserves balance
├── Body (main, scroll)  # pt-20, flex-col
│   ├── Group01 계정
│   │   ├── Row:Account [data-menu="account"]  # pl-20 pr-24 py-12
│   │   │   ├── Label "계정"
│   │   │   └── Right: GoogleBadge(20) + "meme@gmail.com" (#8A8A8A)
│   │   └── Row:Password [data-menu="password"]  # pl-20 pr-16 py-12
│   │       ├── Label "비밀번호"
│   │       └── Chevron ›
│   ├── Divider (#F7F7F7, h-12)
│   ├── Group02 설정/정책  # Figma order
│   │   ├── Row:Notifications     [data-menu="notifications"]
│   │   ├── Row:Block             [data-menu="block"]
│   │   ├── Row:CustomerService   [data-menu="customer-service"]   # NEW in Figma
│   │   ├── Row:Terms             [data-menu="terms"]
│   │   └── Row:Privacy           [data-menu="privacy"]
│   ├── Divider (#F7F7F7, h-12)
│   └── Group03 탈퇴/버전
│       ├── Row:Withdraw [data-menu="withdraw"]   # NO chevron
│       └── Row:AppVersion  — "앱 버전" + "1.1.1" (14px SemiBold #8A8A8A, pr-24)
└── BottomAction (div)   # pb-32 pt-16 px-16
    └── LogoutButton (button) #btn-logout
        # h-56, rounded-16, bg #F1F1F1, text #656565 SemiBold 18px
```

### Component Details

```yaml
components:
  - name: "HeaderBar"
    tag: "header"
    size: "full-width x 48px"
    layout: "pl-12 pr-44 py-4, space-between"
    slots:
      left: "BackButton 24px (transparent bg)"
      center: "Title '설정' 18px SemiBold #262626"
      right: null  # pr-44 reserves balance; no icon
    tokens:
      fill: "var(--background_primary) → #FFFFFF"

  - name: "Row:Account"
    tag: "div"
    role: "group"
    data_menu: "account"
    layout: "pl-20 pr-24 py-12, space-between"
    left:
      label: "계정 (16px Medium #262626)"
    right:
      cluster:
        - GoogleBadge: "20×20 circle, bg #FFF, border 0.833px #F1F1F1, 10×10 G logo"
        - Email: "meme@gmail.com (16px Medium #8A8A8A)"
        - gap_between: "4px"
    notes: "display-only row; does not navigate (Figma shows inline value, no chevron)"

  - name: "Row:Password"
    tag: "button"
    data_menu: "password"
    layout: "pl-20 pr-16 py-12"
    right: "chevron ›"

  - name: "Row:Notifications"
    tag: "button"
    data_menu: "notifications"
    layout: "pl-20 pr-16 py-12"
    right: "chevron ›"

  - name: "Row:Block"
    tag: "button"
    data_menu: "block"
    layout: "pl-20 pr-16 py-12"
    right: "chevron ›"

  - name: "Row:CustomerService"
    tag: "button"
    data_menu: "customer-service"
    layout: "pl-20 pr-16 py-12"
    right: "chevron ›"
    status: "NEW IN FIGMA — not in PRD app-004 AC. Flagged for Phase 3.4 PRD amendment."

  - name: "Row:Terms"
    tag: "button"
    data_menu: "terms"
    label: "서비스 이용약관"   # Figma spelling (no space before '약관' in 이용약관)
    layout: "pl-20 pr-16 py-12"
    right: "chevron ›"

  - name: "Row:Privacy"
    tag: "button"
    data_menu: "privacy"
    layout: "pl-20 pr-16 py-12"
    right: "chevron ›"

  - name: "Row:Withdraw"
    tag: "button"
    data_menu: "withdraw"
    layout: "pl-20 pr-16 py-12"
    right: null   # NO chevron
    notes: "Figma renders 탈퇴하기 without chevron."

  - name: "Row:AppVersion"
    tag: "div"
    role: "text"
    layout: "pl-20 pr-24 py-12, space-between"
    left: "앱 버전 (16px Medium #262626)"
    right: "1.1.1 (14px SemiBold #8A8A8A)"
    notes: "Figma value is '1.1.1' (prior baseline mocked '1.42.0')"

  - name: "SectionDivider"
    tag: "div"
    size: "full-width x 12px"
    fill: "#F7F7F7 (surface_secondary)"

  - name: "LogoutButton"
    tag: "button"
    id: "btn-logout"
    container_padding: "pt-16 pb-32 px-16"
    button:
      size: "full-width x 56px"
      padding: "py-12 px-24"
      radius: 16
      fill: "#F1F1F1 (surface_button)"
      text: "로그아웃 18px SemiBold #656565 (text_secondary)"
```

## Layout Spec

```yaml
layout_spec:
  type: flex-column
  viewport: 375x812
  background: "var(--background_primary) → #FFFFFF"
  regions:
    - id: status-bar
      height: fixed(44px)
    - id: header
      sticky: top
      height: fixed(48px)
      padding: "4px 44px 4px 12px"
    - id: body
      scroll: vertical
      flex: 1
      padding_top: 20
      children:
        - group: "group-01-account"
          rows: [row-account, row-password]
        - divider: 12
        - group: "group-02-policies"
          rows: [row-notifications, row-block, row-customer-service, row-terms, row-privacy]
        - divider: 12
        - group: "group-03-withdraw-version"
          rows: [row-withdraw, row-appversion]
    - id: bottom-action
      sticky: bottom
      padding: "16px 16px 32px"
```

## States

```yaml
states:
  default:
    description: "모든 메뉴 + 앱 버전 노출. 로그아웃 하단 고정."
    active: true
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#btn-back"
    action: go-back

  - trigger: tap
    target: '[data-menu="account"]'
    action: none  # display-only row in Figma
    note: "기존 auth 재사용시 이 row에 navigation 추가 검토 (PRD 재확인 필요)"

  - trigger: tap
    target: '[data-menu="password"]'
    action: navigate
    destination: "PasswordSettingsScreen"

  - trigger: tap
    target: '[data-menu="notifications"]'
    action: navigate
    destination: "NotificationPlaceholder"

  - trigger: tap
    target: '[data-menu="block"]'
    action: navigate
    destination: "BlockPlaceholder"

  - trigger: tap
    target: '[data-menu="customer-service"]'
    action: navigate
    destination: "CustomerServicePlaceholder"
    note: "NEW in Figma — no PRD destination yet"

  - trigger: tap
    target: '[data-menu="terms"]'
    action: navigate
    destination: "TermsWebView"

  - trigger: tap
    target: '[data-menu="privacy"]'
    action: navigate
    destination: "PrivacyWebView"

  - trigger: tap
    target: '[data-menu="withdraw"]'
    action: navigate
    destination: "WithdrawConfirmSheet"

  - trigger: tap
    target: "#btn-logout"
    action: navigate
    destination: "LogoutConfirm"
```

## Visual Rules

```yaml
rules:
  - condition: "메뉴 순서는 Figma 준수"
    effect: |
      Group 01 [계정, 비밀번호] →
      Group 02 [알림 설정, 차단 관리, 고객센터, 서비스 이용약관, 개인정보 처리방침] →
      Group 03 [탈퇴하기, 앱 버전]
    note: "baseline PRD 순서와 상이. Figma가 정본 (Phase 3.4 PRD 보정 필요)"
  - condition: "섹션 경계"
    effect: "12px 높이 #F7F7F7 블록"
  - condition: "Row 우측"
    effect: |
      - 계정: Google 배지 + 이메일 (chevron 없음)
      - 비밀번호/알림설정/차단관리/고객센터/이용약관/처리방침: chevron ›
      - 탈퇴하기: chevron 없음
      - 앱 버전: 값 텍스트 (1.1.1)
  - condition: "로그아웃"
    effect: "하단 고정 풀폭 56px 버튼. px-16 pt-16 pb-32."
```

## Labels (ko)

```yaml
labels:
  header:
    title: "설정"
    back: "뒤로"
  rows:
    account: "계정"
    password: "비밀번호"
    notifications: "알림 설정"
    block: "차단 관리"
    customer_service: "고객센터"
    terms: "서비스 이용약관"
    privacy: "개인정보 처리방침"
    withdraw: "탈퇴하기"
    app_version: "앱 버전"
  values:
    account_email: "meme@gmail.com"
    app_version: "1.1.1"
  buttons:
    logout: "로그아웃"
```

## Token Map

```yaml
tokens:
  background:           "var(--background_primary) → #FFFFFF"
  surface_white:        "var(--surface_white) → #FFFFFF"
  section_divider:      "var(--surface_secondary) → #F7F7F7"
  row_text:             "var(--text_primary) → #262626"
  row_value_muted:      "var(--text_tertiary) → #8A8A8A"
  logout_fill:          "var(--surface_button) → #F1F1F1"
  logout_text:          "var(--text_secondary) → #656565"
  logout_radius:        "16px"
  google_badge_border:  "0.833px var(--outline_primary) → #F1F1F1"
  font_family:          "var(--wds-font-family-primary) → Pretendard"
  row_font:             "Pretendard Medium 16px"
  header_font:          "Pretendard SemiBold 18px"
  logout_font:          "Pretendard SemiBold 18px"
  version_value_font:   "Pretendard SemiBold 14px"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 12
    with_token_map: 12
    with_html_mapping: 12
    score: "24 / 24 = 1.0"
  fabrication_risk:
    inferred_fields: []
    risk_level: "none"   # all fields verified from Figma fact sheet
    notes: "Structure 1:1 from Figma. `고객센터` row flagged as NEW (not fabricated — present in Figma but missing from PRD)."
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "4 / 4 (AC-2.8-1 ~ AC-2.8-4)"
    what_resolved: "12 / 12"
  drift_findings:
    - id: "DRIFT-01"
      field: "menu_order"
      baseline: "계정 → 비밀번호 → 이용약관 → 개인정보 → 알림설정 → 차단관리 → 탈퇴 → 버전"
      figma:    "계정 → 비밀번호 | 알림설정 → 차단관리 → 고객센터 → 이용약관 → 개인정보 | 탈퇴 → 버전"
      resolution: "Figma가 정본"
    - id: "DRIFT-02"
      field: "customer_service_row"
      baseline: "absent"
      figma:    "present (5th row of Group 02)"
      resolution: "Phase 3.4 PRD amendment 필요 — CustomerServicePlaceholder 추가"
    - id: "DRIFT-03"
      field: "account_row_right_content"
      baseline: "chevron ›"
      figma:    "Google badge 20px + email 'meme@gmail.com' (#8A8A8A), no chevron"
      resolution: "Figma 반영 — display-only row"
    - id: "DRIFT-04"
      field: "withdraw_row_chevron"
      baseline: "chevron ›"
      figma:    "no chevron"
      resolution: "Figma 반영"
    - id: "DRIFT-05"
      field: "app_version_value"
      baseline: "1.42.0 (mock)"
      figma:    "1.1.1"
      resolution: "Figma 값으로 교체 (프로덕션에서는 동적 주입)"
    - id: "DRIFT-06"
      field: "section_count"
      baseline: "4 groups (3 dividers)"
      figma:    "3 groups (2 dividers)"
      resolution: "Figma 반영"
    - id: "DRIFT-07"
      field: "logout_padding"
      baseline: "pt-16 pb-34 px-20"
      figma:    "pt-16 pb-32 px-16"
      resolution: "Figma 반영"
```
