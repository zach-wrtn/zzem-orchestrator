# Stitch Prompt Template

> 이 템플릿은 `/sprint-prototype` 스킬이 app 태스크 명세에서 Stitch 프롬프트를 조립할 때 참조한다.
> `{placeholder}`는 태스크 파일에서 추출한 값으로 치환된다.

---

## 프롬프트 구조

```
Design a mobile app screen for a Korean AI content creation app called "ZZEM" (짬).

Platform: iOS and Android (React Native)
Language: Korean (한국어) for all UI labels and text
Style: Modern, clean, minimal mobile app design
Theme: Dark theme preferred, with vibrant accent colors

---

## Screen: {ScreenName}

### Purpose
{태스크 Objective에서 추출 — 이 화면이 하는 일 2-3문장}

### Layout & Components
{태스크 "Screens / Components" 섹션에서 추출}

- **{ComponentName}**: {역할 설명}
  - 위치: {상단/중앙/하단 등}
  - 포함 요소: {하위 UI 요소 나열}

예시:
- **ProfileHeader**: 프로필 이미지(원형 48px), 닉네임, 팔로워/팔로잉/재생성된 카운트 3개 수치
  - 위치: 화면 상단
  - 포함 요소: 프로필 편집 버튼, 프로필 공유 버튼
- **ProfileContentTabs**: 3개 탭 (게시물 | 비공개 | 좋아요)
  - 위치: 프로필 헤더 아래
- **ContentGrid**: 3열 그리드, 각 셀은 정사각형 썸네일 + 좋아요 수 오버레이
  - 위치: 탭 아래 (스크롤 가능)

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

### Korean Labels
{화면에 표시되는 한국어 텍스트 목록}

- 탭 라벨: "게시물", "비공개", "좋아요"
- 버튼: "프로필 편집", "프로필 공유"
- 카운트 라벨: "팔로워", "팔로잉", "재생성된"
- 빈 상태: "아직 게시물이 없습니다"
```

---

## 추출 규칙

### Screens / Components → Layout & Components

1. 태스크 파일의 `### Screens / Components` 섹션을 읽는다
2. 각 항목을 컴포넌트로 변환:
   - `(new)` 표시 → 새로 디자인해야 할 컴포넌트
   - `(existing)` 또는 표시 없음 → 기존 패턴 참조
3. 위치 정보가 없으면 자연스러운 모바일 레이아웃 순서 적용

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
