# Screen Spec — ProfileEditScreen

```yaml
meta:
  screen: ProfileEditScreen
  task_id: app-005
  sprint_id: ugc-platform-001
  source_pattern: "docs/designs/component-patterns.md §5"
  figma_frame: "프로필편집_메인 (375x812)"
  route: "zzem://profile/edit"
  parent_task: "sprints/ugc-platform-001/tasks/app/005-profile-edit.md"

business_context:
  linked_ac: [AC-APP-005-1, AC-APP-005-5, AC-APP-005-6, AC-APP-005-7]
  purpose: "유저가 프로필 이미지와 닉네임을 수정하고 저장. dirty 감지로 실수 저장 방지."

component_tree: |
  ProfileEditScreen (screen, 375x812, flex column, bg=#FFFFFF)
  ├─ StatusBar (44h)
  ├─ Header (h-48, pl-12 pr-44 py-4, left-aligned back + centered title)
  │  ├─ BackButton (ArrowshortLeft_Stroke_L, 24px icon, 40x40 hit)
  │  └─ Title ("프로필 편집", Pretendard SemiBold 18px, #262626, center)
  ├─ Body (flex 1, overflow scroll, py-12)
  │  ├─ AvatarSection (flex center, py-12)
  │  │  └─ AvatarWithCameraBadge (100x100 relative)
  │  │     ├─ Avatar (100x100 rounded-999, border 1px rgba(136,136,136,0.2))
  │  │     └─ CameraBadge (24x24 circle, bottom-4 right-4, bg=#E2E2E2, 4px white border, camera_fill 16px centered)
  │  ├─ NicknameSection (gap-8, w-full, px-16)
  │  │  ├─ NicknameLabel ("닉네임", 14px Pretendard Medium, #545454, px-4 container)
  │  │  ├─ FilledInputField (bg=#F7F7F7, border=1px #F1F1F1, rounded-16, px-16 py-12, w-335)
  │  │  │  └─ InputText (14px Pretendard Medium, color #090909)
  │  │  └─ InlineError (caption 12px, color #D92800, visible when length<2 AND dirty)
  │  └─ [NO visible character counter in default state]
  └─ SaveButtonFooter (pt-12 pb-32 px-16, bg=white)
     └─ PrimarySaveButton (h-56, rounded-16, w-full, px-28 py-12, 18px SemiBold)

layout_spec:
  frame: "375x812, mobile device frame (Figma primary)"
  header:
    height: 48
    padding: "4px 44px 4px 12px"
    back_button_size: "40x40 hit, icon 24px"
    title_position: "center, SemiBold 18"
  body:
    padding: "py-12"
    horizontal_padding_nickname: "px-16"
  avatar:
    size: "100x100"
    border: "1px solid rgba(136,136,136,0.2)"
    badge:
      size: "24x24"
      position: "absolute, bottom-4 right-4"
      border_color: "#FFFFFF"
      border_width: 4
      bg: "#E2E2E2"
      icon: "camera_fill 16px centered"
  nickname_field:
    layout: "full width (w-335)"
    padding: "12px 16px"
    radius: 16
    text_style: "14px Pretendard Medium, color #090909"
    counter_visible_default: false
  save_button:
    position: "bottom, padding pt-12 pb-32 px-16"
    height: 56
    radius: 16
    text_style: "18px SemiBold"
    padding_inner: "px-28 py-12"
    disabled_text_color: "#C5C5C5"   # CRITICAL: not #262626, not #B5B8BF — Figma spec
    enabled_text_color: "#FFFFFF"
    disabled_bg: "#F1F1F1"
    enabled_bg: "#262626"

components:
  - name: BackButton
    type: icon-button
    id: "btn-back"
    tag: button
    size: "44x44"
    tokens:
      color: "var(--wds-label-normal)"
    behavior:
      purpose: "이전 화면으로 이동, dirty 시 ExitConfirmSheet 트리거"
      user_action: "탭"
      feedback: navigation
    a11y:
      role: button
      label: "뒤로가기"

  - name: Title
    type: text
    id: "txt-title"
    tag: h1
    tokens:
      font_size: 18
      font_weight: 600
      color: "var(--wds-label-normal)"
    a11y:
      role: heading
      label: "프로필 편집"

  - name: AvatarWithCameraBadge
    type: content
    id: "avatar-wrapper"
    tag: button
    size: "100x100"
    tokens:
      radius: "var(--wds-radius-full)"
    behavior:
      purpose: "현재 프로필 이미지 표시 + 변경 진입점"
      user_action: "탭 → ImageSourceSheet open"
      feedback: "visual (ripple) + navigation (sheet)"
    states:
      default: "기존 이미지 또는 placeholder"
      uploading: "spinner overlay 중앙"
      error: "pink-tinted overlay + 재시도 아이콘"
    a11y:
      role: button
      label: "프로필 이미지 변경"
      hint: "탭하면 카메라, 앨범 선택 시트가 열립니다"

  - name: CameraBadge
    type: icon
    id: "camera-badge"
    tag: span
    size: "24x24"
    tokens:
      background: "var(--pe-camera-badge-fill)"  # #E2E2E2
      radius: "var(--wds-radius-full)"
      border: "4px solid #FFFFFF"
    a11y:
      role: img
      label: "카메라 아이콘"

  - name: NicknameField
    type: input
    id: "input-nickname"
    tag: input
    tokens:
      background: "var(--pe-input-fill)"      # #F7F7F7
      border: "1px solid var(--pe-input-border)" # #F1F1F1
      radius: "var(--wds-radius-lg)"          # 16
      padding: "12px 16px"
      font_size: "14px"                       # Figma: 14px Medium
      font_weight: 500
      color: "var(--text_dark)"               # #090909
    behavior:
      purpose: "닉네임 입력"
      user_action: "타이핑"
      feedback: "visual (count update, dirty detection)"
    states:
      default: "기존 닉네임 pre-fill"
      focused: "border color unchanged (filled pattern)"
      error: "border-color status-error, inline error 표시"
      disabled: null
    constraints:
      max_lines: 1
      content_policy: "2~20자, 공백 허용, 특수문자 허용"
    a11y:
      role: textbox
      label: "닉네임 입력"

  - name: CharacterCounter
    type: text
    id: "txt-counter"
    tag: span
    tokens:
      font_size: "var(--wds-font-size-xs)"
      color: "var(--wds-label-assistive)"
    states:
      default: "n/20 (grey)"
      error: "0/20 or 21/20 (optional red)"
    a11y:
      role: text
      label: "닉네임 글자 수 카운터"

  - name: InlineError
    type: text
    id: "txt-error"
    tag: p
    tokens:
      font_size: "var(--wds-font-size-xs)"
      color: "var(--wds-status-error)"
    states:
      default: "hidden"
      visible: "길이 < 2 AND dirty"

  - name: PrimarySaveButton
    type: button-primary
    id: "btn-save"
    tag: button
    size: "full width, h-56"
    tokens:
      background_disabled: "var(--pe-save-disabled)"       # #F1F1F1
      background_active: "var(--pe-save-active)"           # #262626
      label_disabled: "var(--pe-save-disabled-label)"      # #C5C5C5 (Figma-accurate — CORRECTED)
      label_active: "var(--pe-save-active-label)"          # #FFFFFF
      radius: "var(--wds-radius-lg)"                       # 16
      font_size: "18px"                                    # Figma: 18px SemiBold
      font_weight: 600
      padding: "12px 28px"
    behavior:
      purpose: "변경사항을 서버에 저장 + 프로필로 복귀"
      user_action: "탭 (dirty + valid 시에만)"
      feedback: "loading spinner → toast → navigation"
    states:
      default: "dirty=false → disabled"
      dirty_valid: "#262626 bg + white label (enabled)"
      dirty_invalid: "disabled (nickname 1자 또는 21자)"
      loading: "spinner + text '저장 중...' + disabled"
      error: "error toast, revert to dirty_valid"
    a11y:
      role: button
      label: "프로필 저장"

states:
  default:
    visible: [BackButton, Title, AvatarWithCameraBadge, CameraBadge, NicknameField, CharacterCounter, PrimarySaveButton]
    hidden: [InlineError]
    description: "초기 진입 — 기존 닉네임/이미지 pre-fill, 저장 비활성"

  nickname-1-char:
    visible: [InlineError]
    save_state: "disabled"
    counter: "1/20"
    description: "닉네임 1자 입력, 저장 비활성, 인라인 에러 노출"

  nickname-valid:
    visible: [AvatarWithCameraBadge, NicknameField]
    hidden: [InlineError]
    save_state: "active (#262626)"
    counter: "예: 7/20"
    description: "닉네임 2~20자 + dirty, 저장 활성"

  uploading:
    visible: [AvatarWithCameraBadge (spinner overlay), NicknameField]
    save_state: "loading"
    description: "이미지 업로드 중 — 저장 버튼 스피너 비활성"

  error:
    visible: [InlineError, Toast (error)]
    save_state: "enabled (재시도 가능)"
    description: "PATCH 실패 — 에러 토스트, 버튼 enable 복귀"

interactions:
  - id: tap-back
    trigger: "BackButton tap"
    target: "screen"
    action: "conditional"
    logic: "if dirty → open ExitConfirmSheet; else → goBack()"
  - id: tap-avatar
    trigger: "AvatarWithCameraBadge tap"
    target: "ImageSourceSheet"
    action: open-overlay
    transition: slide-up
  - id: tap-camera-badge
    trigger: "CameraBadge tap"
    target: "ImageSourceSheet"
    action: open-overlay
    transition: slide-up
  - id: edit-nickname
    trigger: "NicknameField input"
    target: "PrimarySaveButton + CharacterCounter + InlineError"
    action: "validate + update counter + toggle save state"
  - id: tap-save
    trigger: "PrimarySaveButton tap"
    target: "backend"
    action: "PATCH /v2/me/profile → toast → navigate back"

labels:
  ko:
    title: "프로필 편집"
    nickname_label: "닉네임"
    nickname_placeholder: "닉네임을 입력해주세요"
    sample_nickname: "김잼잼"
    save_button: "저장"
    save_button_loading: "저장 중..."
    error_min_length: "2자 이상 입력해주세요"
    error_max_length: "20자 이내로 입력해주세요"
    toast_success: "프로필이 수정되었어요"
    toast_error: "저장에 실패했어요. 잠시 후 다시 시도해주세요"
    a11y_back: "뒤로가기"
    a11y_avatar: "프로필 이미지 변경"

token_map:
  header:
    height: "var(--wds-spacing-48)"
    title_size: "var(--wds-font-size-xl)"
    title_weight: "var(--wds-font-weight-semibold)"
  avatar:
    size: "100px"
    radius: "var(--wds-radius-full)"
    badge_bg: "var(--pe-camera-badge-fill)"
    badge_border: "#FFFFFF 4px"
  input:
    fill: "var(--pe-input-fill)"
    border: "var(--pe-input-border)"
    radius: "var(--wds-radius-lg)"
    padding: "12px 16px"
  save_button:
    disabled_bg: "var(--pe-save-disabled)"       # #F1F1F1
    disabled_label: "var(--pe-save-disabled-label)"  # #C5C5C5 (Figma-accurate)
    active_bg: "var(--pe-save-active)"           # #262626
    active_label: "var(--pe-save-active-label)"  # #FFFFFF
    radius: "var(--wds-radius-lg)"
    height: "56px"
    font_size: "18px"
    font_weight: 600
  extended_tokens:
    text_placeholder_disable: "#C5C5C5"
    surface_disable: "#F1F1F1"
    camera_badge_bg: "#E2E2E2"
    text_dark: "#090909"
    destructive: "#D92800"
    selection_purple: "#8752FA"

quality_score:
  extraction_accuracy:
    total_components: 9
    with_library_match: 9
    with_token_map: 9
    score: "18/18 = 1.0"
  fabrication_risk:
    inferred_fields: ["nickname_placeholder text (표준 UI 관례)", "error copy (§5 미명시 — 관례)"]
    risk_level: low
  schema_completeness:
    required_sections: [meta, component_tree, layout_spec, states, interactions, labels, token_map]
    present_sections: [meta, business_context, component_tree, layout_spec, components, states, interactions, labels, token_map]
    score: "7/7 = 1.0"
  context_coverage:
    why_linked: "4/7 AC (this screen only)"
    what_resolved: "9/9 components"
```
