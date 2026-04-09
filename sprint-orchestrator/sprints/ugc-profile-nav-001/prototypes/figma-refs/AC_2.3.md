# AC 2.3 — 프로필 공유

## 공유 바텀시트 (node-id: 37174-27893)

### Design Tokens
- Background: rounded-[40px] container
- Status bar overlay: bg-[#aec0cf], 75x39px at top center

### Component Structure
- Root container with background image overlay
- Status bar area with tinted overlay
- Scrollable content area beneath status bar
- Image-based share sheet (screenshot-style composition)

### Reference Code
```tsx
const imgImage6241 = "https://www.figma.com/api/mcp/asset/78b868cb-a4db-4fad-92e2-5075c2888728";
const imgKakaoTalkPhoto = "https://www.figma.com/api/mcp/asset/1d5f173c-3406-44e2-b1d9-5272d112bc9a";

// Root: 375x815.3 rounded-[40px] with background image
// Overlay bar: bg-[#aec0cf] h-[39px] w-[75px] at (154, 56)
// Two KakaoTalk share overlay strips at top
```

---

## 로그인 (node-id: 37180-28104)

### Design Tokens
- **Colors:**
  - background_primary: white
  - Kakao button: bg-[#fee500], text_black
  - Apple button: bg-black, text_white
  - Other login button: surface_tertiary (#e2e2e2), text_primary (#262626)
- **Typography:**
  - Subtitle4-16: Pretendard SemiBold 16px, lineHeight 1.5
- **Spacing:**
  - Content area: px-[16px], pt-[80px], pb-[60px]
  - Button gap: 8px between social login buttons
  - Button padding: py-[16px]
  - Button border-radius: rounded-[16px]
- **Sizing:**
  - ZZEM illustration: 320x320
  - Button height: 56px (implied by py-[16px] + text)

### Component Structure
- HeaderBar (StatusBar only)
- LoginBox (flex-1, centered)
  - Img_ZZEM (320x320 illustration)
  - SocialLoginSection
    - KakaoLoginButton (bg-[#fee500], KakaoChatFill icon + text)
    - AppleLoginButton (bg-black, Apple logo + text)
    - OtherLoginButton (bg-surface_tertiary)

### Reference Code
```tsx
import { KakaoChatFill } from "./KakaoChatFill"

// SocialLoginButton - Kakao
<div className="bg-[#fee500] flex gap-[8px] items-center justify-center py-[16px] rounded-[16px] w-full">
  <KakaoChatFill />
  <p className="font-['Pretendard:SemiBold'] text-[16px] text-black">카카오로 3초 만에 시작하기</p>
</div>

// SocialLoginButton - Apple
<div className="bg-black flex gap-[8px] items-center justify-center py-[16px] rounded-[16px] w-full">
  <img src={imgLogo} className="size-[20px]" />
  <p className="font-['Pretendard:SemiBold'] text-[16px] text-white">애플로 시작하기</p>
</div>

// RegularButton - Other
<div className="bg-[var(--surface_tertiary,#e2e2e2)] h-[56px] flex items-center justify-center rounded-[16px] w-full">
  <p className="font-['Pretendard:SemiBold'] text-[16px] text-[var(--text_primary,#262626)]">다른 방법으로 시작하기</p>
</div>
```

---

## 데스크탑 (node-id: 37180-28124)

### Design Tokens
- **Colors:**
  - background_primary: white
  - QR placeholder: bg-[red] opacity-20
  - text_primary: #262626
  - text_secondary: #656565
- **Typography:**
  - Subtitle2-20: Pretendard SemiBold 20px, lineHeight 1.5
  - Body4-16: Pretendard Medium 16px, lineHeight 1.5
- **Spacing:**
  - Content gap: 40px between QR, text, logo
  - Text gap: 8px between title and description

### Component Structure
- Centered layout (desktop-only view)
  - QR code placeholder (160x160, red/20% opacity)
  - Text section
    - Title: "모바일에서 확인해 주세요"
    - Description: "쨈 앱은 모바일 환경에서 이용할 수 있어요..."
  - ZZEM logo (75.2x20.05)

### Reference Code
```tsx
// Desktop fallback screen
<div className="flex flex-col gap-[40px] items-center w-[317px]">
  <div className="bg-[red] opacity-20 size-[160px]" /> {/* QR placeholder */}
  <div className="flex flex-col gap-[8px] items-center w-full">
    <p className="font-['Pretendard:SemiBold'] text-[20px] text-[var(--text_primary,#262626)]">
      모바일에서 확인해 주세요
    </p>
    <p className="font-['Pretendard:Medium'] text-[16px] text-[var(--text_secondary,#656565)] text-center">
      쨈 앱은 모바일 환경에서 이용할 수 있어요.{'\n'}QR 코드를 스캔하고 지금 바로 쨈 앱을 만나보세요!
    </p>
  </div>
  <img src={imgFrame31} className="h-[20px] w-[75.2px]" /> {/* ZZEM logo */}
</div>
```

---

## 앱스토어 (node-id: 37180-28135)

### Design Tokens
- Full-screen App Store screenshot (375x812)
- rounded-[40px] device frame

### Component Structure
- Full-bleed image of App Store page
- No interactive components (static screenshot reference)

### Reference Code
```tsx
// App Store redirect screen - full screenshot
<div className="overflow-clip rounded-[40px] size-full">
  <img src={imgImage6242} className="absolute inset-0 object-cover size-full" />
</div>
```
