# Screen Spec: ConfirmSheetsAndFlow (app-003)

## Meta

```yaml
screen_name: "ConfirmSheetsAndFlow"
task_id: "app-003"
sprint_id: "free-tab-diversification"
app: "ZZEM"
platform: "iOS / Android (React Native)"
language: "ko"
frame: "390x844"
theme: "light (sheet) over dim SwipeFeed"
```

## Component Tree

```
DeviceFrame [390x844]
├── SwipeFeedBackdrop [container] (div) #feed-backdrop — dim 블러 배경(#090909 + 40% dim)
│   ├── CreatorInfo [text] (div) #creator-info — 좌하단 크리에이터
│   └── SideActions [list] (div) #side-actions — 우측 액션 아이콘 컬럼
├── DimOverlay [overlay] (div) #dim-overlay — rgba(0,0,0,0.4)
├── FreeUseConfirmSheet [bottom-sheet] (section) #sheet-free — state=free-confirm
│   ├── HandleBar [divider] (div) — 40x4 #a7a7a7
│   ├── Title [text] (h2) — "오늘의 무료 기회를 사용할까요?"
│   ├── Subtitle [text] (p) — "하루에 1번만 무료로 만들 수 있어요"
│   ├── FreeBadge [badge] (div) — 보라 pill "무료 1회 남음"
│   ├── PrimaryBtn [button-primary] (button) #btn-free-use — "무료 사용하기"
│   └── SecondaryBtn [button-secondary] (button) #btn-free-later — "더 둘러볼게요"
├── CreditUseConfirmSheet [bottom-sheet] (section) #sheet-credit — state=credit-confirm
│   ├── HandleBar
│   ├── Title — "크레딧을 사용할까요?"
│   ├── Subtitle — "오늘의 무료 기회를 이미 사용했어요"
│   ├── PriceRow [row] — 코인 아이콘 + "30 크레딧"
│   ├── PrimaryBtn #btn-credit-use — "크레딧 사용하기 · 30"
│   └── SecondaryBtn #btn-credit-cancel — "취소"
├── LoginPromptSheet [bottom-sheet] (section) #sheet-login — state=login-prompt
│   ├── Title — "로그인이 필요해요"
│   ├── Subtitle — "로그인하고 무료로 밈을 만들어보세요"
│   ├── PrimaryBtn #btn-login — "로그인하고 계속하기"
│   └── SecondaryBtn #btn-login-later — "나중에"
├── ErrorSheet [bottom-sheet] (section) #sheet-error — state=error-state
│   ├── Title — "생성에 실패했어요"
│   ├── Subtitle — "잠시 후 다시 시도해주세요"
│   ├── PrimaryBtn #btn-retry — "다시 시도"
│   └── SecondaryBtn #btn-error-close — "닫기"
└── ConcurrentToast [toast] (div) #toast-concurrent — state=concurrent-toast
    └── Text — "밈 생성 중에는 다른 밈을 만들 수 없어요!"
```

## States

```yaml
states:
  free-confirm:
    description: "무료 사용 확인 바텀시트"
    visible: [dim-overlay, sheet-free]
  credit-confirm:
    description: "크레딧 사용 확인 바텀시트 (유료/FREE_ALREADY_USED)"
    visible: [dim-overlay, sheet-credit]
  login-prompt:
    description: "게스트 로그인 유도"
    visible: [dim-overlay, sheet-login]
  concurrent-toast:
    description: "동시 생성 슬롯 초과 토스트"
    visible: [toast-concurrent]
  error-state:
    description: "생성 오류 안내"
    visible: [dim-overlay, sheet-error]
```

## Interactions

```yaml
interactions:
  - trigger: tap
    target: "#btn-free-use"
    action: toggle-state
    state_key: "concurrent-toast"
    notes: "실제 앱에서는 약관→권한→앨범 플로우로 진입"
  - trigger: tap
    target: "#btn-free-later"
    action: close-overlay
  - trigger: tap
    target: "#btn-credit-use"
    action: toggle-state
    state_key: "error-state"
  - trigger: tap
    target: "#btn-credit-cancel"
    action: close-overlay
  - trigger: tap
    target: "#btn-login"
    action: toggle-state
    state_key: "free-confirm"
  - trigger: tap
    target: "#btn-login-later"
    action: close-overlay
  - trigger: tap
    target: "#btn-retry"
    action: toggle-state
    state_key: "free-confirm"
  - trigger: tap
    target: "#btn-error-close"
    action: close-overlay
```

## Visual Rules

```yaml
rules:
  - condition: "무료 기회 보유 + 로그인 상태"
    effect: "FreeUseConfirmSheet 표시"
  - condition: "FREE_ALREADY_USED 또는 크레딧 경로"
    effect: "CreditUseConfirmSheet + 가격 표시"
  - condition: "게스트"
    effect: "LoginPromptSheet 선행 노출 → 로그인 후 free-confirm 재진입"
  - condition: "동시생성 슬롯 초과"
    effect: "ConcurrentToast 노출 (시트 없이)"
  - condition: "생성 요청 후 서버 오류"
    effect: "ErrorSheet 노출 + 무료 기회 재조회"
  - condition: "Primary CTA 연타"
    effect: "버튼 비활성화 상태 유지 (디바운스)"
```

## Labels (ko)

```yaml
labels:
  free_sheet:
    title: "오늘의 무료 기회를 사용할까요?"
    subtitle: "하루에 1번만 무료로 만들 수 있어요"
    badge: "무료 1회 남음"
    primary: "무료 사용하기"
    secondary: "더 둘러볼게요"
  credit_sheet:
    title: "크레딧을 사용할까요?"
    subtitle: "오늘의 무료 기회를 이미 사용했어요"
    primary: "크레딧 사용하기"
    secondary: "취소"
    price: "30"
  login_sheet:
    title: "로그인이 필요해요"
    subtitle: "로그인하고 무료로 밈을 만들어보세요"
    primary: "로그인하고 계속하기"
    secondary: "나중에"
  error_sheet:
    title: "생성에 실패했어요"
    subtitle: "잠시 후 다시 시도해주세요"
    primary: "다시 시도"
    secondary: "닫기"
  toast:
    concurrent: "밈 생성 중에는 다른 밈을 만들 수 없어요!"
```

## Token Map

```yaml
tokens:
  dim: "rgba(0,0,0,0.4)"
  sheet_fill: "#FFFFFF"
  sheet_radius: "28px (top only)"
  handle_bar: "#a7a7a7"
  text_primary: "#262626"
  text_secondary: "#656565"
  button_primary_fill: "#262626"
  button_primary_label: "#FFFFFF"
  button_secondary_fill: "rgba(0,0,0,0.06)"
  button_secondary_label: "#262626"
  zzem_purple: "#8752fa"
  toast_bg: "#171717"
  button_radius: "16px"
  font: "Pretendard"
```
