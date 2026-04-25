# Assumption Preview — MyProfileNicknameUpdated (app-011)

> Trigger: `fabrication_risk = low` (Section B.6 조건 충족)
> Sprint Lead 가 Step C 진입 전 검토할 결정 사항만 기록한다.

## Inferred Layout Decisions (Spec에 없던 결정)

| # | 결정 | 근거 | 대안 | 영향 |
|---|------|------|------|------|
| 1 | Hero 영역 ≥320px 충족: avatar(100) + nickname(24) + count-row(56) + cta-row(40) + paddings(64) ≈ **320px** 정확 | detail persona 강제 룰 #1 — bio 없는 MY profile 도 충족 | bio 라인 추가 | 시각 hierarchy 자연스러움 |
| 2 | **Toast 위치 top** (status+header 아래 100px) — Figma 시사 | Figma frame 에 toast 가 화면 상단에 보임. app-016 의 bottom 위치와 다름 | bottom 위치 답습 | Figma fidelity ↑ |
| 3 | **MY root: back button 없음** — 좌상단 비움, 우상단 settings 만 노출 | Figma frame 시사 + MY 탭 root 컨벤션 | back 추가 | detail persona #2 — root 화면은 back 자체가 부재 가능 (BottomNav 가 dismiss 경로) |
| 4 | **Primary CTA 0개 + Secondary 2개 (편집/공유)** — 결과 확인 컨텍스트라 primary 액션 없음 | Figma 시사 (두 버튼 동일 시각 위계) | 편집을 primary 로 승격 | detail persona #4 만족 (primary ≤1, secondary 0-2) |
| 5 | **Toast 자동 dismiss 3000ms** — JS setTimeout (alert 절대 미사용) | AC-1.5b "3s 내 auto-dismiss" + Pass 6 #8 안전 | 사용자 close 버튼 | 명시 사양 일치 |
| 6 | **TabPrivate enabled** for MY (vs app-016 disabled) | 본인 프로필이므로 비공개 탭 접근 가능 | sibling 답습으로 disabled | MY/타유저 차별화 명확 |
| 7 | **BottomNav 3-tab** (홈/검색/MY) — Figma 시사 simplified variant | Figma 의 3 아이콘 (camera/search/profile) | 5-tab 표준 답습 | Figma fidelity (단, mock 모듈) |

## Mock Data Decisions (PRD 미명시)

| 항목 | 사용한 값 | 사유 |
|------|----------|------|
| newNickname | "maezzi" | Mock — Figma 'a이디' 자리 대체. 한글/영문 둘 다 OK (gate Q1) |
| 팔로워/팔로잉/재생성받 | 0 / 0 / 0 | Figma 시사 — 신규 사용자 상태 |
| count tile 3rd label | "재생성받" | Figma 라벨 가독성 한계 — 실제는 "게시물" 일 수도 (gate Q2) |
| 콘텐츠 그리드 6 cells | 1:1 / 4:5 mix gradient placeholder | sibling app-016 패턴 답습 |
| Avatar | initial 'M' fallback (--pe-avatar-empty-bg) | 실 사진 미존재. 변경 전후 동일 보존만 검증 |

## Asset Layer 결정

| 슬롯 | kind | source | needs_real_content |
|------|------|--------|-------------------|
| avatar | gradient-token | --pe-avatar-empty-bg + initial 'M' | false (Sprint Lead 명시 — fallback OK) |
| feed_thumbnails | gradient-token | local sprint-aliases (--card-N) — 6 cells | false (Pass 6 #6 면제) |
| icons | illustration | lucide inline SVG | false |

## Gate Questions (Sprint Lead)

1. **newNickname mock 값** — 'maezzi' (영문) 사용했으나, 한국어 ('밈러') 가 디자인 일관성에 맞는지? Figma 의 'a이디' 자리는 가상 placeholder.
2. **3rd count tile 라벨** — Figma 가독성 한계로 '재생성받' 으로 추정. 실제는 '게시물' / '받은 좋아요' 등 다른 라벨일 수도. PRD 추가 확인 권장.
3. **BottomNav 3-tab vs 5-tab** — Figma 시사는 3 아이콘 (홈/검색/MY) 이나, ZZEM 표준 5-tab (sibling app-016) 과 충돌. 본 프로토타입은 Figma fidelity 우선 (3-tab).
4. **Toast 위치** — Figma 시사대로 top 위치 채택 (sibling app-016 의 bottom 위치와 다름). MY 화면 컨벤션 결정.

## Skip 가능 항목

- `inferred_layout` 7건 / `placeholders.needs_real_content: true` 0건 — preview 스킵 조건 미충족 (low fabrication 으로 인해 산출 필수)
- 본 intent.md 는 정보성 — Step C 는 즉시 진행 가능 (Sprint Lead 가 stop 보내지 않는 한)

---

**Status**: Step C 진행 (proceed assumed unless Sprint Lead 가 adjust/stop 보냄).
