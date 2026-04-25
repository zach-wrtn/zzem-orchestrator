# Assumption Preview: 프로필편집_사진_앨범선택 (app-009)

## Meta

```yaml
task_id: "app-009"
screen_name: "프로필편집_사진_앨범선택"
generated_at: "2026-04-25T00:00:00Z"
spec_fabrication_risk: "medium"
spec_context_coverage: "5/5 ACs (1.00)"
trigger:
  - "fabrication_risk == medium (B.6 트리거 1)"
  - "system vs in-app picker 결정 모호 — task 명시 양가적 ('시스템 picker 풍' + Figma frame 은 in-app 그리드)"
parent_screen: "app-005 (시트)"
next_screen: "app-008 (크롭)"
```

## Inferred Layout Decisions

```yaml
inferred_layout:
  - decision: "in-app picker 구현 (시스템 OS picker 가 아님)"
    rationale: "Figma 37160:80126 가 명시적인 in-app 그리드 (Header + 3-col grid + bottom bar) 패턴. 시스템 picker 였다면 OS native modal — Figma 화면 자체가 불필요. task '시스템 picker 풍' 은 시각 스타일 참조로 해석 (iOS Photos 와 비슷한 grid + counter + select 버튼)"
    alternatives:
      - "iOS native UIImagePickerController 직접 호출 (이 경우 prototype 불필요 — 빈 placeholder)"
      - "react-native-image-picker 사용한 hybrid (OS picker + 일부 커스텀 UI)"
    would_break_if: "사용자가 'OS native picker 로 충분, in-app 화면 불필요' 결정 → app-009 폐기 + app-005 의 '앨범에서 선택' 이 직접 OS picker 호출"

  - decision: "Single-select (다중 선택 아님) — 프로필 사진은 1장만"
    rationale: "프로필 사진 변경 use case (parent screen app-001 의 ParentAvatar 1장). PRD '앨범에서 사진 1장' 명시. 다중선택 시 크롭(app-008) 대상 불명확"
    alternatives:
      - "Multi-select with last-selected-wins (UX 혼란)"
      - "Multi-select 후 최초 1장만 사용 (안티패턴)"
    would_break_if: "사용자가 'multi-select 허용 후 다음 단계에서 1장 선택' 요청 → SelectIndicator 가 순번 표시로 변경 필요"

  - decision: "BottomBar 에 'N장 선택' counter + cancel + submit 3-요소 배치"
    rationale: "iOS Photos 한국 picker 표준 패턴. form persona #4 (primary 1) 충족 — submit 만 primary, cancel 은 ghost text. counter 는 form persona '진행 상태 명확' 의도 충족"
    alternatives:
      - "counter 생략 (선택 자체로 충분 — 미니멀)"
      - "counter 를 header right 에 배치 (시선 분산)"
    would_break_if: "디자인 요청 'counter 제거' → SelectionCounter 컴포넌트만 hidden, BottomBar 레이아웃은 cancel/submit 양쪽 정렬로 유지"

  - decision: "PhotoThumb 을 gradient-token 4종 순환 (illustration kind, Pass 6 #6 면제)"
    rationale: "실제 사진 자산 없음. context-engine.assets.feed_thumbnails.kind: gradient-token 로 등록 → Pass 6 #6 (placeholder-image) 면제. 그라디언트 색은 모두 토큰 hex (purple-50/100, red-100, neutral-50/200) — Pass 6 #1 도 PASS"
    alternatives:
      - "<div class='placeholder-image'>썸네일</div> + Sprint Lead 'placeholder 허용' 승인 (assets 부재)"
      - "Unsplash CDN 실제 이미지 (외부 의존성 + 라이선스 부담)"
    would_break_if: "사용자가 '실제 사진 mock 필수' 요구 → KB sample_image 패턴 + Sprint Lead asset 질의"

  - decision: "Header 좌측 close (×) + 우측 chevron(앨범전환) — 우측 chevron 은 visual hint, no-op"
    rationale: "task 명시 'Header(타이틀 \"최근 항목\" + close)'. chevron 은 iOS Photos 표준 시사 (앨범 전환) — 본 task 범위 밖이지만 시각 컨텍스트 유지 위해 disabled 표시"
    alternatives:
      - "chevron 제거 (task 범위 엄격 준수)"
      - "chevron tap → 앨범 리스트 sheet (out-of-scope, 별 task 필요)"
    would_break_if: "사용자가 chevron 도 인터랙티브 요구 → 별도 앨범리스트 task 신설"
```

## Placeholder / Content Choices

```yaml
placeholders:
  - component_id: "#cell-{1..12}"
    kind: "gradient-token"
    current: "4종 그라디언트 순환 (purple-soft, red-neutral, neutral-soft, purple-inverse) — 12개 셀에 분배"
    source: "tokens.css hex 조합 (purple-50/100, red-100, neutral-50/200)"
    needs_real_content: false
    rationale: "context-engine.assets.feed_thumbnails.kind: gradient-token (Pass 6 #6 면제). 색상 모두 tokens.css 등재 (Pass 6 #1 PASS)"
    note: "사용자가 실제 사진 mock 요구 시 → real-image kind 로 변경 + KB sample_image 또는 Sprint Lead 자산 질의"

  - component_id: "#header-title"
    kind: "text"
    current: "'최근 항목' (iOS Photos 한국어 표준)"
    source: "task 명시"
    needs_real_content: false

  - component_id: "#selection-count"
    kind: "text"
    current: "'0장 선택' / '1장 선택'"
    source: "iOS Photos 한국어 패턴 추론"
    needs_real_content: false
    note: "사용자가 영어 'Select photo' 요구 또는 다른 카피 선호 시 변경 필요"
```

## Interactions Not In PRD

```yaml
implicit_interactions:
  - interaction: "tap #cell-{n} (이미 selected) → 선택 해제 (toggle)"
    rationale: "single-select 표준 — 동일 셀 재탭은 해제. iOS Photos 와 일치"
    removable: true
    removable_note: "엄격 single-select (한 번 선택하면 다른 셀 선택만 가능, 해제 불가) 요청 시 제거"

  - interaction: "tap #cell-{n} (다른 셀) → 기존 선택 자동 해제 + 새 셀 선택"
    rationale: "single-select 의 'select-replace' 표준 패턴"
    removable: false

  - interaction: "submit-btn disabled 상태에서 tap → no-op (form persona #2 — disabled 차단)"
    rationale: "form persona #1 invalid_attempt 상태는 spec 정의되지만 실제 UI 는 disabled 로 차단 (사용자가 invalid submit 시도 자체를 못 함). error_message 는 a11y 용 + 향후 'enable always + click 시 error' 패턴 변경 시 활용"
    removable: true
```

## Anti-Slop Pre-Check (예상)

```yaml
anti_slop_risks:
  - item: "#1 (hex tokens)"
    risk: "그라디언트 색에 tokens.css 외 hex 사용 시 fail"
    mitigation: "PhotoThumb gradient 색은 모두 #F5F0FF, #EBE1FF, #FFE5E3, #F0F1F3, #F7F8F9, #E4E5E9 (tokens.css purple-50/100, red-100, neutral-50/100/200) 만 사용. 셀 inset border 도 var(--wds-fill-brand-primary)"

  - item: "#2 (emoji on interactive)"
    risk: "SelectIndicator 또는 close 버튼에 ✓ 유니코드 사용 위험"
    mitigation: "SelectIndicator check 마크는 inline Lucide SVG (check icon). close 는 Lucide x icon"

  - item: "#3 (border-left card slop)"
    risk: "PhotoCell 에 border-left 강조 위험"
    mitigation: "선택 강조는 box-shadow inset 3px var(--wds-fill-brand-primary) — border-left 미사용"

  - item: "#5 (purple gradient)"
    risk: "PhotoThumb gradient-a/d 가 purple-50→100 그라디언트 — 브랜드 보라 사용"
    mitigation: "purple-50/100 은 brand primary (#8752FA) 와 별개 light variant. Pass 6 #5 'linear-gradient(... #8752FA ...)' 가 트리거 — purple-500 자체를 그라디언트로 사용하지 않음. light variants 만 사용 → PASS"

  - item: "#6 (placeholder image)"
    risk: "12개 PhotoCell 이 모두 placeholder 일 경우 주 콘텐츠 위치 → fail 가능"
    mitigation: "context-engine.assets.feed_thumbnails.kind: gradient-token + needs_real_content: false 명시. quality-report.yaml assets section 에 등록"

  - item: "#9 (form persona)"
    risk: "강제 룰 4/4 모두 충족 필요"
    mitigation: |
      - #1 inline validation: error_message + #error-msg DOM
      - #2 submit disabled/enabled: visual token 차이 명시 + tokens 분리
      - #3 error inline: bottom-bar 직상 위치 (input area = grid 의 직하 = submit 직상)
      - #4 single primary: submit 만 button-primary, cancel 은 button-secondary (ghost text)
```

## Gate Questions for Sprint Lead

```yaml
gate_questions:
  - "Q1 (CRITICAL): 사진 picker 를 in-app 화면으로 구현 (현재 가정 — Figma frame 따름) vs iOS native UIImagePickerController 호출, 어느 쪽? in-app 이 아니라면 본 prototype 폐기."
  - "Q2: Single-select (1장만 — 현재) vs Multi-select (N장 가능, last-selected-wins), 어느 쪽?"
  - "Q3: BottomBar SelectionCounter '0장 선택 / 1장 선택' 카피 vs '선택 안됨 / 사진 1장 선택됨' vs counter 미표시, 어느 쪽?"
  - "Q4: PhotoThumb 을 gradient-token 4종 순환 (현재 — assets 면제) vs Sprint Lead 가 sample 사진 자산 제공 vs Unsplash CDN 사용, 어느 쪽?"
  - "Q5: Header 우측 chevron (앨범 전환 시사) 표시 (현재 disabled hint) vs 제거 vs 인터랙티브 (별 task 필요), 어느 쪽?"
  - "Q6: form persona rec #2 (submit loading state) skip 채택 OK? — in-app navigation 이라 async 불필요"
```

## User Action

| 선택 | 동작 |
|------|------|
| **proceed** | Step C 진행 (현재 가정대로 — in-app picker + single-select + 4-gradient thumbs + 한국어 카피) |
| **adjust** | Q1~Q6 중 변경 지시 → screen-spec.yaml 수정 후 prototype 재생성 (최대 2회) |
| **stop** | PRD 보강 필요 (특히 Q1 in-app vs system picker 정책 결정) |
