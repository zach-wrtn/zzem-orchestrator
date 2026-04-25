# Assumption Preview — OtherProfileScreen-Unblocked (app-016)

> Trigger: `fabrication_risk = low` (Section B.6 조건 충족)
> Sprint Lead 가 Step C 진입 전 검토할 결정 사항만 기록한다.

## Inferred Layout Decisions (Spec에 없던 결정)

| # | 결정 | 근거 | 대안 | 영향 |
|---|------|------|------|------|
| 1 | Hero 영역 ≥320px 충족을 위해 avatar(100) + nickname(24) + bio(20) + count-row(48) + cta-row(40) + padding(64) ≈ **296~320px** 구성. **Bio 1줄 추가** | detail persona 강제 룰 #1 (320px+) — bio 없으면 부족 | bio 생략 + cta padding 증가 | 시각 hierarchy 자연스러움 ↑ |
| 2 | **TabPrivate disabled (aria-disabled)** for other-user — 표시는 하되 흐릿 처리 | 비공개 탭은 본인만 접근 가능 (전형 패턴) | tab 아예 숨김 | 본인 프로필과 구조 일관성 유지 |
| 3 | **MoreButton (점 3개)** 우상단 노출 — app-012 진입점 | AC 마지막 항목 "더보기 tap → 일반 메뉴 (app-012) 로 진입" | 헤더 우측 비움 | 사용자가 다시 차단 진입 가능 |
| 4 | **Toast 자동 dismiss 3000ms** — JS setTimeout (alert 절대 미사용) | AC-2.5 "3s 내 auto-dismiss" + Pass 6 #8 안전 | 사용자 close 버튼 | 명시 사양 일치 |

## Mock Data Decisions (PRD 미명시)

| 항목 | 사용한 값 | 사유 |
|------|----------|------|
| nickname | "memer_kim" | Mock — 일반적 한글-라틴 혼용 ID 패턴 |
| bio | "밈은 진심이고 농담이고 인생이에요" | Hero 영역 충족 + 한국어 톤 자연스럽게 |
| 팔로워/팔로잉/게시물 | 1.2만 / 248 / 86 | 다양한 자릿수 demo 노출 (시각 검증) |
| 콘텐츠 그리드 6 cells | 1:1 / 4:5 mix gradient placeholder | ugc-platform-002 app-006 답습 |

## Asset Layer 결정

| 슬롯 | kind | source | needs_real_content |
|------|------|--------|-------------------|
| avatar | gradient-token | --pe-avatar-empty-bg + initial 'M' | false (Sprint Lead 명시 — 카메라 group 외 fallback OK) |
| feed_thumbnails | gradient-token | local sprint-aliases (--card-N) — 6 cells | false (Pass 6 #6 면제) |
| icons | illustration | lucide inline SVG | false |

## Gate Questions (Sprint Lead)

1. **Bio 한 줄 추가 OK?** — Figma 에 bio 영역이 있는지 확인 필요. 없으면 hero padding 으로 320px 보충 (코드 변경 작음).
2. **Follow toggle 시각 동작 ('팔로우' ↔ '팔로잉') 포함 OK?** — PRD 는 "팔로우 button (해제 직후라 팔로우 안 됨 상태)" 만 명시. 시각 toggle 데모 추가가 디자인 의도 위반인지?
3. **TabPrivate 항목 자체를 노출할지 / 숨길지** — disabled 처리(현재 결정) vs 아예 hide. 본인 프로필 (app-006) 과 동일 구조 유지가 좋다고 판단했으나 다른 user 프로필이라 명시적 hide 도 가능.

## Skip 가능 항목

- `inferred_layout` 4건 / `placeholders.needs_real_content: true` 0건 — preview 스킵 조건 미충족 (low fabrication 으로 인해 산출 필수)
- 본 intent.md 는 정보성 — Step C 는 즉시 진행 가능 (Sprint Lead 가 stop 보내지 않는 한)

---

**Status**: Step C 진행 (proceed assumed unless Sprint Lead 가 adjust/stop 보냄).
