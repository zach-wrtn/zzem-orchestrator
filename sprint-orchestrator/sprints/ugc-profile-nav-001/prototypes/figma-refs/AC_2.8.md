# AC 2.8 — 설정 화면

## 설정 (node-id: 37174-21780)

### Design Tokens
- **Background**: `--background_primary` (white)
- **Text Primary**: `--text_primary` / `--text/text_primary` (#262626)
- **Text Secondary**: `--text_secondary` (#656565)
- **Text Tertiary**: `--text_tertiary` (#8a8a8a)
- **Surface Button**: `--surface_button` (#f1f1f1)
- **Surface Secondary**: `--surface_secondary` (#f7f7f7) -- section divider
- **Surface White**: `--surface_white` (white)
- **Surface Elevated**: used in bottom sheets elsewhere
- **Outline Primary**: `--outline_primary` (#f1f1f1) -- Google icon border
- **Icon Primary**: `--icon_primary` (#262626)
- **Icon White**: `--icon_white` (white) -- toggle knob
- **ZZEM Purple 400**: `--zzem_purple/400` (#a788fd) -- toggle active bg
- **Font**: Pretendard
- **Typography**:
  - Subtitle3-18: SemiBold 18px / 1.5 (Page title "설정", Logout button)
  - Body4-16: Medium 16px / 1.5 (Setting list items)
  - Subtitle4-14: SemiBold 14px / 1.4 (App version number)
- **Spacing**: Setting items pl-20 pr-16/24 py-12; Sections gap-16; Divider h-12
- **Radius**: Screen 40px, Google icon 42.5px, Toggle 62.5px, Logout button 16px

### Component Structure
- Screen (375w, rounded-40)
  - Header
    - StatusBar (iOS, different format from MY -- uses SF Pro Text with letter-spacing)
    - HeaderBar: [ArrowshortLeft back button] ["설정" title centered] [empty right spacer pr-44]
  - Contents (flex-1, gap-16, pt-20)
    - Section 01 (Account)
      - 계정: displays Google icon + "meme@gmail.com" in tertiary color
      - 비밀번호: with ArrowshortRight chevron
    - Divider (12px, bg surface_secondary #f7f7f7)
    - Section 02 (Legal + Notifications)
      - 서비스 이용약관: with ArrowshortRight
      - 개인정보 처리방침: with ArrowshortRight
      - 고객센터: with ArrowshortRight
      - 소식 알림: with Toggle switch (active state, purple #a788fd bg, white knob)
    - Divider (12px, bg surface_secondary)
    - Section 03 (Account actions)
      - 탈퇴하기: plain text, no chevron
      - 앱 버전: shows "1.1.1" in tertiary SemiBold 14px
  - Button (bottom area)
    - 로그아웃 button: full-width, h-56, rounded-16, bg surface_button, text secondary color

### Reference Code
```tsx
// Settings screen
<div className="bg-[var(--background_primary,white)] flex flex-col rounded-[40px]">
  {/* Header */}
  <div className="flex h-[48px] items-center justify-between pl-[12px] pr-[44px] py-[4px]">
    <div className="rounded-[8px]">
      {/* ArrowshortLeft back icon */}
    </div>
    <p className="font-['Pretendard:SemiBold'] text-[18px] text-center flex-[1_0_0]">설정</p>
  </div>

  {/* Account section */}
  <div className="flex items-center justify-between pl-[20px] pr-[24px] py-[12px]">
    <p className="font-['Pretendard:Medium'] text-[16px] text-[var(--text_primary)]">계정</p>
    <div className="flex gap-[4px] items-center">
      <div className="border-[0.833px] border-[var(--outline_primary)] rounded-[42.5px] size-[20px]">
        {/* Google logo */}
      </div>
      <p className="font-['Pretendard:Medium'] text-[16px] text-[var(--text_tertiary,#8a8a8a)]">
        meme@gmail.com
      </p>
    </div>
  </div>

  {/* Toggle item */}
  <div className="flex items-center justify-between px-[20px] py-[12px]">
    <p className="font-['Pretendard:Medium'] text-[16px]">소식 알림</p>
    <div className="w-[48px] h-[28px]">
      <div className="bg-[var(--zzem_purple/400,#a788fd)] rounded-[62.5px]" />
      <div className="bg-[var(--icon_white,white)] h-[24px] rounded-[37.5px]" /> {/* knob */}
    </div>
  </div>

  {/* Logout button */}
  <div className="px-[16px] pb-[32px] pt-[16px]">
    <div className="bg-[var(--surface_button,#f1f1f1)] h-[56px] rounded-[16px]">
      <p className="font-['Pretendard:SemiBold'] text-[18px] text-[var(--text_secondary,#656565)]">
        로그아웃
      </p>
    </div>
  </div>
</div>
```
