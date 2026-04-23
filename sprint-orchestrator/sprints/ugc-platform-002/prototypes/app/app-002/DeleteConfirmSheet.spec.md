# Screen Spec: DeleteConfirmSheet

> Machine-readable 명세. Horizontal 2-button confirm sheet for destructive delete action.
> Reuses `BottomConfirmSheet` (기존 컴포넌트) — 본 스펙은 해당 인스턴스의 labels/props 고정.

## Meta

```yaml
screen_name: "DeleteConfirmSheet"
task_id: "app-002"
sprint_id: "ugc-platform-002"
app: "ZZEM (MemeApp)"
platform: "iOS / Android (React Native, @gorhom/bottom-sheet)"
language: "ko"
frame: "390x844 (iPhone 14 Pro) — sheet overlays SwipeFeed (+ SwipeFeedMoreSheet 스택)"
theme: "light sheet"
parent_screen: "SwipeFeedScreen"
trigger: "SwipeFeedMoreSheet → MenuItem:Delete (me variant)"
component_reuse: "shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx"
pattern_source:
  - "docs/designs/component-patterns.md §10 Bottom Sheet — Confirm Sheet"
  - "docs/designs/component-patterns.md §5 Profile Edit — 나가기 확인 바텀시트 (duel button pattern)"
  - "PRD app-002 / AC 1.7 — 삭제 확인"
  - "선례: swipe-feed-footer.tsx BottomConfirmSheet 호출부"
```

## Component Tree

```
Overlay [position: fixed, inset: 0] #delete-confirm-overlay
├── Backdrop (div) #delete-confirm-backdrop — rgba(0,0,0,0.40) (stacked above SwipeFeedMoreSheet backdrop)
└── Sheet [type: bottom-sheet] (div) #delete-confirm-sheet
    ├── Handle (div) #delete-confirm-handle — 40x4, #A7A7A7 (선택적; gorhom default)
    ├── TextBlock (section) #delete-confirm-text
    │   ├── Title (h2) #delete-confirm-title — "콘텐츠를 삭제할까요?"
    │   └── Description (p) #delete-confirm-desc — "삭제한 콘텐츠는 복구할 수 없어요."
    ├── ActionRow (div) #delete-confirm-actions — horizontal, gap-6
    │   ├── CancelButton (button) #btn-cancel — "취소"
    │   └── DeleteButton (button) #btn-delete-confirm — "삭제" (destructive fill)
    └── SafeAreaSpacer (div) — pb-safe (34px iOS)
```

### Component Details

```yaml
components:
  - name: "Backdrop"
    id: "delete-confirm-backdrop"
    tag: "div"
    type: "overlay"
    position: "fixed inset-0"
    tokens:
      fill: "var(--sheet-backdrop, rgba(0,0,0,0.40))"
    behavior:
      purpose: "시트 외부 탭 시 Confirm 닫기 (MoreSheet 으로 복귀)"
      user_action: "tap outside"
      feedback: "navigation (close DeleteConfirmSheet only, MoreSheet 유지)"

  - name: "Sheet"
    id: "delete-confirm-sheet"
    tag: "div"
    type: "bottom-sheet"
    position: "sticky-bottom"
    size: "full-width x wrap-content"
    tokens:
      fill: "var(--sheet-surface, #FFFFFF)"
      radius: "28px 28px 0 0"
      spacing: "pt-12 px-20 pb-32 gap-24"
    layout:
      direction: "vertical"
      alignment: "start"
      sizing: "hug"
    a11y:
      role: "alertdialog"
      label: "삭제 확인"

  - name: "Title"
    id: "delete-confirm-title"
    tag: "h2"
    type: "text"
    tokens:
      text: "var(--wds-text-primary) → #262626"
      font: "Pretendard SemiBold 18px"
      line_height: "1.5 → 27px"
    a11y:
      role: "heading"
      label: "콘텐츠를 삭제할까요?"

  - name: "Description"
    id: "delete-confirm-desc"
    tag: "p"
    type: "text"
    tokens:
      text: "var(--wds-text-secondary) → #656565"
      font: "Pretendard Medium 14px"
      line_height: "1.5 → 21px"
      spacing: "mt-8"
    a11y:
      role: "text"
      label: "삭제한 콘텐츠는 복구할 수 없어요"

  - name: "ActionRow"
    id: "delete-confirm-actions"
    tag: "div"
    type: "container"
    size: "full-width x 56px"
    tokens:
      spacing: "mt-24 gap-6"
    layout:
      direction: "horizontal"
      alignment: "space-between"
      sizing: "fill"
    notes: "취소 / 삭제 1:1 비율 (flex-1 each)"

  - name: "CancelButton"
    id: "btn-cancel"
    tag: "button"
    type: "button-secondary"
    size: "flex-1 x 56px"
    tokens:
      fill: "var(--sheet-cancel-btn, rgba(0,0,0,0.08))"
      text: "var(--sheet-cancel-btn-label, #262626)"
      radius: "var(--wds-radius-lg) → 16px"
      font: "Pretendard SemiBold 16px"
    behavior:
      purpose: "삭제 취소 → DeleteConfirmSheet 닫기, MoreSheet 유지"
      user_action: "tap"
      feedback: "close-overlay (Confirm only)"
    a11y:
      role: "button"
      label: "취소"

  - name: "DeleteButton"
    id: "btn-delete-confirm"
    tag: "button"
    type: "button-primary destructive"
    size: "flex-1 x 56px"
    tokens:
      fill: "var(--wds-destructive-fill, #D92800)"
      text: "var(--wds-label-inverse, #FFFFFF)"
      radius: "var(--wds-radius-lg) → 16px"
      font: "Pretendard SemiBold 16px"
    behavior:
      purpose: "DELETE API 호출 → 성공 시 feed invalidate + toast"
      user_action: "tap"
      feedback: "close-overlay (both sheets) + toast '삭제됐어요' + list removal (invalidate)"
    states:
      default: "빨간 fill + 흰 라벨"
      loading: "스피너 (inline, label 교체)"
      error: "sheet 유지 + toast error"
    a11y:
      role: "button"
      label: "삭제"
      hint: "파괴적 액션 — 복구 불가"
    notes: |
      component-patterns §5 '나가기 확인' 은 confirm = #262626 이지만,
      본 Sheet 은 삭제(파괴적) 이므로 §10 Menu Sheet 의 '위험 액션' 빨간색 확장 적용.
```

## Layout Spec

```yaml
layout_spec:
  type: stack-overlay
  viewport: 390x844
  behind: "SwipeFeedMoreSheet (me variant) + SwipeFeedScreen"
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
      padding: "12px 20px 32px 20px"
      children:
        - handle (40x4, centered, mt-0)
        - text_block (title + desc, mt-20)
        - action_row (horizontal dual button, mt-24)
    - id: action_row
      type: flex-row
      gap: 6
      children:
        - cancel_button (flex-1)
        - delete_button (flex-1)
```

## States

```yaml
states:
  default:
    description: "기본 — 취소 / 삭제 버튼 활성"
    active: true
    visible_components: [backdrop, sheet, handle, title, desc, cancel, delete]

  loading:
    description: "삭제 진행 중 — 삭제 버튼에 스피너, 둘 다 비활성화"
    visible_components: [backdrop, sheet, handle, title, desc, cancel, delete]
    component_states:
      btn-cancel: disabled
      btn-delete-confirm: loading (spinner)

  error:
    description: "삭제 실패 — sheet 유지 + toast error"
    visible_components: [backdrop, sheet, handle, title, desc, cancel, delete, toast-error]
    labels:
      toast: "삭제에 실패했어요. 다시 시도해주세요"

  closed:
    description: "시트 닫힘 (삭제 성공 or 취소 후)"
    visible_components: []
    hidden_components: [backdrop, sheet]
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#delete-confirm-backdrop"
    action: close-overlay
    transition: slide-down
    note: "DeleteConfirmSheet 만 닫힘 — 하위 SwipeFeedMoreSheet 유지"

  - trigger: tap
    target: "#btn-cancel"
    action: close-overlay
    transition: slide-down
    note: "동일 — MoreSheet 유지"

  - trigger: tap
    target: "#btn-delete-confirm"
    action: custom
    side_effect: "useDeleteMyContentUseCase(contentId, contentType)"
    post_action_success:
      - close-overlay (both: confirm + more)
      - show-toast "삭제됐어요"
      - invalidate-query [meme-feed, me-contents, counts]
      - optimistic-remove (feed item)
    post_action_error:
      - keep sheet open
      - show-toast "삭제에 실패했어요. 다시 시도해주세요"

  - trigger: swipe-down
    target: "#delete-confirm-sheet"
    action: close-overlay
    transition: slide-down
```

## Visual Rules

```yaml
rules:
  - condition: "Direction"
    effect: "2개 버튼 horizontal 1:1 (flex-1 each), gap-6"
  - condition: "Destructive CTA 색상"
    effect: "삭제 버튼 = 빨간 fill (#D92800) + 흰 라벨"
    note: "§5 나가기 확인은 검정 확인 (#262626) 이지만, 본 시트는 파괴적 액션 → red extend"
  - condition: "Title typography"
    effect: "Pretendard SemiBold 18px #262626 (Subtitle3-18)"
  - condition: "Description typography"
    effect: "Pretendard Medium 14px #656565 (Body6-14)"
  - condition: "Sheet radius"
    effect: "상단 28px (§10)"
  - condition: "button radius"
    effect: "16px (§10 CTA + §5 dual button)"
  - condition: "stack behavior"
    effect: |
      DeleteConfirmSheet 는 SwipeFeedMoreSheet 위에 스택. Backdrop 은 MoreSheet 도 덮음
      (시각적으로 MoreSheet 은 어두워진 상태로 보임).
      Confirm 취소 → Confirm 만 slide-down, MoreSheet 복귀.
      Confirm 삭제 → 양쪽 slide-down.
```

## Labels (ko)

```yaml
labels:
  title: "콘텐츠를 삭제할까요?"
  description: "삭제한 콘텐츠는 복구할 수 없어요."
  buttons:
    cancel: "취소"
    delete: "삭제"
  toast:
    success: "삭제됐어요"
    error: "삭제에 실패했어요. 다시 시도해주세요"
  a11y:
    sheet_title: "삭제 확인"
    close_backdrop: "닫기"
```

## Token Map

```yaml
tokens:
  backdrop:              "var(--sheet-backdrop) → rgba(0,0,0,0.40)"
  sheet_fill:            "var(--sheet-surface) → #FFFFFF"
  sheet_radius:          "28px (top only)"
  handle_fill:           "var(--sheet-handle) → #A7A7A7"
  title_text:            "var(--wds-text-primary) → #262626"
  title_font:            "Pretendard SemiBold 18px / line-height 1.5"
  desc_text:             "var(--wds-text-secondary) → #656565"
  desc_font:             "Pretendard Medium 14px / line-height 1.5"
  cancel_fill:           "var(--sheet-cancel-btn) → rgba(0,0,0,0.08)"
  cancel_label:          "var(--sheet-cancel-btn-label) → #262626"
  delete_fill:           "var(--wds-destructive-fill) → #D92800"
  delete_label:          "var(--wds-label-inverse) → #FFFFFF"
  button_radius:         "var(--wds-radius-lg) → 16px"
  button_font:           "Pretendard SemiBold 16px"
  button_height:         "56px"
  action_gap:            "6px"
  safe_area_bottom:      "32px"
  toast_fill:            "var(--toast-bg) → #171717"
  toast_text:            "var(--toast-label) → #FFFFFF"
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 6     # Backdrop, Sheet, Title, Desc, CancelButton, DeleteButton
    with_token_map: 6
    with_html_mapping: 6
    score: "12 / 12 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "delete_error toast 문구 '삭제에 실패했어요. 다시 시도해주세요' (PRD 미명시, 관례 적용)"
    risk_level: "low"
    notes: "Title/Description/CTA 라벨/direction 모두 PRD 직역. destructive 색상 규칙만 §10 일반화 적용."
  schema_completeness:
    required_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "labels", "token_map"]
    present_sections: ["meta", "component_tree", "layout_spec", "states", "interactions", "visual_rules", "labels", "token_map", "quality_score"]
    score: "7 / 7 = 1.0"
  context_coverage:
    why_linked: "1 / 1 (AC 1.7 — 삭제 확인 시트)"
    what_resolved: "6 / 6"
```
