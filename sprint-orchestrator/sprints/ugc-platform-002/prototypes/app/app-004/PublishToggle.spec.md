# Screen Spec — PublishToggle

```yaml
meta:
  screen: PublishToggle
  component_type: "inline-component (세로 스와이프 하단 CTA 영역)"
  task_id: app-004
  sprint_id: ugc-platform-002
  app: "ZZEM / MemeApp"
  platform: "iOS / Android (React Native)"
  language: "ko"
  frame: "390x844"
  theme: "light"
  parent_task: "sprints/ugc-platform-002/tasks/app/004-publish-toggle.md"
  source_pattern:
    - "docs/designs/component-patterns.md"
    - "sprint-orchestrator/sprints/ugc-platform-001/prototypes/app/app-005 (Switch UX 선례)"
  host_screen: "SwipeFeedScreen (세로 스와이프 피드 — 내 콘텐츠 모드)"

business_context:
  linked_ac:
    - AC-1.1  # 신규 공개 기본 정책 (isPublished 동기화)
    - AC-1.4  # custom-prompt 공개 차단 안내
    - AC-1.8  # 게시 토글 UX (owner only)
  purpose: >-
    내가 만든 콘텐츠의 공개/비공개 상태를 스와이프 피드 상단/좌측에서 iOS-style Switch로
    직관적으로 제어한다. Custom-prompt 결과물은 일시적으로 공개가 차단되어 있으며 안내 토스트로
    사용자의 기대를 관리한다.
  business_rule_refs:
    - "PRD §AC 1.4 custom-prompt 안내 문구 (원문 그대로)"
    - "PRD §페이백 6 — 이미 받은 페이백 크레딧 유지"
    - "PRD §AC 1.8 — 타 유저 콘텐츠에서는 토글 미노출"

component_tree: |
  CTAFooterArea (hosting container, position=sticky bottom, safe-area-aware)
  ├─ PublishToggleRow (horizontal flex, align=center, gap=8, visible=isOwn)
  │  ├─ PublishLabel (text "게시", 14px Pretendard Medium, color=label.alternative)
  │  └─ PublishSwitch (iOS-style Switch, 51x31)
  │     ├─ Track (51x31, radius=full)
  │     │  └─ (fill: ON=fill.brand-primary / OFF=fill.neutral-secondary / DISABLED=surface.tertiary)
  │     └─ Thumb (27x27, circle, white, shadow-sm, translateX: OFF=2px / ON=22px)
  └─ TemplateCTAButton (full-width primary button, "템플릿 사용하기")

  # Overlay outputs (trigger from switch tap):
  ├─ CustomPromptBlockToast (snack-style, bottom-anchored, duration=3000ms)
  └─ PublishSuccessToast (snack-style, bottom-anchored, duration=2000ms)

layout_spec:
  type: flex-column
  viewport: 390x844
  hosting_region:
    id: cta-footer
    sticky: bottom
    padding: "12px 16px 34px"   # safe-area bottom inset
    background: "var(--wds-background-normal)"
    direction: vertical
    gap: 8
  publish_toggle_row:
    id: publish-toggle-row
    direction: horizontal
    alignment: space-between  # label left, switch right
    padding: "8px 4px"
    visible_when: "isOwn === true"
    hidden_when: "isOwn === false"  # 타 유저 콘텐츠에서 완전 미노출 (AC 1.8)
  switch:
    width: 51
    height: 31
    radius: 15.5  # half of height → full pill
    thumb:
      size: 27
      radius: 13.5
      color: "#FFFFFF"
      shadow: "0 2px 4px rgba(0,0,0,0.2)"
      off_offset_x: 2
      on_offset_x: 22
    transition: "background-color 200ms ease, transform 200ms ease"

components:
  - name: PublishToggleRow
    type: container
    id: "publish-toggle-row"
    tag: div
    position: "sticky-bottom (내부 flex row)"
    size: "full-width x 47px (8+31+8 padding+content)"
    tokens:
      background: "transparent"
      padding: "8px 4px"
    behavior:
      purpose: "내 콘텐츠에서만 노출되는 공개/비공개 토글 컨테이너"
      user_action: "자식 Switch를 통해 상태 토글"
      feedback: "toast + sheet (자식 참조)"
    states:
      default: "visible (isOwn=true)"
      hidden: "isOwn=false 시 완전 unmount (AC 1.8 Regression Guard)"
    layout:
      direction: horizontal
      alignment: space-between
      sizing: fill
    a11y:
      role: group
      label: "게시 토글 영역"

  - name: PublishLabel
    type: text
    id: "publish-label"
    tag: span
    tokens:
      font_size: "14px"
      font_weight: 500
      color: "var(--wds-label-alternative)"   # #6B6E76
    a11y:
      role: text
      label: "게시"

  - name: PublishSwitch
    type: toggle
    id: "publish-switch"
    tag: button
    position: "inline-end"
    size: "51x31"
    tokens:
      track_fill_on: "var(--wds-fill-brand-primary)"       # #8752FA
      track_fill_off: "var(--wds-fill-neutral-secondary)"  # #F0F1F3
      track_fill_disabled: "var(--wds-surface-tertiary)"   # #F0F1F3 (custom-prompt gray)
      track_fill_disabled_overlay: "rgba(135, 82, 250, 0.35)"  # optional disabled ON tint (unused — default OFF for custom-prompt)
      thumb_fill: "#FFFFFF"
      thumb_shadow: "0 2px 4px rgba(0,0,0,0.2)"
      radius: "var(--wds-radius-full)"
      transition: "background-color 200ms ease, transform 200ms ease"
    behavior:
      purpose: "콘텐츠의 공개 여부(isPublished)를 토글. iOS HIG Switch 표준."
      user_action: "탭"
      feedback: "haptic (light) + visual (thumb slide) + toast or sheet"
    states:
      toggle-on:
        description: "isPublished=true"
        track_fill: "var(--wds-fill-brand-primary)"
        thumb_x: 22
      toggle-off:
        description: "isPublished=false"
        track_fill: "var(--wds-fill-neutral-secondary)"
        thumb_x: 2
      toggle-disabled:
        description: "item.isCustomPrompt === true — 탭 가능(tap 허용)하지만 API 호출 없이 안내 토스트 발생"
        track_fill: "var(--wds-surface-tertiary)"
        thumb_x: 2
        opacity: 0.6
        cursor: "not-allowed (tap intercept로 토스트)"
      loading:
        description: "PATCH in-flight — optimistic update 적용, 실패 시 rollback"
        thumb_overlay: "subtle pulse 또는 그대로 유지"
    layout:
      direction: horizontal
      alignment: end
      sizing: fixed
    a11y:
      role: switch
      label: "게시 토글"
      hint: "탭하면 콘텐츠 공개 여부를 변경합니다"
      aria_checked: "{true | false}"
      aria_disabled: "{true | false}"  # 읽기 전용은 아님 — tap 허용이지만 상태는 disabled-like
    constraints:
      min_height: "31px"
      min_width: "51px"
      ios_standard: "UISwitch 51x31 (iOS HIG)"
      android_standard: "Material Switch 32x20 대체 가능, 본 스펙은 iOS 표준 채택"
      tap_target: "44x44 minimum (Apple HIG) — 토글 주변 투명 hit area 확장"

  - name: TemplateCTAButton
    type: button-primary
    id: "btn-template-cta"
    tag: button
    size: "full-width x 56px"
    tokens:
      background: "var(--wds-fill-brand-primary)"
      color: "var(--wds-label-inverse)"
      radius: "var(--wds-radius-lg)"
      font_size: "16px"
      font_weight: 600
      padding: "16px"
    notes: "기존 CTA. 본 태스크의 범위 밖이지만 레이아웃 맥락을 위해 포함."
    a11y:
      role: button
      label: "템플릿 사용하기"

states:
  toggle-on:
    active: true
    description: "isPublished=true, brand color track, thumb right"
    visible_components: [PublishToggleRow, PublishLabel, PublishSwitch, TemplateCTAButton]
    switch_visual:
      track_fill: "#8752FA"
      thumb_x: 22
    aria_checked: true

  toggle-off:
    description: "isPublished=false, neutral track, thumb left"
    visible_components: [PublishToggleRow, PublishLabel, PublishSwitch, TemplateCTAButton]
    switch_visual:
      track_fill: "#F0F1F3"
      thumb_x: 2
    aria_checked: false

  toggle-disabled:
    description: "isCustomPrompt=true — 탭 허용 but feedback toast only"
    visible_components: [PublishToggleRow, PublishLabel, PublishSwitch, TemplateCTAButton]
    switch_visual:
      track_fill: "var(--wds-surface-tertiary)"
      thumb_x: 2
      opacity: 0.6
    aria_disabled: true

  publish-success-toast:
    description: "OFF→ON 일반 콘텐츠 성공 — PATCH 성공 후"
    visible_components: [PublishSuccessToast]
    toast:
      message: "공개됐어요"
      duration: 2000
      position: "bottom"
      theme: "snack-style (neutral-900 bg, white text)"

  custom-prompt-blocked-toast:
    description: "isCustomPrompt 토글 탭 시 안내 (API 호출 없음)"
    visible_components: [CustomPromptBlockToast]
    toast:
      message: "커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!"
      duration: 3500
      position: "bottom"
      theme: "snack-style (neutral-900 bg, white text)"

  publish-error:
    description: "PATCH 실패 시 — 토글 원복 + 에러 토스트"
    visible_components: [PublishToggleRow, ErrorToast]
    switch_visual:
      rollback: true
    toast:
      message: "공개 설정 변경에 실패했어요. 잠시 후 다시 시도해주세요"
      duration: 3000

  hidden:
    description: "타 유저 콘텐츠 — 전체 미노출"
    visible_components: [TemplateCTAButton]
    hidden_components: [PublishToggleRow, PublishLabel, PublishSwitch]

interactions:
  - id: tap-switch-off-to-on-general
    trigger: "PublishSwitch tap (state=toggle-off AND isCustomPrompt=false)"
    target: "backend"
    action: "optimistic-toggle + PATCH /v2/me/contents/:id/visibility { isPublished: true }"
    on_success:
      - "Toast: '공개됐어요'"
      - "invalidate meme.query-key (me contents, counts, feed)"
    on_error:
      - "rollback thumb to OFF"
      - "Toast: error"
    telemetry: "click_publish_toggle { content_id, from_state: off, to_state: on }"

  - id: tap-switch-off-to-on-custom-prompt
    trigger: "PublishSwitch tap (state=toggle-disabled / isCustomPrompt=true)"
    target: "toast"
    action: "show-toast"
    toast_message: "커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!"
    api_call: none
    telemetry: "click_publish_toggle { content_id, from_state: off, to_state: off_blocked }"

  - id: tap-switch-on-to-off
    trigger: "PublishSwitch tap (state=toggle-on)"
    target: "UnpublishConfirmSheet"
    action: "open-overlay"
    transition: slide-up
    note: "확정 전까지는 state 유지 (optimistic toggle 미적용) — 시트에서 confirm 시 PATCH 실행"

  - id: defensive-409-handler
    trigger: "PATCH 응답 409 CUSTOM_PROMPT_PUBLISH_BLOCKED"
    target: "toast"
    action: "show-toast + rollback"
    toast_message: "커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!"

visual_rules:
  - condition: "isOwn === false"
    effect: "PublishToggleRow 전체 unmount"
    example: "타 유저 콘텐츠에서 토글/라벨 완전 미노출"
  - condition: "isCustomPrompt === true"
    effect: "Switch disabled 스타일 + 탭 시 안내 토스트, API 호출 없음"
    example: "커스텀 프롬프트로 생성된 내 콘텐츠"
  - condition: "isPublished === true"
    effect: "Track fill = brand-primary, thumb right"
  - condition: "isPublished === false AND !isCustomPrompt"
    effect: "Track fill = fill-neutral-secondary, thumb left"

labels:
  ko:
    toggle_label: "게시"
    toast_publish_success: "공개됐어요"
    toast_custom_prompt_blocked: "커스텀 프롬프트 결과물 게시 기능도 곧 지원될 예정이니 조금만 기다려주세요!"
    toast_publish_error: "공개 설정 변경에 실패했어요. 잠시 후 다시 시도해주세요"
    a11y_switch: "게시 토글"
    a11y_switch_hint_on: "현재 공개. 탭하면 비공개로 변경합니다"
    a11y_switch_hint_off: "현재 비공개. 탭하면 공개로 변경합니다"
    a11y_switch_hint_disabled: "현재 게시 불가 상태입니다"

token_map:
  switch:
    track_on: "var(--wds-fill-brand-primary) → #8752FA"
    track_off: "var(--wds-fill-neutral-secondary) → #F0F1F3"
    track_disabled: "var(--wds-surface-tertiary) → #F0F1F3 (with opacity 0.6)"
    thumb_fill: "#FFFFFF"
    thumb_shadow: "0 2px 4px rgba(0,0,0,0.2)"
    radius: "var(--wds-radius-full) → 9999px"
  label:
    color: "var(--wds-label-alternative) → #6B6E76"
    font_size: "14px"
    font_weight: 500
  hosting_container:
    background: "var(--wds-background-normal) → #FFFFFF"
    padding: "12px 16px 34px (safe-area)"
  toast:
    bg: "var(--wds-color-neutral-900) → #212228"
    text: "var(--wds-label-inverse) → #FFFFFF"
    radius: "var(--wds-radius-md) → 12px"
    padding: "12px 16px"
    font_size: "14px"

standards:
  ios_switch: "51 x 31 (iOS HIG UISwitch)"
  android_switch: "32 x 20 (Material Design Switch — 본 스펙 미채택, iOS 표준 우선)"
  transition_timing: "200ms ease"
  hit_target_min: "44x44 (Apple HIG)"

quality_score:
  extraction_accuracy:
    total_components: 4
    with_library_match: 4   # Switch(iOS), Toast(snack), Label, Container
    with_token_map: 4
    score: "8/8 = 1.0"
  fabrication_risk:
    inferred_fields:
      - "toast_publish_error copy (PRD 미명시 — 표준 UI 관례)"
      - "a11y hint 문구 (관례)"
      - "disabled opacity 0.6 (관례적 시각 감쇠)"
    risk_level: low
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, business_context, component_tree, layout_spec, components, states, interactions, visual_rules, labels, token_map, standards]
    score: "7/7 = 1.0"
  context_coverage:
    why_linked: "3/3 AC (AC-1.1, AC-1.4, AC-1.8)"
    what_resolved: "4/4 components"
```
