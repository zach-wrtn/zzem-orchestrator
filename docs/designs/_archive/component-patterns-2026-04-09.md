> **Archived 2026-04-23.** This file is preserved for history. See `docs/designs/README.md` for the current structure and `/system/` on the deployed gallery for the rendered browser.
>
> Individual components are now MDX files under `docs/designs/components/`, foundations under `docs/designs/foundations/`.

---

# ZZEM Component Patterns
> Figma 보정에서 역추출된 컴포넌트 패턴. Design Engineer가 프로토타입 생성 시 참조.
> 각 패턴은 실제 Figma 디자인에서 검증된 것이며, PRD만으로 생성 시 이 패턴을 따르면 Figma와의 괴리를 최소화할 수 있다.

## 최종 업데이트
- Sprint: ugc-profile-nav-001 (2026-04-09)
- Source: Figma MCP 디자인 컨텍스트 추출 + diff 보정 (36프레임, ~70건)

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
- 헤더: ← + "프로필 편집" 중앙 (SemiBold 18px), h-48px
- 프로필 이미지: 100px, 카메라 배지 (우하단, 24x24, bg #e2e2e2, border-4 white, CameraFill 아이콘)
- "닉네임" 라벨 + **filled rounded box 입력 필드** (bg #f7f7f7, border 1px #f1f1f1, rounded-16px, px-16 py-12)
- 하단 고정: "저장" 버튼 (h-56, rounded-16, 비활성=#f1f1f1, 활성=#262626 + white text)
- 저장 버튼은 dirty state 감지 (닉네임 변경 또는 사진 변경 시 활성화)

### 바텀시트 (이미지 소스)
- 핸들 바 (40x4, #a7a7a7, 상단 중앙)
- "카메라/앨범" (ImageStroke 아이콘 + 텍스트, gap-12)
- "사진 삭제" (TrashStroke 아이콘, **빨간 텍스트** #d92800)
- 아이콘 서클 래퍼 없음 (인라인 아이콘 + 텍스트)

### 나가기 확인 바텀시트
- 미저장 변경사항 있을 때 뒤로가기 시 노출
- "수정사항이 있습니다. 그래도 나가시겠습니까?"
- 듀얼 버튼: 취소 (surface_hover bg) + 확인 (#262626 bg), gap-6

### 사진 크롭 화면
- 헤더: "크기 설정", 닫기 + 완료
- 크롭 영역: 4 corner handles (27x27 SVG)
- 하단: "완료" 버튼 (dark bottom bar + safe area)

### 앨범 선택 화면
- 헤더: 닫기 + 앨범 드롭다운 + "완료"
- 3-column grid, 120px row height, 2px gap
- 카메라 셀 (첫 번째 위치)
- 선택 시: zzem_purple (#8752fa) border + filled checkbox

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

## 8. Detail View (세로 스와이프 피드)

### PostCard
- Full-screen, blur 배경 (20-30px)
- 상단 그라데이션 디밍 (위→아래 투명)
- 하단 그라데이션 디밍 (아래→위 투명)
- 배경색: #090909 (background_B1F)

### Side Action Buttons
```
  [♡]    ← HeartStroke/HeartFill (토글)
  [♻️]    ← RegenerateStroke + 카운트
  [↑]    ← UploadStroke (공유)
  [⋯]    ← MorehStroke (더보기)
  [□]    ← 썸네일 (선택적)
```
- 세로 28px 간격 컬럼
- 우측 하단 정렬

### Creator Info (좌측 하단)
- 36px 원형 아바타 + verified badge
- 닉네임 (SemiBold 14px white)
- AI noti badge (ShinyFill 아이콘)

### Toggle (공개 전환)
- 34x20px, rounded-62.5px
- ON: #8752fa (zzem_purple/500)
- OFF: white 40% opacity

### Feed Variants
| 진입 탭 | 하단 CTA | 특징 |
|---------|---------|------|
| 게시물(기본) | 재생성 버튼 + 공개 토글 | 2개 버튼 |
| 비공개 | 프롬프트 텍스트 + mask fade + "프롬프트 편집하기" | 커스텀 프롬프트 |
| 좋아요(타유저) | "템플릿 사용하기" CTA 단독 | 싱글 CTA |
| 좋아요(내것) | 재생성 버튼 + 공개 토글 | 게시물과 동일 |

### 더보기 바텀시트
- 메뉴: 다운로드(DownloadStroke) / 의견보내기(MailSendStroke) / 신고(SirenStroke)
- 각 아이템: 아이콘 + 텍스트, gap-12

### Toast Message
- bg #171717, rounded-40, shadow 0 0 20px rgba(0,0,0,0.2)
- SemiBold 14px white, px-24 py-8
- top-40 중앙 정렬, 2초 후 자동 사라짐

---

## 9. Generating/Failed 상태

### 생성중 썸네일
- #f7f7f7 base + dark gradient overlay
- "생성중..." white 16px SemiBold (top-left 10,10)
- 회전 LOGO 스피너 (center)

### 생성실패 썸네일
- #f7f7f7 base + dark gradient overlay
- "생성 실패" white 16px SemiBold (top-left)
- CancelStroke X button (top-right, rgba(255,255,255,0.3) circle)

---

## 10. Bottom Sheet (공통)

### 기본 구조
- surface_elevated (white) bg
- rounded-28px (상단만)
- 핸들 바: 40x4, #a7a7a7 또는 #c5c5c5
- 딤 오버레이: rgba(0,0,0,0.4)

### Confirm Sheet
- 텍스트 영역 + 듀얼 액션 버튼 (취소 + 확인), gap-6
- 확인: #262626 bg, white text
- 취소: rgba(0,0,0,0.1) bg

### Menu Sheet
- 메뉴 아이템: 아이콘 + 텍스트, gap-12, py-16
- 위험 액션: #d92800 텍스트

---

## 공통 디자인 토큰

| 토큰 | 값 | 용도 |
|-----|---|------|
| --background_primary | white | 전체 배경 |
| --background_B1F | #090909 | 다크모드 상세뷰 |
| --surface_button | #f1f1f1 | 프로필 액션 버튼 |
| --surface_secondary | #f7f7f7 | 텍스트필드 배경, 디바이더 |
| --surface_tertiary | #e2e2e2 | 카메라 배지, 비활성 |
| --surface_disable | #f1f1f1 | 비활성 버튼 |
| --surface_elevated | white | 바텀시트 |
| --surface_primary_invert | #262626 | 활성 CTA 버튼 |
| --text_primary | #262626 | 기본 텍스트 |
| --text_secondary | #656565 | 보조 텍스트 |
| --text_tertiary | #8a8a8a | 빈 상태, 힌트 |
| --text_primary_inverted | #f7f7f7 | 다크 버튼 위 텍스트 |
| --outline_primary | #f1f1f1 | 구분선, 텍스트필드 보더 |
| --outline_secondary | #e8e8e8 | 칩 보더 |
| --dim_secondary | rgba(0,0,0,0.4) | 모달 오버레이 |
| --zzem_purple/400 | #a788fd | 토글 활성 |
| --zzem_purple/500 | #8752fa | 선택, 액센트, CTA |
| --function_red_3 | #d92800 | 삭제, 신고, 파괴적 액션 |
| New badge blue | #0080c6 | 신규 뱃지 |
| Font | Pretendard | 전체 |
| Card radius | 4px | 피드 카드 |
| Button radius | 12px (일반), 16px (CTA) | 버튼 |
| Bottom sheet radius | 28px | 바텀시트 (상단만) |
| Profile radius | 999px | 아바타 |
| Chip radius | 9999px | 필 칩 |

### Typography Scale

| Style | Weight | Size | Line Height |
|-------|--------|------|-------------|
| H2-32 | Bold 700 | 32px | 1.2 |
| Title3-18 | Bold 700 | 18px | 1.5 |
| Subtitle2-20 | SemiBold 600 | 20px | 1.5 |
| Subtitle3-18 | SemiBold 600 | 18px | 1.5 |
| Subtitle4-16 | SemiBold 600 | 16px | 1.5 |
| Subtitle6-14 | SemiBold 600 | 14px | 1.4 |
| Body4-16 | Medium 500 | 16px | 1.5 |
| Body6-14 | Medium 500 | 14px | 1.4 |
| Body7-12 | Medium 500 | 12px | 1.5 |
| Label5-10 | Medium 500 | 10px | 1.0 |

### Code Connect 아이콘

SettingStroke, MorehStroke, MediaFill, LockFill, HeartFill, HeartStroke, RegenerateStroke, BellStroke, CancelStroke, ArrowshortrightStroke, ArrowshortLeft_Stroke_L, CameraFill, ImageStroke, TrashStroke, VolumeFill, UploadStroke, DownloadStroke, MailSendStroke, SirenStroke, LinkStroke, ShinyFill, CheckStroke
