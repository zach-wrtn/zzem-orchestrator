# Assumption Preview: BlockManagementListScreen

## Meta

```yaml
task_id: "app-017"
screen_name: "BlockManagementListScreen"
generated_at: "2026-04-25T00:00:00Z"
spec_fabrication_risk: "low"
spec_context_coverage: "1.0"
exemplar_inlined: "v2-dogfood-free-tab-app-001-freetabscreen"
exemplar_drift_predicted: false   # 카드 grid → 행 list 로 구조적으로 차별화
```

## Inferred Layout Decisions

```yaml
inferred_layout:
  - decision: "BlockedUserRow 를 컴팩트 list (72px row) 로 채택. 카드 grid 사용 안 함."
    rationale: "feed.md 'Good Pattern Examples' §컴팩트 리스트 (64-72px 좌측 avatar + 우측 텍스트 2줄). exemplar 가 grid 임에도 본 화면은 liste 구조로 의도적 차별화 — Pass 6 #10 drift 회피."
    alternatives:
      - "card grid (exemplar 모방) — anti-pattern, task 지시문에 명시 금지"
      - "1-line row (48px) — 차단일 메타 가독성 저하"
    would_break_if: "list-row 구조가 잘못된 선택일 경우 그리드 컴포넌트 일체 재배치 필요"

  - decision: "AppHeader 에 RefreshButton 명시 노출 (icon-button)"
    rationale: "feed 강제 룰 #4 충족. pull-to-refresh 만으로는 verifier 환경/데모에서 인지 어렵다. 차단 데이터는 정적이지만 표준 룰 적용."
    alternatives:
      - "pull-to-refresh 단독 (verifier 화면에서 visible 하지 않음)"
    would_break_if: "사용자가 refresh 액션을 의도하지 않으면 헤더 우상단 슬롯 비움"

  - decision: "BlockCountSummary (차단된 사용자 N명) 행 추가"
    rationale: "feed 강제 룰 #3 의 6+ items 시각 위계 보강 + 사용자에게 현재 차단 규모 즉시 인지. 일반 list 패턴."
    alternatives:
      - "header 부제 (subtitle) 위치"
      - "생략"
    would_break_if: "사용자가 count UI 불필요하다고 하면 1줄 제거"

  - decision: "BlockedUserRow 내 'avatar + 텍스트 2줄 + 우측 CTA' 의 3-zone 레이아웃"
    rationale: "MemeApp 기존 list 패턴 + feed 강제 룰 컴팩트 리스트 정의 (좌측 아바타 + 우측 텍스트 2줄). CTA 는 행 우측 정렬 (해제 진입점 명시)."
    alternatives:
      - "swipe-to-unblock (gesture only)"
      - "각 행 더보기(⋮) 메뉴 → 해제"
    would_break_if: "swipe gesture 로 변경 시 본 화면 prototype 의 인터랙션 구조 일부 재작성"
```

## Placeholder / Content Choices

```yaml
placeholders:
  - component_id: "#user-avatar-{0..6}"
    kind: "avatar"
    current: "이니셜 1글자 + neutral fill (이미지 미사용)"
    source: "pattern-default — exemplar 의 placeholder 회피 + 행 리스트 표준"
    needs_real_content: false
    note: "차단된 타유저 아바타 실제 src 미공급. PRD asset layer 에서 'app-core-packages/ds/avatars/' fallback 명시했으나 본 prototype 단계에서는 이니셜 fallback 만 사용 — Pass 6 #6 의 '주 콘텐츠 슬롯' 아님 (차단 리스트의 주 콘텐츠는 닉네임/액션이지 아바타 이미지가 아님)"

  - component_id: "#blocked-list li (× 7)"
    kind: "list-item"
    current: "신규 한국어 닉네임 7건 (달리는토끼 외) + 차단일 더미"
    source: "hardcoded — exemplar reuse 금지 (free-tab 의 카테고리/필터명 일체 사용 안 함)"
    needs_real_content: true
    note: "실제 데이터는 GET /v2/me/blocked-users 응답으로 대체. 본 화면은 mock prototype."

  - component_id: "#empty-view illustration"
    kind: "icon"
    current: "Lucide shield-check inline SVG (32px)"
    source: "Lucide pack — task implementation hint '#PR 31 Lucide 패턴'"
    needs_real_content: false
    note: "기호 placeholder 아님 — Lucide SVG 직접 인라인. 면제 대상."
```

## Interactions Not In PRD

```yaml
implicit_interactions:
  - interaction: "tap #refresh-button → toggle-state loading"
    rationale: "feed 강제 룰 #4 — 차단 데이터가 정적이어도 표준 새로고침 인터랙션 필수"
    removable: true

  - interaction: "swipe-down on #body-scroll → toggle-state loading (pull-to-refresh hint)"
    rationale: "exemplar 와 동일 패턴 — 모바일 표준 UX. visual hint 정도이므로 prototype 데모 무방"
    removable: true

  - interaction: "tap #empty-action → go-back SettingsScreen"
    rationale: "empty state 의 단일 primary CTA — 사용자가 막다른 길에 갇히지 않게 함 (empty_state archetype 권고)"
    removable: false
```

## Anti-Slop Pre-Check (예상)

```yaml
anti_slop_risks:
  - item: "#1 (raw hex)"
    risk: "skeleton shimmer 같은 mid-layer gradient hex 일반 사용 가능성"
    mitigation: "tokens.css 의 var(--wds-color-neutral-100/-200) 만 사용, 모든 색상 token 변수 경유"

  - item: "#6 (placeholder-image on main content)"
    risk: "차단 리스트의 avatar 가 주 콘텐츠로 간주될 위험"
    mitigation: "이니셜 텍스트 fallback 사용 (placeholder-image div 사용 안 함). avatar 는 보조 정보로 분류 — 닉네임/액션이 주 콘텐츠"

  - item: "#10 (exemplar drift)"
    risk: "exemplar 의 카드 grid 패턴을 무의식 모방"
    mitigation: "list-row 구조 (수직 1열, 행마다 divider) 채택. 카드 grid CSS 재사용 금지. 시각 비교 자가 검증 — 핵심 레이아웃 유사도 < 30% 예상"

  - item: "#9 (feed persona 4 rules)"
    risk: "loading/empty/refresh 누락 또는 6+ items 부족"
    mitigation: "states 에 loading/empty 명시 + RefreshButton + 7 rows (>=6) 보장"
```

## Gate Questions for Sprint Lead

```yaml
gate_questions:
  - "BlockedUserRow 의 좌측 avatar 를 이니셜 fallback (placeholder-image 미사용) 으로 둬도 되는가? (실 데이터 미공급)"
  - "AppHeader 우상단 RefreshButton 노출 확정? (feed 강제 룰 #4) — pull-to-refresh 만으로도 충분하다면 제거 가능"
  - "BlockCountSummary (차단된 사용자 N명) 행 유지? — 사용자 인지 보강용, 생략 가능"
```

## User Action

| 선택 | 동작 |
|------|------|
| **proceed** | Step C(HTML 생성) 진행. 본 가정 모두 승인. |
| **adjust** | 위 inferred_layout 또는 placeholders 항목 변경 지시. DE 가 spec 수정 후 preview 재생성 (최대 2회). |
| **stop** | 본 화면 prototype 생성 중단. PRD 보강 필요. |
