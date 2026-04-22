# Screen Spec: HomeHeader-WithoutGear

> Sub-fix 1 (MINOR-G2-1) — Home header gear icon 제거 Before/After 비교.
> 본 spec 은 구조적 신규 화면이 아닌 **logic/UX 변경 명세**. Figma 재설계 없음.

## Meta

```yaml
screen_name: "HomeHeader-WithoutGear"
task_id: "app-009"
sprint_id: "ugc-platform-002"
sub_fix: "MINOR-G2-1"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x56 (header only)"
theme: "light"
change_type: "remove"
target_component: "HomeHeader"
```

## Decision

```yaml
decision: "remove"
rationale:
  - "Phase 2 PRD (~/.zzem/kb/products/ugc-platform/phase-2-feed-payback/prd.md) 에 Home header 및 gear icon 관련 명시 없음."
  - "통합 PRD (~/.zzem/kb/products/ugc-platform/prd.md) 에 '설정 화면' 은 Phase 1 범위로만 명시 (MY 3탭 + 프로필 편집 + 타유저 프로필 + 설정 화면)."
  - "Phase 1 AC 2.8 '설정 진입점' canonical = MY 프로필 우상단 gear icon."
  - "Home 헤더 gear 는 SSOT 중복 (dual entry) 로 판단."
prd_grep_evidence:
  phase_2_prd:
    path: "~/.zzem/kb/products/ugc-platform/phase-2-feed-payback/prd.md"
    matches_gear: 0
    matches_home_header: 0
    matches_settings: 0
  overview_prd:
    path: "~/.zzem/kb/products/ugc-platform/prd.md"
    matches_gear: 0
    matches_home_header: 0
    matches_settings: 1
    settings_context: "line 29: Phase 1 범위 (MY 3탭, 프로필 편집, 타유저 프로필, 설정 화면)"
decided_by: "design-engineer"
decided_at: "2026-04-22"
```

## Before / After Comparison

### Before (Phase 1 결과물)

```
HomeHeader [container] (header) #home-header-before — width: 390, height: 56, padding: 0 16
├── Logo [image] (div) #logo — "ZZEM" 로고, 28x28, left
├── Spacer [layout] (div) — flex: 1
├── CoinBadge [badge] (div) #coin-badge — 코인 잔액 표시 (예: "🪙 1,250")
├── NotificationBell [icon-button] (button) #bell — 종 아이콘, 24x24
└── SettingsGear [icon-button] (button) #settings-gear — ⚙ gear 아이콘, 24x24  ← 제거 대상
```

### After (Phase 2 Sub-fix 1 반영)

```
HomeHeader [container] (header) #home-header-after — width: 390, height: 56, padding: 0 16
├── Logo [image] (div) #logo — "ZZEM" 로고, 28x28, left
├── Spacer [layout] (div) — flex: 1
├── CoinBadge [badge] (div) #coin-badge — 코인 잔액 표시 (예: "🪙 1,250")
└── NotificationBell [icon-button] (button) #bell — 종 아이콘, 24x24
```

## Component Details (Removed)

```yaml
removed_components:
  - name: "SettingsGear"
    id: "settings-gear"
    tag: "button"
    type: "icon-button"
    previous_position: "header right-most"
    previous_size: "24x24"
    previous_tokens:
      fill: "transparent"
      text: "semantic.label.normal"
    previous_navigation: "navigate → SettingsScreen"
    reason: "Canonical entry = MY 프로필 gear (Phase 1 AC 2.8). Dual entry 제거."
```

## Layout Spec

```yaml
before:
  direction: "horizontal"
  items: [Logo, Spacer(flex-1), CoinBadge, NotificationBell, SettingsGear]
  gap: 12
after:
  direction: "horizontal"
  items: [Logo, Spacer(flex-1), CoinBadge, NotificationBell]
  gap: 12
visual_diff:
  right_edge_shift: "SettingsGear(24px) + gap(12px) = 36px removed from right cluster"
  total_width: "unchanged (header width fixed at 390)"
  remaining_icons: 2  # CoinBadge(visual), NotificationBell(interactive)
```

## Interactions

```yaml
removed_interactions:
  - trigger: "tap"
    target: "SettingsGear"
    action: "navigate"
    destination: "SettingsScreen"
    transition: "push"
    replacement_path: "BottomNav → MY Tab → MyProfileScreen header gear → SettingsScreen"

unchanged_interactions:
  - trigger: "tap"
    target: "CoinBadge"
    action: "navigate"
    destination: "CoinHistoryScreen | null"
  - trigger: "tap"
    target: "NotificationBell"
    action: "navigate"
    destination: "NotificationScreen"
```

## Affected E2E Flows

```yaml
e2e_flows_to_update:
  - path: "app/apps/MemeApp/.maestro/home-to-settings.yaml"
    existing: "Home header gear tap → SettingsScreen"
    updated: "BottomNav My tap → MyProfileScreen → header gear → SettingsScreen"
    status: "rewrite_required_if_exists"
  - path: "관련 e2e flows with 'home-to-settings' reference"
    action: "search + update path via MY profile"
```

## Visual Rules

```yaml
visual_rules:
  - id: "VR-1"
    rule: "Home header 우측 아이콘 클러스터는 최대 2개 (CoinBadge + NotificationBell)."
  - id: "VR-2"
    rule: "설정 진입점은 MY 프로필 우상단 gear 1곳 (SSOT)."
  - id: "VR-3"
    rule: "기존 HomeHeader 전체 높이 (56px) 및 로고 위치 변경 없음."
```

## Labels (ko)

```yaml
labels:
  coin_badge_aria: "코인 잔액"
  notification_bell_aria: "알림"
  removed_settings_gear_aria: "설정"  # Home header 에서 제거 (MY profile 로 이전)
```

## Token Map

변경 없음. Gear icon 관련 토큰 사용처만 Home header 에서 제거 (컴포넌트 자체는 MY profile 에 존재).

```yaml
tokens_unchanged:
  - "semantic.label.normal"
  - "semantic.bg.normal"
  - "spacing.4 (16px header padding)"
tokens_removed_from_home_header: []  # 모두 다른 컴포넌트에서 공유 중
```

## States

```yaml
states:
  default:
    visible: [Logo, CoinBadge, NotificationBell]
    hidden: [SettingsGear]  # 영구 제거
  notification_dot:
    visible: [Logo, CoinBadge, "NotificationBell(with dot)"]
    hidden: [SettingsGear]
```

## Regression Checklist

```yaml
regression:
  - "MY profile gear → SettingsScreen 진입 정상 (Phase 1 AC 2.8 canonical path)."
  - "NotificationBell tap → NotificationScreen 정상."
  - "CoinBadge tap 동작 Phase 1 대비 변경 없음."
  - "Home 탭 전환 시 header 레이아웃 점프 없음 (56px 고정)."
  - "home-to-settings.yaml Maestro flow 가 존재한다면 MY 경유로 재작성."
```

## Quality Score

```yaml
quality_score:
  extraction_accuracy:
    total_components: 5  # Logo, Spacer, CoinBadge, NotificationBell, SettingsGear
    with_library_match: 5
    with_token_map: 5
    score: "1.0"
  fabrication_risk:
    inferred_fields: []
    risk_level: "none"
  schema_completeness:
    required_sections: ["meta", "decision", "before_after", "layout_spec", "interactions", "states", "visual_rules", "labels", "token_map"]
    present_sections: ["meta", "decision", "before_after", "component_details", "layout_spec", "interactions", "affected_e2e_flows", "visual_rules", "labels", "token_map", "states", "regression", "quality_score"]
    score: "1.0"
  context_coverage:
    why_linked: "1/1"  # Phase 1 AC 2.8 canonical 근거
    what_resolved: "5/5"
```

## Notes

- 본 spec 은 신규 화면이 아닌 **기존 컴포넌트 1개 제거 명세**.
- Figma 디자인 재확인 불필요 (제거만).
- 구현은 `app/apps/MemeApp/src/presentation/home/` 헤더 컴포넌트에서 gear 렌더 코드 제거로 단순 완료.
- Sub-fix 2 ~ 4 는 logic-only 로 prototype skip (approval-status.yaml 에 `skipped` 기록).
