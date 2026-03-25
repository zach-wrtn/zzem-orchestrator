Design a mobile app screen for a Korean AI content creation app called "ZZEM" (짬).

Platform: iOS and Android (React Native)
Language: Korean (한국어) for all UI labels and text
Style: Modern, clean, minimal mobile app design
Theme: Dark theme with vibrant accent colors

---

## Screen: ProfileMoreMenu

**Purpose:** Bottom sheet menu shown on another user's profile with action options.

**Components:**
- **Bottom sheet** overlay with 3 menu items in a vertical list:
  - "프로필 URL 복사" (Copy profile URL)
  - "차단하기" (Block user)
  - "신고하기" (Report user)

**User Flow:**
1. On another user's profile → tap more (···) button
2. Bottom sheet slides up with 3 options
3. Tap an option → perform corresponding action or navigate to next screen

**Visual Rules:**
- Standard bottom sheet with rounded top corners
- Each menu item is a full-width tappable row
- "차단하기" and "신고하기" may use a warning/red color to indicate destructive actions

**Korean Labels:**
- "프로필 URL 복사"
- "차단하기"
- "신고하기"

---

## Screen: BlockConfirmBottomSheet

**Purpose:** Confirmation bottom sheet before blocking a user. Warns the user about consequences.

**Components:**
- **Warning text:** Title and description explaining what blocking does
- **Confirm button:** Destructive red style — "차단"
- **Cancel button:** Neutral style — "취소"

**User Flow:**
1. Tap "차단하기" from ProfileMoreMenu
2. BlockConfirmBottomSheet appears
3. User reads warning → tap "차단" to confirm or "취소" to dismiss
4. On confirm → block API call → dismiss sheet → update profile view

**Visual Rules:**
- Bottom sheet overlay
- Warning text prominently displayed
- Confirm button in destructive red
- Cancel button in neutral/secondary style

**Korean Labels:**
- Title: "이 사용자를 차단하시겠습니까?"
- Description: "차단하면 상대방의 콘텐츠를 볼 수 없습니다"
- Confirm: "차단"
- Cancel: "취소"

---

## Screen: BlockedProfileView

**Purpose:** View shown when visiting a profile of a user you have blocked. Minimal layout with unblock option.

**Components:**
- **Center message:** Large text indicating the account is blocked
- **Unblock button:** Below the message, allows user to reverse the block

**User Flow:**
1. Navigate to a blocked user's profile
2. See minimal blocked state with message and unblock button
3. Tap "차단 해제" → unblock API call → profile reloads normally

**Visual Rules:**
- Minimal layout — no content, no feed, no stats
- Message and button centered vertically
- Muted/subdued styling to indicate restricted state

**Korean Labels:**
- Message: "이 계정을 차단했어요"
- Button: "차단 해제"

---

## Screen: ReportScreen

**Purpose:** Report a user or content. Requires selecting a reason and entering a description.

**Components:**
- **Reason selection:** Radio buttons with the following options:
  - "스팸" (Spam)
  - "부적절한 콘텐츠" (Inappropriate content)
  - "저작권 침해" (Copyright infringement)
  - "기타" (Other)
- **Text input area:** Free text, required, max 100 characters, with character counter
- **Submit button:** "신고하기"

**User Flow:**
1. Select a reason from the radio button list
2. Enter description in text area (required, max 100 chars)
3. Character counter updates as user types (e.g., "42/100")
4. Tap "신고하기" → POST /reports → confirmation toast → navigate back

**Visual Rules:**
- Radio buttons clearly indicate selected state
- Text area shows character count (current/max)
- Submit button disabled until both reason selected and text entered
- Success toast appears after submission

**Korean Labels:**
- Screen title: "신고하기"
- Prompt: "신고 사유를 선택해주세요"
- Reasons: "스팸", "부적절한 콘텐츠", "저작권 침해", "기타"
- Text area placeholder: "상세 내용을 입력해주세요 (필수)"
- Character limit: "100"
- Success toast: "신고가 접수되었습니다"

---

## Screen: OpinionScreen

**Purpose:** Send opinion or feedback to another user. Entry point is a speech bubble icon on another user's profile.

**Components:**
- **Text area:** Free text, max 300 characters, with character counter
- **Submit button:** "보내기"
- **Auto-attached contentId:** If applicable, shown as a small thumbnail preview

**User Flow:**
1. Tap speech bubble icon on another user's profile
2. OpinionScreen opens with text area
3. Enter text (max 300 chars), character counter updates
4. If triggered from specific content, contentId is auto-attached and shown as thumbnail
5. Tap "보내기" → POST /opinions → success toast → navigate back

**Visual Rules:**
- Text area is the primary focus of the screen
- Character count displayed (e.g., "120/300")
- Submit button disabled until text is entered
- Content thumbnail (if attached) shown as a small preview above or below the text area
- Success toast appears after submission

**Korean Labels:**
- Screen title: "의견 보내기"
- Text area placeholder: "의견을 입력해주세요"
- Character limit: "300"
- Submit button: "보내기"
- Success toast: "의견이 전달되었습니다"
