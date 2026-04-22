# Screen Spec — UnpublishConfirmSheet

```yaml
meta:
  screen: UnpublishConfirmSheet
  component_type: "bottom-sheet (BottomConfirmSheet 재사용)"
  task_id: app-004
  sprint_id: ugc-platform-002
  app: "ZZEM / MemeApp"
  platform: "iOS / Android (React Native, gorhom/bottom-sheet)"
  language: "ko"
  frame: "390x844"
  theme: "light"
  parent_task: "sprints/ugc-platform-002/tasks/app/004-publish-toggle.md"
  source_pattern:
    - "app/apps/MemeApp/src/shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx"
    - "docs/designs/component-patterns.md (bottom-sheet §)"
  trigger_from: "PublishSwitch ON→OFF tap"

business_context:
  linked_ac:
    - AC-1.3  # 비공개 전환 바텀시트
    - AC-1.8  # 게시 토글 UX
  linked_business_rule: "PRD §페이백 6 — 이미 받은 페이백 크레딧은 유지"
  purpose: >-
    공개 콘텐츠를 비공개로 되돌릴 때 사용자가 실수로 감추는 일을 방지한다.
    페이백 크레딧 유지 안내로 경제적 불안을 해소한다.

component_tree: |
  UnpublishConfirmSheet (overlay, z=1000, 390x auto)
  ├─ Backdrop (full-screen, bg=rgba(0,0,0,0.4), tap → close)
  └─ SheetContainer (bottom-anchored, slide-up 300ms)
     ├─ SheetSurface (bg=#FFFFFF, radius top=28px, padding=24px 20px 34px)
     │  ├─ Handle (48x4, radius=full, bg=#D1D3D8, centered top, margin-bottom=16)
     │  ├─ Title ("콘텐츠를 비공개로 전환할까요?", 18px SemiBold, color=label.normal)
     │  ├─ Description ("피드에서 사라지고 나만 볼 수 있어요. 이미 받은 페이백 크레딧은 유지돼요.", 14px Regular, color=label.alternative, line-height=1.5)
     │  └─ ButtonRow (horizontal flex, gap=8, margin-top=24)
     │     ├─ CancelButton (flex=1, secondary, "취소", h=56, radius=16, bg=surface.button)
     │     └─ ConfirmButton (flex=1, destructive, "비공개로 전환", h=56, radius=16, bg=status-error)

layout_spec:
  type: overlay
  viewport: 390x844
  backdrop:
    color: "rgba(0, 0, 0, 0.40)"  # var(--wds-background-dimmed)
    close_on_tap: true
  sheet:
    position: bottom
    width: "100%"
    height: auto
    max_height: "80%"
    radius_top: 28
    padding: "24px 20px 34px"  # bottom safe-area
    background: "var(--wds-background-elevated)"  # #FFFFFF
    animation: "slide-up 300ms cubic-bezier(0.4, 0, 0.2, 1)"
  handle:
    width: 48
    height: 4
    radius: 2
    color: "var(--wds-color-neutral-300)"  # #D1D3D8
    margin_bottom: 16
  title:
    font_size: 18
    font_weight: 600
    color: "var(--wds-label-normal)"
    margin_bottom: 8
    align: center
  description:
    font_size: 14
    font_weight: 400
    color: "var(--wds-label-alternative)"
    line_height: 1.5
    align: center
    margin_bottom: 24
  button_row:
    direction: horizontal
    gap: 8
    align: stretch

components:
  - name: Backdrop
    type: overlay-backdrop
    id: "unpublish-backdrop"
    tag: div
    size: "full-screen"
    tokens:
      background: "var(--wds-background-dimmed)"  # rgba(0,0,0,0.4)
    behavior:
      purpose: "시트 외부 탭으로 취소 의도 수용"
      user_action: "탭"
      feedback: "close sheet (toggle state rollback — ON 유지)"
    a11y:
      role: button
      label: "시트 닫기"

  - name: SheetSurface
    type: bottom-sheet
    id: "unpublish-sheet"
    tag: div
    position: "sticky-bottom"
    size: "full-width x auto"
    tokens:
      background: "var(--wds-background-elevated)"  # #FFFFFF
      radius: "28px 28px 0 0"  # top corners only
      padding: "24px 20px 34px"
    behavior:
      purpose: "비공개 전환 확인 UI"
      user_action: "자식 버튼 탭"
      feedback: "navigation + toast"
    layout:
      direction: vertical
      alignment: stretch
      sizing: hug
    a11y:
      role: dialog
      label: "비공개 전환 확인"

  - name: Handle
    type: indicator
    id: "sheet-handle"
    tag: div
    size: "48x4"
    tokens:
      background: "var(--wds-color-neutral-300)"  # #D1D3D8
      radius: "var(--wds-radius-full)"
    a11y:
      role: presentation
      label: null

  - name: Title
    type: text
    id: "unpublish-title"
    tag: h2
    tokens:
      font_size: "18px"
      font_weight: 600
      color: "var(--wds-label-normal)"     # #212228
      line_height: 1.4
    a11y:
      role: heading
      label: "콘텐츠를 비공개로 전환할까요?"

  - name: Description
    type: text
    id: "unpublish-description"
    tag: p
    tokens:
      font_size: "14px"
      font_weight: 400
      color: "var(--wds-label-alternative)"  # #6B6E76
      line_height: 1.5
    constraints:
      max_lines: 3
      truncation: none
    a11y:
      role: text
      label: "피드에서 사라지고 나만 볼 수 있어요. 이미 받은 페이백 크레딧은 유지돼요."

  - name: CancelButton
    type: button-secondary
    id: "btn-cancel"
    tag: button
    size: "flex=1 x 56"
    tokens:
      background: "var(--wds-surface-button)"       # #F1F1F1
      color: "var(--wds-label-normal)"              # #212228
      radius: "var(--wds-radius-lg)"                # 16
      font_size: "16px"
      font_weight: 600
      padding: "16px 0"
    behavior:
      purpose: "비공개 전환 취소 → 토글 ON 유지"
      user_action: "탭"
      feedback: "close sheet, toggle rollback to ON (API 호출 없음)"
    a11y:
      role: button
      label: "취소"

  - name: ConfirmButton
    type: button-destructive
    id: "btn-confirm-unpublish"
    tag: button
    size: "flex=1 x 56"
    tokens:
      background: "var(--wds-status-error)"         # #FF3B30 (destructive tone)
      color: "var(--wds-label-inverse)"             # #FFFFFF
      radius: "var(--wds-radius-lg)"                # 16
      font_size: "16px"
      font_weight: 600
      padding: "16px 0"
    behavior:
      purpose: "비공개 전환 확정 → PATCH isPublished=false"
      user_action: "탭"
      feedback: "PATCH → toast + invalidate + close sheet + toggle OFF 반영"
    states:
      default: "destructive tone"
      loading: "spinner + disabled"
      disabled: null
    a11y:
      role: button
      label: "비공개로 전환"
      hint: "콘텐츠를 비공개로 전환합니다. 피드에서 제외됩니다."

states:
  default:
    active: true
    description: "시트 진입 — 슬라이드업 완료"
    visible_components: [Backdrop, SheetSurface, Handle, Title, Description, CancelButton, ConfirmButton]
    hidden_components: []

  loading:
    description: "비공개 전환 PATCH in-flight"
    visible_components: [SheetSurface, ConfirmButton (loading)]
    button_state:
      confirm: "spinner + disabled"
      cancel: "disabled"

  error:
    description: "PATCH 실패 — 에러 토스트 노출 + 시트 유지 또는 닫힘"
    visible_components: [Toast (error)]
    toast:
      message: "비공개 전환에 실패했어요. 잠시 후 다시 시도해주세요"
      theme: "snack-style"

  closed:
    description: "Cancel 또는 Backdrop tap — 시트 닫힘, 토글 ON 복귀"
    visible_components: []

interactions:
  - id: tap-cancel
    trigger: "CancelButton tap"
    target: "sheet"
    action: close-overlay
    transition: slide-down
    side_effect: "PublishSwitch remains ON (no API call)"

  - id: tap-backdrop
    trigger: "Backdrop tap"
    target: "sheet"
    action: close-overlay
    transition: slide-down
    side_effect: "PublishSwitch remains ON (no API call)"

  - id: tap-confirm
    trigger: "ConfirmButton tap"
    target: "backend"
    action: "PATCH /v2/me/contents/:id/visibility { isPublished: false }"
    on_success:
      - "close-overlay (slide-down)"
      - "PublishSwitch → OFF (optimistic + confirmed)"
      - "invalidate meme.query-key (me contents, counts, feed)"
    on_error:
      - "Toast: '비공개 전환에 실패했어요'"
      - "close-overlay"
      - "PublishSwitch remains ON (rollback)"
    telemetry: "click_publish_toggle { content_id, from_state: on, to_state: off }"

visual_rules:
  - condition: "Sheet 진입"
    effect: "전체 화면 dim + slide-up 300ms"
  - condition: "Confirm button tap"
    effect: "loading spinner, 두 버튼 비활성"
  - condition: "Android hardware back press"
    effect: "close-overlay (Cancel 동일)"

labels:
  ko:
    title: "콘텐츠를 비공개로 전환할까요?"
    description: "피드에서 사라지고 나만 볼 수 있어요. 이미 받은 페이백 크레딧은 유지돼요."
    cancel: "취소"
    confirm: "비공개로 전환"
    toast_error: "비공개 전환에 실패했어요. 잠시 후 다시 시도해주세요"
    a11y_dialog: "비공개 전환 확인"
    a11y_cancel: "취소"
    a11y_confirm: "비공개로 전환"
    a11y_backdrop: "시트 닫기"

token_map:
  backdrop:
    color: "var(--wds-background-dimmed) → rgba(0,0,0,0.4)"
  surface:
    bg: "var(--wds-background-elevated) → #FFFFFF"
    radius_top: "28px (bottom-sheet pattern §10)"
    padding: "24px 20px 34px"
  handle:
    bg: "var(--wds-color-neutral-300) → #D1D3D8"
    size: "48x4"
  title:
    color: "var(--wds-label-normal) → #212228"
    font_size: 18
    font_weight: 600
  description:
    color: "var(--wds-label-alternative) → #6B6E76"
    font_size: 14
    line_height: 1.5
  cancel_button:
    bg: "var(--wds-surface-button) → #F1F1F1"
    label: "var(--wds-label-normal) → #212228"
    radius: "var(--wds-radius-lg) → 16"
    height: 56
  confirm_button:
    bg: "var(--wds-status-error) → #FF3B30 (destructive)"
    label: "var(--wds-label-inverse) → #FFFFFF"
    radius: "var(--wds-radius-lg) → 16"
    height: 56

quality_score:
  extraction_accuracy:
    total_components: 7
    with_library_match: 7  # Backdrop, Sheet, Handle, Title, Description, CancelBtn, ConfirmBtn
    with_token_map: 7
    score: "14/14 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "toast_error copy (PRD 미명시 — 표준 UI 관례)"
      - "Android back press → close (표준 UX 관례)"
      - "description align center (Figma 미확인 — 본 스펙은 center 적용)"
    risk_level: low
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, business_context, component_tree, layout_spec, components, states, interactions, visual_rules, labels, token_map]
    score: "7/7 = 1.0"
  context_coverage:
    why_linked: "2/2 AC (AC-1.3, AC-1.8)"
    what_resolved: "7/7 components"
```
