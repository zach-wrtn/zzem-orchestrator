# Figma Design Context Summary — ugc-profile-nav-001

> 추출일: 2026-04-09
> Figma: Wrtn-X_ZZEM_Sprint-File (node 37160:25098)
> 총 ~36 프레임에서 추출

## 추출 파일 목록

| AC | 파일 | 프레임 수 |
|----|------|-----------|
| AC 2.1 — 프로필 진입점 | [AC_2.1.md](AC_2.1.md) | 2 |
| AC 2.2 — 프로필 구조 및 탭 | [AC_2.2.md](AC_2.2.md) | 6 |
| AC 2.3 — 프로필 공유 | [AC_2.3.md](AC_2.3.md) | 4 |
| AC 2.4 — 프로필 편집 | [AC_2.4.md](AC_2.4.md) | 10 |
| AC 2.5 — 세로 스와이프 진입 | [AC_2.5.md](AC_2.5.md) | 8 |
| AC 2.7 — 생성 후 프로필 랜딩 | [AC_2.7.md](AC_2.7.md) | 4 |
| AC 2.8 — 설정 화면 | [AC_2.8.md](AC_2.8.md) | 1 |
| AC 7.1 — 타 유저 프로필 | [AC_7.1.md](AC_7.1.md) | 5 |

---

## 공통 디자인 토큰

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--background_primary` | `white` | 전체 배경 |
| `--background_B1F` | `#090909` | 다크모드 상세뷰 배경 |
| `--text_primary` | `#262626` | 기본 텍스트 |
| `--text_secondary` | `#656565` | 보조 텍스트 |
| `--text_tertiary` | `#8a8a8a` | 3차 텍스트, 빈 상태 |
| `--text_white` | `white` | 다크 서피스 위 텍스트 |
| `--text_primary_inverted` | `#f7f7f7` | 다크 버튼 위 텍스트 |
| `--surface_primary_invert` | `#262626` | 활성 버튼, 다크 서피스 |
| `--surface_button` | `#f1f1f1` | 프로필 액션 버튼 |
| `--surface_secondary` | `#f7f7f7` | 텍스트필드 배경 |
| `--surface_tertiary` | `#e2e2e2` | 비활성 요소 |
| `--surface_disable` | `#f1f1f1` | 비활성 버튼 |
| `--surface_elevated` | `white` | 바텀시트 |
| `--outline_primary` | `#f1f1f1` | 구분선, 텍스트필드 보더 |
| `--dim_secondary` | `rgba(0,0,0,0.4)` | 모달 오버레이 |
| `--zzem_purple/400` | `#a788fd` | 토글 활성 |
| `--zzem_purple/500` | `#8752fa` | 선택 하이라이트, 액센트 |
| `--function_red_3` | `#d92800` | 파괴적 액션 (삭제, 신고) |

### Typography (Pretendard)

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

### Layout

- 기준 디바이스: 375x812 (iPhone)
- Bottom Navigation 높이: 3탭 (Home/Search/My)

---

## 공통 컴포넌트 패턴

### HeaderBar
- Back arrow (24x24 `ArrowshortLeft_Stroke_L`) + 중앙 SemiBold 18px 타이틀
- 높이: 48px

### RegularButton
- `h-56px`, `rounded-16px`, full-width, SemiBold 18px 중앙 정렬
- 활성: `surface_primary_invert` bg + inverted text
- 비활성: `surface_disable` bg + placeholder text

### BottomSheet
- `surface_elevated` bg, `rounded-28px`, 핸들바 (40x4, `#a7a7a7`/`#c5c5c5`)
- 딤 오버레이: `rgba(0,0,0,0.4)`

### BottomConfirmSheet
- 텍스트 영역 + 듀얼 액션 버튼 (취소 + 확인), 6px gap

### Avatar_UserProfile
- 100x100, `rounded-999px`, border `rgba(136,136,136,0.2)`
- 미설정 시: `#f5f3ff` 배경 + 디폴트 아바타
- 카메라 버튼: 24x24, `surface_tertiary` bg, border-4 white, 우하단 위치

### Profile Stats Row
- 3열: 팔로워 / 팔로잉 / 재생성된
- 카운트: Subtitle4-16 (SemiBold 16px)
- 레이블: Body7-12 (Medium 12px)

### Profile Action Buttons
- 2열: 프로필 편집 / 프로필 공유
- `surface_button` (#f1f1f1), `rounded-12px`

### Grid Feed
- 2-column masonry, 1px gap, `rounded-4px`
- 하단 그라데이션 오버레이
- 가변 비율 (1:1 또는 ~4:5)
- 카드에 재생성 카운트 표시

### Tab System (프로필)
- 3개 아이콘 탭: MediaFill / LockFill / HeartFill
- 활성: 2px underline bar in `surface_primary_invert`

### Toast Message
- `#171717` bg, `rounded-40px`, shadow `0 0 20px rgba(0,0,0,0.2)`
- SemiBold 14px white 텍스트

### Textfield
- `surface_secondary` bg, `outline_primary` border, `rounded-16px`
- px-16, py-12, Medium 14px

### Photo Selection Grid
- 3-column, 120px row height, 2px gap
- 선택 시: `zzem_purple` border + filled checkbox

---

## Detail View (세로 스와이프) 전용 패턴

### PostCard
- Full-screen, blur 배경 (20-30px)
- 상단/하단 그라데이션 디밍

### Side Action Buttons
- 세로 28px 간격 컬럼
- Heart, Regenerate, Share, More + optional thumbnail

### Toggle (공개 전환)
- 34x20px
- ON: `#8752fa` (zzem_purple)
- OFF: white 40% opacity

### Feed Variants
| 상태 | 특징 |
|------|------|
| 게시물탭 기본/내게시물 | 버튼 2개 (regen + toggle) |
| 타유저 게시물 | "템플릿 사용하기" CTA 단독 |
| 비공개탭 | 프롬프트 텍스트 + mask fade + "프롬프트 편집하기" 버튼 |
| 더보기 바텀시트 | 다운로드/의견보내기/신고 메뉴 |

---

## Generating/Failed 상태 패턴

| 상태 | 시각적 처리 |
|------|------------|
| 생성중 | 회색 그라데이션 bg + "생성중..." 텍스트 + 회전 로고 스피너 |
| 생성실패 | 회색 그라데이션 bg + "생성 실패" 텍스트 + CancelStroke 닫기 버튼 (30% white circle) |

---

## MY vs 타유저 프로필 차이

| 항목 | MY 프로필 | 타유저 프로필 |
|------|-----------|--------------|
| 헤더 아이콘 | SettingStroke | MorehStroke + emoji badge |
| 액션 버튼 | 프로필 편집 / 공유 | 없음 |
| 탭 | 게시물 / 비공개 / 좋아요 (3탭) | 게시물만 (탭바 없음, 직접 그리드) |
| 생성 상태 | 생성중/실패 썸네일 표시 | 없음 |
| 더보기 | 없음 | 프로필 URL 복사 바텀시트 |

---

## Code Connect 아이콘 전체 목록

SettingStroke, MorehStroke, MediaFill, LockFill, HeartFill, HeartStroke, RegenerateStroke, BellStroke, CancelStroke, ArrowshortdownStroke, ArrowshortrightStroke, ArrowshortLeft_Stroke_L, CameraFill, KakaoChatFill, ImageStroke, TrashStroke, PlusStroke, CheckStroke, VolumeFill, UploadStroke, DownloadStroke, MailSendStroke, SirenStroke, LinkStroke, ShinyFill
