Design a mobile app screen for a Korean AI content creation app called "ZZEM" (짬).

Platform: iOS and Android (React Native)
Language: Korean (한국어) for all UI labels and text
Style: Modern, clean, minimal mobile app design
Theme: Dark theme with vibrant accent colors

---

## Screen: FollowerListScreen

**Purpose:** List of users who follow me. Each item shows avatar, nickname, and follow status button. Alphabetical order. Accessible only from own profile.

**Components:**
- **FollowUserItem:** Row with avatar (36px circle), nickname, FollowButton aligned to the right
- **FollowButton:** 3 states:
  - "팔로우" (none — I don't follow them)
  - "팔로잉" (following — I follow them)
  - "맞팔로우" (mutual — we follow each other)
- **Empty state:** Centered message when no followers exist

**User Flow:**
1. Own profile → tap follower count → navigate to this screen
2. List loads alphabetically (가나다순)
3. Each item: tap avatar or nickname → navigate to that user's profile
4. Tap follow button → toggle follow state

**Visual Rules:**
- Only accessible from own profile (not from other users' profiles)
- List sorted alphabetically (가나다순)
- Avatar is a 36px circle image
- FollowButton visually distinguishes all 3 states (e.g., outline for "팔로우", filled for "팔로잉", accent for "맞팔로우")

**Korean Labels:**
- Screen title: "팔로워"
- Button states: "팔로우", "팔로잉", "맞팔로우"
- Empty state: "팔로워가 없습니다"

---

## Screen: FollowingListScreen

**Purpose:** List of users I follow. Same layout as FollowerListScreen. Alphabetical order. Accessible only from own profile.

**Components:**
- **FollowUserItem:** Row with avatar (36px circle), nickname, FollowButton aligned to the right
- **FollowButton:** 3 states:
  - "팔로우" (none — they don't follow me back, but I can unfollow)
  - "팔로잉" (following — current state for all items in this list)
  - "맞팔로우" (mutual — they also follow me)
- **Empty state:** Centered message when not following anyone

**User Flow:**
1. Own profile → tap following count → navigate to this screen
2. List loads alphabetically (가나다순)
3. Each item: tap avatar or nickname → navigate to that user's profile
4. Tap follow button → toggle follow state (unfollow confirmation if needed)

**Visual Rules:**
- Only accessible from own profile (not from other users' profiles)
- List sorted alphabetically (가나다순)
- Same layout and component styling as FollowerListScreen

**Korean Labels:**
- Screen title: "팔로잉"
- Button states: "팔로우", "팔로잉", "맞팔로우"
- Empty state: "팔로잉하는 사람이 없습니다"
