Design a mobile app screen for a Korean AI content creation app called "ZZEM" (짬).

Platform: iOS and Android (React Native)
Language: Korean (한국어) for all UI labels and text
Style: Modern, clean, minimal mobile app design
Theme: Dark theme with vibrant accent colors

---

## Screen: SwipeFeedPublishView

### Purpose
Vertical swipe feed with publish toggle and CTA branching. Own content shows toggle + "다시 생성하기" CTA; others' content shows "템플릿 사용하기" CTA. AI label always visible.

### Layout & Components

- **AiContentLabel**: Fixed at top of screen, displays "✨ AI가 만드는 컨텐츠예요" text. Always visible overlay on top of content.
- **Content**: Fullscreen image/video displayed with cover crop. Portrait aspect ratio (4:5 or 9:16). Vertically swipeable between items.
- **PublishToggleButton**: Toggle switch positioned at right side of screen, visible only on own content. ON state = 공개, OFF state = 비공개.
- **UnpublishConfirmBottomSheet**: Modal bottom sheet that appears when toggling OFF. Contains title text, confirm button, and cancel button.
- **FeedCtaButton**: Fixed bottom CTA button. Text changes based on content ownership — own content: "다시 생성하기", others' content: "템플릿 사용하기".

### User Flow

1. Content is displayed fullscreen with AI label fixed at top of screen
2. If viewing own content, publish toggle is visible on the right side
3. Tapping toggle to OFF triggers the confirm bottom sheet
4. Confirming in bottom sheet sets content to private
5. Bottom CTA displays "다시 생성하기" for own content, "템플릿 사용하기" for others' content
6. Swipe vertically to navigate between feed items

### Visual Rules

- AI label is always visible and cannot be removed by the user
- Custom prompt content cannot be published — show toast: "커스텀 프롬프트 콘텐츠는 공개할 수 없습니다" on publish attempt
- Content fills the entire screen using cover crop (no letterboxing)
- Portrait aspect ratios supported: 4:5 and 9:16

### Korean Labels

- "✨ AI가 만드는 컨텐츠예요"
- "공개"
- "비공개"
- "다시 생성하기"
- "템플릿 사용하기"
- "비공개로 전환하시겠습니까?"
- "확인"
- "취소"
- "커스텀 프롬프트 콘텐츠는 공개할 수 없습니다"
