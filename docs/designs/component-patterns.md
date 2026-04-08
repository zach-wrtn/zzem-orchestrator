# ZZEM Component Patterns
> Figma 보정에서 역추출된 컴포넌트 패턴. Design Engineer가 프로토타입 생성 시 참조.
> 각 패턴은 실제 Figma 디자인에서 검증된 것이며, PRD만으로 생성 시 이 패턴을 따르면 Figma와의 괴리를 최소화할 수 있다.

## 최종 업데이트
- Sprint: ugc-profile-nav-001 (2026-04-08)
- Source: Figma 보정 diff 역추출

---

## 1. Feed Grid (콘텐츠 피드)

### 레이아웃
- **2열 매거진 레이아웃** (Pinterest/Masonry 스타일)
- 열 간격: 1px (모자이크)
- 카드 비율: 1:1과 4:5 교차 (같은 열 내에서 번갈아)
- 카드 border-radius: 4px

### 피드 카드 구조
```
┌─────────────────────┐
│ [신규 뱃지]          │  ← 좌상단, 선택적
│                     │
│   (이미지/그라데이션)  │
│                     │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← 하단 그라데이션 오버레이
│ 템플릿 이름           │  ← Pretendard SemiBold 14px white
│ 🟣 쨈 ✅    ♡ 42    │  ← 크리에이터(좌) + 좋아요(우)
└─────────────────────┘
```

### 뱃지
- "신규": bg #0080c6, rounded-8, Pretendard SemiBold 12px white, padding 4px 8px
- 위치: 카드 좌상단, padding 8px

### 크리에이터 프로필 (피드 카드 하단)
- 18px 원형 아바타 + 닉네임 (SemiBold 12px white) + 인증 뱃지 (12px 파란 체크)
- 우측: 하트 아이콘 + 좋아요 수 (SemiBold 12px white, opacity 0.8)

### 프로필 카드 변형 (MY 프로필 탭)
- 크리에이터 프로필 대신 **재생성 카운트** 표시
- 좌하단: 새로고침 아이콘 + 숫자 (pill badge, 반투명 배경)

---

## 2. Bottom Navigation

### 구조
- 3탭: 홈 / 탐색 / MY
- **아이콘만** (텍스트 라벨 없음)
- 높이: pt-10 pb-26 px-12
- 상단 border: 0.5px #f1f1f1

### 아이콘
- 홈: 집 아이콘 (안에 ZZEM 미니 로고)
- 탐색: 돋보기
- MY: 사람 실루엣 + **보라색 dot badge** (우상단, 8px)

### 상태
- Active: 채워진/굵은 아이콘
- Inactive: outline 아이콘

---

## 3. Profile Header

### 레이아웃
```
┌─────────────────────────────────┐
│     아이디              ⚙️      │  ← 헤더: 중앙 정렬 + 설정 아이콘
│                                 │
│         (프로필 이미지)           │  ← 100px 원형, border 1px rgba(136,136,136,0.2)
│                                 │
│     8.6천    83    1.8천         │  ← SemiBold 16px, 3열 균등 (px-40)
│     팔로워   팔로잉   재생성된     │  ← Medium 12px
│                                 │
│  [ 프로필 편집 ]  [ 프로필 공유 ]  │  ← 둘 다 회색, gap-6
│                                 │
│   📱    🔒    ❤️                │  ← 아이콘 탭 (밑줄 인디케이터)
└─────────────────────────────────┘
```

### 프로필 이미지
- 100px 원형, border: 1px rgba(136,136,136,0.2)
- 미설정 시: 회색 실루엣 아바타 (bg #e8e8e8)

### 카운트
- padding: 0 40px
- 숫자: Pretendard SemiBold 16px #262626
- 라벨: Pretendard Medium 12px #262626
- 포맷: 1,000 미만 → 그대로, 1,000~9,999 → "X.X천", 10,000+ → "X.X만"

### 버튼
- **둘 다 회색** (bg #f1f1f1, NOT brand purple)
- rounded-12, h-40, gap-6
- Pretendard SemiBold 14px #262626

### 프로필 탭
- **아이콘만** (텍스트 라벨 없음)
- 게시물: grid/media 아이콘
- 비공개: lock 아이콘
- 좋아요: heart 아이콘
- Active: 하단 2px 밑줄 (#262626), w-60px
- 탭 바: px-20, border-bottom 1px #f1f1f1

---

## 4. Settings Screen

### 구조
- **아이콘 없음** — 텍스트만 + 선택적 chevron (>)
- 섹션 구분: **12px 높이 회색 배경 디바이더** (#f7f7f7)
- 각 행: pl-20 pr-16 py-12, Pretendard Medium 16px

### 로그아웃
- **하단 고정 풀폭 버튼** (리스트 아이템이 아님)
- bg #f1f1f1, rounded-16, h-56
- Pretendard SemiBold 18px #656565

### 섹션 패턴
```
[계정 섹션]    — 계정 정보(이메일), 비밀번호
──12px divider──
[설정 섹션]    — 알림 설정, 차단 관리
──12px divider──
[정보 섹션]    — 이용약관, 개인정보, 고객센터
──12px divider──
[계정 관리]    — 탈퇴하기, 앱 버전

[하단 고정]    — 로그아웃 버튼
```

---

## 5. Profile Edit

### 레이아웃
- 헤더: ← + "프로필 편집" 중앙 (SemiBold 18px)
- 프로필 이미지: 100px, 카메라 배지 (우하단, 검정 원 30px, 카메라 아이콘 white)
- "닉네임" 라벨 + **border-bottom 입력 필드** (배경 없음)
- 하단 고정: "저장" 버튼 (h-56, rounded-16, 비활성=#f1f1f1)

### 바텀시트 (이미지 소스)
- 핸들 바 (상단 중앙 회색 라인)
- "카메라/앨범" (이미지 아이콘)
- "사진 삭제" (휴지통 아이콘, **빨간 텍스트** #FF3B30)
- 취소 버튼 없음

---

## 6. Other User Profile

### MY 프로필과의 차이
- "프로필 편집" / "프로필 공유" 버튼 **없음**
- 팔로우 버튼 **없음** (PRD 3 스코프)
- 게시물 탭**만** 표시 (비공개/좋아요 탭 없음)
- 헤더: 닉네임 + 인증 뱃지 + ⋯ 더보기 (우측)
- 바이오 텍스트 **없음**
- 카운트 바로 아래 피드 그리드 시작

---

## 7. Home Screen (Full Layout)

### 전체 구조 (스크롤 순서)
```
[1] 헤더: ZZEM 로고(좌) + 크레딧·알림(우)
[2] 카테고리 칩: 가로 스크롤 pill 버튼 (비디오 생성/이미지 생성/댄스 챌린지/...)
[3] 신규 템플릿: "쨈 신규 템플릿" + 가로 스크롤 100x100 카드
[4] 실시간 랭킹: 1~8위 리스트 (접기/펼치기)
[5] 필터 탭: 추천/무료/비디오/이미지/조합 (가로 스크롤, sticky)
[6] 피드 그리드: 2열 매거진 (무한 스크롤)
```

### 카테고리 칩
- pill shape, border 1px #e8e8e8, padding 8px 14px
- Pretendard Medium 13px, rounded-full
- 일부 칩에 green "NEW" dot badge (우상단)

### 신규 템플릿 카드
- 100x100px, rounded-12
- 하단: 이름 (Medium 12px), 1줄 말줄임
- 가로 스크롤, gap 8px, px-16

### 실시간 랭킹
- 순위 번호 (Bold 16px) + 썸네일 (40px, rounded-8) + 이름 (Medium 14px) + 타입 뱃지 ("비디오"/"이미지", 회색 pill) + "만들기" 버튼 (보라색 outline pill)
- "닫기 ∧" / "더보기 ∨" 토글 (접었다 펼치기)

---

## 공통 디자인 토큰

| 토큰 | 값 |
|-----|---|
| Background | white |
| Surface button | #f1f1f1 |
| Surface secondary | #f7f7f7 |
| Text primary | #262626 |
| Text secondary | #656565 |
| Text tertiary | #8a8a8a |
| Outline primary | #f1f1f1 |
| Outline secondary | #e8e8e8 |
| Brand purple | #8752FA |
| Error/Danger | #FF3B30 |
| New badge blue | #0080c6 |
| Font | Pretendard |
| Card radius | 4px |
| Button radius | 12px (일반), 16px (CTA) |
| Profile radius | 999px |
| Chip radius | 9999px |
