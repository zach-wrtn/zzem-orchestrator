# Figma Design Spec Template

> 이 템플릿은 `/sprint` Phase 3에서 Design Engineer가 app 태스크 명세로부터 Figma 디자인 사양을 조립할 때 참조한다.
> `{placeholder}`는 태스크 파일에서 추출한 값으로 치환된다.

---

## 디자인 사양 구조

```
## Screen: {ScreenName}

### Meta
- App: ZZEM (짬) — AI 콘텐츠 생성 앱
- Platform: iOS / Android (React Native)
- Language: Korean (한국어)
- Frame: 390 x 844 (iPhone 14 Pro)
- Theme: Light (기본) — Dark variant 필요 시 별도 프레임

### Design System
- Tokens: WDS (Wrtn Design System) — docs/DESIGN_TOKENS_METADATA.md
- Brand: Purple #8752FA (light) / #A17BFF (dark)
- Font: Pretendard
- Spacing: 4px grid

---

### Layout & Components
{태스크 "Screens / Components" 섹션에서 추출}

- **{ComponentName}**: {역할 설명}
  - 위치: {상단/중앙/하단 등}
  - WDS 토큰: {적용할 semantic/component 토큰}
  - 포함 요소: {하위 UI 요소 나열}

예시:
- **ProfileHeader**: 프로필 이미지(원형 48px), 닉네임, 팔로워/팔로잉/재생성된 카운트
  - 위치: 화면 상단
  - WDS 토큰: background → semantic.background.normal, avatar → component.avatar (md: 40px)
  - 포함 요소: 프로필 편집 버튼 (button.secondary), 프로필 공유 버튼 (button.ghost)
- **ProfileContentTabs**: 3개 탭 (게시물 | 비공개 | 좋아요)
  - 위치: 프로필 헤더 아래
  - WDS 토큰: tab.active → label.normal, tab.inactive → label.assistive, indicator → label.normal
- **ContentGrid**: 3열 그리드, 각 셀은 정사각형 썸네일 + 좋아요 수 오버레이
  - 위치: 탭 아래 (스크롤 가능)
  - WDS 토큰: gap → spacing.2 (2px), overlay text → caption.caption2

### User Flow
{태스크 "User Interactions" 섹션에서 추출 — 번호 리스트}

1. 유저가 하단 MY 탭을 탭한다
2. 프로필 화면이 표시된다 (기본 탭: 게시물)
3. 탭을 스와이프하여 비공개/좋아요 탭으로 전환한다
4. 콘텐츠를 탭하면 세로 스와이프 피드로 진입한다

### Visual Rules
{태스크 "Business Rules" 중 UI에 영향을 주는 항목만 필터}

- 비공개 탭은 본인 프로필에서만 보인다
- 좋아요 수는 축약 없이 실제 숫자로 표시 (0도 표시)
- 타 유저 프로필에서는 게시물 탭만 노출

### WDS Token Mapping
{화면에 적용할 구체적 WDS 토큰 매핑}

| UI 요소 | WDS Token | 값 (Light) |
|---------|-----------|-----------|
| 화면 배경 | semantic.background.normal | #FFFFFF |
| 텍스트 (주요) | semantic.label.normal | #212228 |
| 텍스트 (보조) | semantic.label.alternative | #6B6E76 |
| 텍스트 (힌트) | semantic.label.assistive | #8E9199 |
| 구분선 | semantic.line.normal | #E4E5E9 |
| 브랜드 액션 | semantic.fill.brand-primary | #8752FA |
| 카드 | component.card.fill | #FFFFFF |
| 카드 radius | component.card.radius | 16px (lg) |
| 버튼 (주요) | component.button.primary | fill #8752FA, label #FFFFFF |
| 버튼 (보조) | component.button.secondary | fill #F0F1F3, label #212228 |
| 입력 필드 | component.input | fill #F7F8F9, radius 12px (md) |
| 하단 내비 | component.navigation.bottom-bar | active #8752FA, inactive #8E9199 |

### Korean Labels
{화면에 표시되는 한국어 텍스트 목록}

- 탭 라벨: "게시물", "비공개", "좋아요"
- 버튼: "프로필 편집", "프로필 공유"
- 카운트 라벨: "팔로워", "팔로잉", "재생성된"
- 빈 상태: "아직 게시물이 없습니다"

### State Variations (선택)
{인터랙션 상태별 변화가 필요한 경우}

- Default state: 기본 화면
- Empty state: 콘텐츠 없음
- Loading state: 스켈레톤 UI (component.skeleton)
- Error state: 에러 메시지
```

---

## 추출 규칙

### Screens / Components → Layout & Components

1. 태스크 파일의 `### Screens / Components` 섹션을 읽는다
2. 각 항목을 컴포넌트로 변환:
   - `(new)` 표시 → 새로 디자인해야 할 컴포넌트
   - `(existing)` 또는 표시 없음 → 기존 패턴 참조
3. 위치 정보가 없으면 자연스러운 모바일 레이아웃 순서 적용
4. **WDS 토큰 매핑 필수**: 각 컴포넌트에 적용할 semantic/component 토큰을 명시

### User Interactions → User Flow

1. `### User Interactions` 섹션의 번호 리스트를 그대로 가져온다
2. 기술적 용어(API call, state update 등)는 제거하고 사용자 행동만 남긴다

### Business Rules → Visual Rules

UI에 영향을 주는 규칙만 필터한다:

**포함:**
- 표시/숨김 조건 ("본인만 볼 수 있다", "타 유저에게는 미노출")
- 텍스트 포맷 ("숫자 축약 없음", "최대 20자")
- 레이아웃 조건 ("3개 탭", "그리드 형태")
- 상태별 UI 변화 ("차단 시 → 차단 해제 버튼 표시")

**제외:**
- 서버 로직 ("마진 체크 수행", "커서 페이지네이션")
- 데이터 정책 ("DB에 유지", "1개월 보관")
- 알림 정책 ("배치 발송", "빈도 제한 없음")

### Korean Labels 추출

1. Business Rules와 User Interactions에서 한국어 텍스트를 식별
2. PRD 원본에서 UI 라벨 참조 (버튼명, 탭명, 안내 문구)
3. 명시되지 않은 라벨은 자연스러운 한국어로 제안

### WDS Token Mapping 규칙

1. `docs/DESIGN_TOKENS_METADATA.md`에서 해당 컴포넌트의 토큰을 찾는다
2. Semantic 토큰 우선 → Component 토큰 → Primitive 토큰 순으로 적용
3. Light 테마 기본, Dark 테마는 별도 프레임이 필요할 때만 추가
4. 토큰 경로 형식: `wds/{category}/{group}/{token}` (예: `wds/semantic/fill/brand-primary`)
