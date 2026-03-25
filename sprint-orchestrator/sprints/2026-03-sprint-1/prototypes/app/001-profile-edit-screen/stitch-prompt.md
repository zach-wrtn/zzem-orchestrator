Design a mobile app screen for a Korean AI content creation app called "ZZEM" (짬).

Platform: iOS and Android (React Native)
Language: Korean (한국어) for all UI labels and text
Style: Modern, clean, minimal mobile app design
Theme: Dark theme with vibrant accent colors

---

## Screen: ProfileEditScreen

### Purpose
Edit profile image and nickname. Free nickname changes with no limits. Image picker with crop.

### Layout & Components

- **ProfileImagePicker**: Large circular image centered at the top of the screen. Tap to change. Camera/gallery icon overlay on the bottom-right of the circle to indicate editability.
- **NicknameInput**: Text input field below the image, pre-filled with the current nickname. Character counter displayed at the right end of the input (current count / max 20).
- **SaveButton**: Full-width button fixed at the bottom of the screen, labeled "저장".

### User Flow

1. Screen loads with current profile image and nickname pre-filled
2. Tap the profile image to open the image picker (camera or gallery)
3. Select an image, then crop UI appears (square aspect ratio)
4. After cropping, the preview updates immediately on screen
5. Edit nickname in the text field (max 20 characters enforced)
6. Tap "저장" to upload changes (multipart/form-data) — on success, navigate back to profile
7. On error, display a toast message

### Visual Rules

- Nickname limited to 20 characters with a visible counter (e.g., "8/20")
- Image crop enforces a square aspect ratio
- Save is enabled if either image or nickname has been changed (no need to change both)
- Navigation bar title: "프로필 편집"

### Korean Labels

- "프로필 편집"
- "닉네임"
- "저장"
- "닉네임을 입력해주세요"
- "20"
- "변경사항이 저장되었습니다"
