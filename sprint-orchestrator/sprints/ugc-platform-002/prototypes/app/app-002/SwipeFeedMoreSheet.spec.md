# Screen Spec: SwipeFeedMoreSheet

> Machine-readable 명세. Bottom sheet menu launched from SwipeFeed `MoreButton`.
> 2 variants: `me` (내 콘텐츠) vs `other` (타 유저 콘텐츠). Owner-conditional 3-item menu.

## Meta

```yaml
screen_name: "SwipeFeedMoreSheet"
task_id: "app-002"
sprint_id: "ugc-platform-002"
app: "ZZEM (MemeApp)"
platform: "iOS / Android (React Native, @gorhom/bottom-sheet)"
language: "ko"
frame: "390x844 (iPhone 14 Pro) — sheet overlays SwipeFeed"
theme: "light sheet over dark (#090909) SwipeFeed bg"
parent_screen: "SwipeFeedScreen"
trigger: "app-001 MoreButton (⋯)"
pattern_source:
  - "docs/designs/component-patterns.md §10 Bottom Sheet (공통)"
  - "docs/designs/component-patterns.md §8 Detail View — 더보기 바텀시트"
  - "PRD app-002 / AC 1.7 (소유자 분기 메뉴)"
  - "선례: ugc-platform-001/app-004 SettingsScreen row pattern"
variants:
  - id: "me"
    condition: "item.ownerId === myUserId"
    menu_order: ["download", "feedback", "delete"]
  - id: "other"
    condition: "item.ownerId !== myUserId"
    menu_order: ["download", "feedback", "report"]
```

## Component Tree

```
Overlay [position: fixed, inset: 0] #more-sheet-overlay
├── Backdrop (div) #more-sheet-backdrop — rgba(0,0,0,0.40)
└── Sheet [type: bottom-sheet] (div) #swipe-feed-more-sheet
    ├── Handle (div) #sheet-handle — 40x4, #A7A7A7, top-12 centered
    ├── MenuList [container] (ul) #more-menu-list — pt-8 pb-32 px-0
    │   ├── MenuItem:Download   [type: menu-row] (button) #more-menu-download
    │   │   ├── Icon (span) — DownloadStroke 24px (↓)
    │   │   └── Label (span) — "다운로드"
    │   ├── MenuItem:Feedback   [type: menu-row] (button) #more-menu-feedback
    │   │   ├── Icon (span) — MailSendStroke 24px (✉)
    │   │   └── Label (span) — "의견 보내기"
    │   └── MenuItem:Terminal   [type: menu-row] (button) #more-menu-terminal
    │       # variant "me"    → #more-menu-delete   (destructive red, Label="삭제",    Icon=TrashStroke 🗑)
    │       # variant "other" → #more-menu-report   (neutral,         Label="신고하기", Icon=SirenStroke 🚨)
    │       ├── Icon (span)
    │       └── Label (span)
    └── SafeAreaSpacer (div) — pb-safe (34px iOS)
```

### Component Details

```yaml
components:
  - name: "Backdrop"
    id: "more-sheet-backdrop"
    tag: "div"
    type: "overlay"
    position: "fixed inset-0"
    tokens:
      fill: "var(--sheet-backdrop, rgba(0,0,0,0.4))"
    behavior:
      purpose: "시트 외부 영역 탭 시 시트 닫기"
      user_action: "tap outside sheet"
      feedback: "navigation (close sheet)"
    a11y:
      role: "button"
      label: "닫기"

  - name: "Sheet"
    id: "swipe-feed-more-sheet"
    tag: "div"
    type: "bottom-sheet"
    position: "sticky-bottom"
    size: "full-width x wrap-content"
    tokens:
      fill: "var(--sheet-surface, #FFFFFF)"
      radius: "28px 28px 0 0 (top-only)"
      spacing: "pt-12 pb-32"
    layout:
      direction: "vertical"
      alignment: "start"
      sizing: "hug"
    a11y:
      role: "dialog"
      label: "더보기 메뉴"

  - name: "Handle"
    id: "sheet-handle"
    tag: "div"
    type: "decoration"
    size: "40x4"
    position: "top-center (pt-12)"
    tokens:
      fill: "var(--sheet-handle, #A7A7A7)"
      radius: "var(--wds-radius-full) → 9999px"
    a11y:
      role: "presentation"

  - name: "MenuItem:Download"
    id: "more-menu-download"
    tag: "button"
    type: "menu-row"
    size: "full-width x 56px"
    tokens:
      fill: "transparent (press: var(--wds-interaction-pressed))"
      text: "var(--wds-text-primary) → #262626"
      spacing: "py-16 pl-20 pr-24 gap-12"
      font: "Pretendard Medium 16px"
    children: ["Icon(DownloadStroke)", "Label(다운로드)"]
    behavior:
      purpose: "콘텐츠를 사용자 갤러리로 저장"
      user_action: "tap"
      feedback: "toast (성공: '저장됐어요') + sheet close"
    states:
      default: "아이콘 + 라벨"
      disabled: null
      loading: "(추후) 다운로드 진행 시 스피너"
    layout:
      direction: "horizontal"
      alignment: "start"
      sizing: "fill"
    a11y:
      role: "button"
      label: "다운로드"
    constraints:
      min_height: "56px"

  - name: "MenuItem:Feedback"
    id: "more-menu-feedback"
    tag: "button"
    type: "menu-row"
    size: "full-width x 56px"
    tokens:
      fill: "transparent"
      text: "var(--wds-text-primary) → #262626"
      spacing: "py-16 pl-20 pr-24 gap-12"
      font: "Pretendard Medium 16px"
    children: ["Icon(MailSendStroke)", "Label(의견 보내기)"]
    behavior:
      purpose: "의견 입력 화면으로 진입"
      user_action: "tap"
      feedback: "navigation → Feedback screen (기존 재사용)"
    a11y:
      role: "button"
      label: "의견 보내기"

  - name: "MenuItem:Delete"
    id: "more-menu-delete"
    variant: "me"
    tag: "button"
    type: "menu-row destructive"
    size: "full-width x 56px"
    tokens:
      fill: "transparent (press: var(--wds-interaction-pressed))"
      text: "var(--wds-destructive-text) → #D92800"
      spacing: "py-16 pl-20 pr-24 gap-12"
      font: "Pretendard Medium 16px"
    children: ["Icon(TrashStroke, color=#D92800)", "Label(삭제, color=#D92800)"]
    behavior:
      purpose: "내 콘텐츠 삭제 요청 (확인 시트로 진행)"
      user_action: "tap"
      feedback: "open-overlay → DeleteConfirmSheet"
    a11y:
      role: "button"
      label: "삭제"
      hint: "파괴적 액션 — 복구 불가"

  - name: "MenuItem:Report"
    id: "more-menu-report"
    variant: "other"
    tag: "button"
    type: "menu-row"
    size: "full-width x 56px"
    tokens:
      fill: "transparent (press: var(--wds-interaction-pressed))"
      text: "var(--wds-text-primary) → #262626"
      spacing: "py-16 pl-20 pr-24 gap-12"
      font: "Pretendard Medium 16px"
    children: ["Icon(SirenStroke)", "Label(신고하기)"]
    behavior:
      purpose: "신고 진입점 (Phase 3 전용) — Phase 2 는 placeholder"
      user_action: "tap"
      feedback: "toast '곧 제공될 예정이에요' (2초) + sheet close"
    states:
      default: "아이콘 + 라벨 (활성화 보임 — 탭 시 placeholder)"
    a11y:
      role: "button"
      label: "신고하기"
      hint: "Phase 3 에서 제공 예정"
    notes: "PRD 직역이 모호 — Phase 2 에서는 메뉴 노출 + 탭 시 Toast placeholder (low-risk inferred)"
```

## Layout Spec

```yaml
layout_spec:
  type: stack-overlay
  viewport: 390x844
  behind: "SwipeFeedScreen (dark #090909, action bar visible on right)"
  regions:
    - id: backdrop
      position: fixed
      inset: "0 0 0 0"
      fill: "rgba(0,0,0,0.40)"
    - id: sheet
      position: fixed
      anchor: bottom
      width: 390
      radius: "28px 28px 0 0"
      padding: "12px 0 32px 0"
      children:
        - handle (40x4, centered, margin-bottom 20)
        - menu_list (full-width, vertical, gap 0)
    - id: menu_list
      type: flex-column
      rows:
        - "{MenuItem:Download}"
        - "{MenuItem:Feedback}"
        - "{MenuItem:Delete | MenuItem:Report}"
      row_height: 56
```

## States

```yaml
states:
  default-me:
    description: "내 콘텐츠 — 다운로드 / 의견 보내기 / 삭제(빨간색)"
    active: true
    visible_components: [backdrop, sheet, handle, menu-download, menu-feedback, menu-delete]
    hidden_components: [menu-report]

  default-other:
    description: "타 유저 콘텐츠 — 다운로드 / 의견 보내기 / 신고하기"
    visible_components: [backdrop, sheet, handle, menu-download, menu-feedback, menu-report]
    hidden_components: [menu-delete]

  delete-confirm-open:
    description: "SwipeFeedMoreSheet 그대로 유지 + DeleteConfirmSheet 위에 스택"
    visible_components: [backdrop, sheet, handle, menu-download, menu-feedback, menu-delete, delete-confirm-sheet]
    hidden_components: [menu-report]
    note: "두 시트가 스택 상태. DeleteConfirmSheet 취소 시 원 시트 유지, 삭제 확정 시 양쪽 close + toast."

  report-placeholder-toast:
    description: "타 유저 변형에서 신고하기 탭 → Toast '곧 제공될 예정이에요' + 시트 close"
    visible_components: [toast]
    hidden_components: [backdrop, sheet, menu-download, menu-feedback, menu-report]
    labels:
      toast: "곧 제공될 예정이에요"

  closed:
    description: "시트 닫힘 (SwipeFeed 만 보임)"
    visible_components: []
    hidden_components: [backdrop, sheet]
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#more-sheet-backdrop"
    action: close-overlay
    transition: slide-down

  - trigger: tap
    target: "#more-menu-download"
    action: custom
    side_effect: "downloadContent(item)"
    post_action: close-overlay
    toast_on_success: "저장됐어요"

  - trigger: tap
    target: "#more-menu-feedback"
    action: navigate
    destination: "FeedbackScreen"
    transition: slide-left
    post_action: close-overlay

  - trigger: tap
    target: "#more-menu-delete"
    variant: "me"
    action: open-overlay
    destination: "DeleteConfirmSheet"
    transition: slide-up
    note: "기존 SwipeFeedMoreSheet 은 stack 유지 (스택 상위에 DeleteConfirmSheet)"

  - trigger: tap
    target: "#more-menu-report"
    variant: "other"
    action: show-toast
    toast_label: "곧 제공될 예정이에요"
    post_action: close-overlay

  - trigger: swipe-down
    target: "#swipe-feed-more-sheet"
    action: close-overlay
    transition: slide-down
```

## Visual Rules

```yaml
rules:
  - condition: "item.ownerId === myUserId"
    effect: "3rd 메뉴 아이템 = '삭제' (destructive red #D92800), '신고하기' 미노출"
  - condition: "item.ownerId !== myUserId"
    effect: "3rd 메뉴 아이템 = '신고하기' (기본 색상), '삭제' 미노출"
  - condition: "destructive 행"
    effect: "아이콘과 라벨 모두 #D92800 적용 (component-patterns §10 Menu Sheet)"
  - condition: "sheet radius"
    effect: "상단 좌우 28px 만 둥글게 (§10). 하단은 각 없음 (safe-area 까지 fill)."
  - condition: "handle bar"
    effect: "40x4, #A7A7A7, radius full, 상단 중앙 pt-12"
  - condition: "menu row padding"
    effect: "py-16 pl-20 pr-24 (SettingsScreen 선례 + icon 동반 시 gap-12)"
  - condition: "backdrop"
    effect: "rgba(0,0,0,0.40) — 기존 SwipeFeed 의 어두운 BG 위에서도 시트가 분리되어 보이도록"
  - condition: "icon size"
    effect: "24x24 고정 (§10 Menu Sheet)"
  - condition: "report placeholder"
    effect: |
      Phase 2: 메뉴 노출 (Other variant 3번째 행). 탭 시 Toast '곧 제공될 예정이에요'.
      Phase 3 에서 실제 신고 플로우 연결 (PRD 재확인 시 숨김 처리 가능).
```

## Labels (ko)

```yaml
labels:
  menu_items:
    download: "다운로드"
    feedback: "의견 보내기"
    delete: "삭제"
    report: "신고하기"
  toast:
    download_success: "저장됐어요"
    report_placeholder: "곧 제공될 예정이에요"
    delete_success: "삭제됐어요"     # DeleteConfirmSheet 확정 후 (spec 별도 파일)
    delete_error: "삭제에 실패했어요. 다시 시도해주세요"
  a11y:
    sheet_title: "더보기 메뉴"
    close_backdrop: "닫기"
```

## Token Map

```yaml
tokens:
  backdrop:         "var(--sheet-backdrop) → rgba(0,0,0,0.40)"
  sheet_fill:       "var(--sheet-surface) → #FFFFFF"
  sheet_radius:     "28px (top only)"
  handle_fill:      "var(--sheet-handle) → #A7A7A7"
  handle_radius:    "var(--wds-radius-full) → 9999px"
  row_text:         "var(--wds-text-primary) → #262626"
  row_text_destructive: "var(--wds-destructive-text) → #D92800"
  row_font:         "Pretendard Medium 16px / line-height 1.5"
  row_pressed_fill: "var(--wds-interaction-pressed) → rgba(0,0,0,0.10)"
  row_padding:      "16px 24px 16px 20px (py-16 pr-24 pl-20)"
  row_gap:          "12px (icon ↔ label)"
  icon_size:        "24px"
  safe_area_bottom: "32px (padding-bottom)"
  toast_fill:       "var(--toast-bg) → #171717"
  toast_text:       "var(--toast-label) → #FFFFFF"
  toast_radius:     "var(--toast-radius) → 40px"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 6       # Backdrop, Sheet, Handle, MenuItem×3 (Download/Feedback/Terminal)
    with_token_map: 6
    with_html_mapping: 6
    score: "12 / 12 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "report placeholder UX (PRD 는 '메뉴 노출 or 숨김' 모호 → 프로토타입에서 '노출 + Toast placeholder' 로 확정)"
      - "download success toast 문구 '저장됐어요' (PRD 미명시, 관례 적용)"
    risk_level: "low"
    notes: "두 inferred 모두 관례적 UX 패턴이며 Sprint Lead 확정 대상으로 주석 처리 완료."
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "1 / 1 (AC 1.7 — 더보기 메뉴 + 소유자 분기)"
    what_resolved: "6 / 6"
```
