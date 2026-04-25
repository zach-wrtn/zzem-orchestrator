# Assumption Preview — MyProfileScreen-PhotoChanged (app-010)

> Trigger: `fabrication_risk = low` (Section B.6 조건 충족)
> Sprint Lead 가 Step C 진입 전 검토할 결정 사항만 기록한다.

## Inferred Layout Decisions (Spec 에 없던 결정)

| # | 결정 | 근거 | 대안 | 영향 |
|---|------|------|------|------|
| 1 | Hero 영역 ≥320px 충족을 위해 avatar(100) + nickname(24) + bio(20) + count-row(48) + cta-row(40) + padding(64) ≈ **296~320px** 구성. **Bio 1줄 추가** | detail persona 강제 룰 #1 (320px+) — bio 없으면 부족 | bio 생략 + cta padding 증가 | 시각 hierarchy 자연스러움 ↑ |
| 2 | **헤더 우상단 dual icon (Bell + Settings)** 노출 | Task context "우상단 설정 / 알림 진입" 명시 | 단일 메뉴 collapse | Task 직접 명시 따름 |
| 3 | **새 avatar 표현용 NEW gradient** (--avatar-new-fill, 보라-핑크) + initial 'Z' | 사진 변경 시각 신호가 없으면 "변경됨" 인지 어려움. 실 이미지 미존재 — gradient-token kind | initial only with empty bg | "새 사진" 인지 강화 (AC-1.5 핵심) |
| 4 | **Toast 자동 dismiss 3000ms** — JS setTimeout (alert 절대 미사용) | AC-1.5 "3s 내 auto-dismiss" + Pass 6 #8 안전 | 사용자 close 버튼 | 명시 사양 일치 |
| 5 | **Tab 라벨: Free / Recommend** (icon-only 가 아닌 텍스트 탭) | Task context "Free / Recommend" 직접 명시 | icon-only sticky | Task 직접 명시 따름 — app-016 와 다른 형태 |
| 6 | **Edit (primary) + Share (secondary)** dual CTA — Follow/Message 미노출 | MY 프로필이라 follow 자기 자신 의미 없음 — 편집/공유가 자연스러운 행동 | 단일 Edit + 헤더 공유 icon | detail persona 강제 룰 #4 충족 (1 primary + 1 secondary) |

## Mock Data Decisions (PRD 미명시)

| 항목 | 사용한 값 | 사유 |
|------|----------|------|
| nickname | "zzem_user" | Mock — MY 일반 사용자 ID 표준 placeholder |
| bio | "오늘도 한 컷, 내 인생의 밈" | Hero 영역 충족 + 한국어 톤 자연스럽게 |
| 팔로워/팔로잉/게시물 | 312 / 128 / 24 | MY 일반 사용자 규모 demo (자릿수 다양) |
| 콘텐츠 그리드 6 cells | 1:1 / 4:5 mix gradient placeholder | ugc-platform-002 app-006 답습, app-016 와 동일 |

## Asset Layer 결정

| 슬롯 | kind | source | needs_real_content |
|------|------|--------|-------------------|
| avatar | gradient-token | --avatar-new-fill (linear-gradient 보라-핑크) + initial 'Z' | false (Sprint Lead 명시 — gradient-token fallback OK) |
| feed_thumbnails | gradient-token | local sprint-aliases (--card-N) — 6 cells | false (Pass 6 #6 면제) |
| icons | illustration | lucide inline SVG | false |

## Gate Questions (Sprint Lead)

1. **새 avatar 의 NEW gradient 색상 (보라-핑크)** — 변경 시각 신호로 brand purple 계열 채택. 다른 색이 더 적절한가? (변경 후의 차별화가 핵심)
2. **Tab 라벨 'Free / Recommend' 영문 표기 OK?** — Task context 가 영문 명시. 한글로도 가능 ('자유' / '추천' 등) — Task 명시 따랐음.
3. **Edit / Share dual CTA OK?** — PRD 는 "기본 MY 프로필 레이아웃" 만 명시. detail persona 강제 룰 #4 충족 위해 dual 채택. 실제 ZZEM MY 화면 디자인이 다른 CTA 조합이면 조정 가능.

## Skip 가능 항목

- `inferred_layout` 6건 / `placeholders.needs_real_content: true` 0건 — preview 스킵 조건 미충족 (low fabrication 으로 인해 산출 필수)
- 본 intent.md 는 정보성 — Step C 는 즉시 진행 가능 (Sprint Lead 가 stop 보내지 않는 한)

---

**Status**: Step C 진행 (proceed assumed unless Sprint Lead 가 adjust/stop 보냄).
