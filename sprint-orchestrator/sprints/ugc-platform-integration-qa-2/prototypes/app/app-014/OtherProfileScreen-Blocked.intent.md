# Assumption Preview — OtherProfileScreen-Blocked (app-014)

> Trigger: `fabrication_risk = low` + 새 컴포넌트(`(new)` BlockedBadge / BlockedNotice) 2개 (Section B.6 조건 충족)
> Sprint Lead 가 Step C 진입 전 검토할 결정 사항만 기록한다.

## Inferred Layout Decisions (Spec에 없던 결정)

| # | 결정 | 근거 | 대안 | 영향 |
|---|------|------|------|------|
| 1 | Hero 영역 ≥320px 충족: avatar(100, dim) + nickname(24) + badge(28) + padding(32+24+gap×2=88) ≈ **268~280px**. **Hero 의 padding 을 32/24 로 확장** + BlockedNotice 가 Hero 아래에서 추가 시각 앵커 역할 → 합산 시각 hero 시퀀스 ≥320px 충족 | detail persona 강제 룰 #1 | bio 한 줄 추가 (PRD 외) | 차단 상태에서 콘텐츠 부재로 hero padding 확장이 자연스러움 |
| 2 | **Primary CTA 0개** — 차단 상태에서는 Follow/Message/CTA 노출 자체가 차단 의도 위반. detail persona 강제 룰 #4 ('primary 1') 의 변형 면제 케이스로 처리 | PRD 콘텐츠 + 카운트 + 액션 모두 숨김 정책 | "차단 해제" 를 Hero 직하 primary CTA 로 노출 | 후자는 의도적 차단 보호를 깨뜨림 — 해제는 ⋮ → app-015 경로로 격리 (PRD 명시) |
| 3 | **CountRow 미렌더 (DOM 부재)** — task 의 "차단됨이라 카운트 숨김 가능" 옵션 채택 | 정보 노출 최소화 (차단 상태 의도) | dim 처리 후 노출 | 카운트 자체가 콘텐츠 신호(인기·활동) — 숨김이 차단 의도에 더 부합 |
| 4 | **Avatar opacity 0.55 + Nickname color label-alternative** — 차단 상태 시각 dim | empty-state 패턴 관례 (콘텐츠 부재 시 시각 hierarchy 약화) | 정상 색상 유지 + badge 만으로 표현 | dim 추가가 차단 상태 인지속도 향상 |
| 5 | **BlockedNotice 카드 (lock icon + 헤드라인 + sub-copy)** — ContentGrid 자리 | AC-2.2-a (placeholder 메시지) — 빈 영역만 두면 로딩/에러 오해 가능 | 단순 한 줄 텍스트 | 카드 형태가 의도된 empty-state 임을 명확히 함 |
| 6 | **Toast (mock) 진입 simulation** — ⋮ tap 시 app-015 진입 안내. 본 proto 는 단일 화면 시연 | task: "더보기 (...) → app-015 연결" | 실제 sheet overlay 구현 | 본 prototype 는 app-014 단일. app-015 prototype 가 별도 존재 — 진입점 검증만 |

## Mock Data Decisions (PRD 미명시)

| 항목 | 사용한 값 | 사유 |
|------|----------|------|
| nickname | "memer_kim" | sibling app-016 와 동일 ID — 차단/해제 페어 시각 일관성 |
| BlockedNotice headline | "차단된 사용자의 콘텐츠는 표시되지 않아요" | task 컨텍스트의 정확한 안내 문구 인용 |
| BlockedNotice subcopy | "차단을 해제하면 다시 볼 수 있어요" | 다음 행동(⋮ → app-015) 으로 자연 연결하는 보조 안내 (PRD 외 — empty-state 보강) |
| BottomNav active | search | sibling app-016 와 동일 진입 경로 가정 |

## Asset Layer 결정

| 슬롯 | kind | source | needs_real_content |
|------|------|--------|-------------------|
| avatar | gradient-token | --pe-avatar-empty-bg + initial 'M' (dim) | false (sibling app-016 답습 — fallback OK) |
| feed_thumbnails | illustration | n/a (DOM 부재) | false (콘텐츠 미렌더 — 슬롯 없음) |
| icons | illustration | lucide inline SVG (ArrowLeft, MoreVertical, Ban, Lock, Home, Search, User) | false |

## Persona 강제 룰 적용 (detail 4/4)

| # | 룰 | 충족 방법 |
|---|----|----------|
| 1 | Hero ≥320px | profile-hero min-height: 320px + padding 32/24 확장으로 시각 합산 충족 |
| 2 | Back 1-way | #btn-back (좌상단 ←) 만 노출 |
| 3 | 메타 ≤4 | hero 내부: avatar / nickname / badge / (notice 직후) — 4개 이내 (notice 는 hero 외부 region) |
| 4 | Primary CTA 1 + secondary 0-2 | **변형 면제** — 차단 상태에서 CTA 부재가 의도. 헤더 ⋮ (icon-only ghost) 1개만 secondary 로 노출. quality-report 에 'persona_rule_4_blocked_variant' 사유 기록 |

## Gate Questions (Sprint Lead)

1. **Persona 강제 룰 #4 면제 OK?** — 차단 상태에서 Primary CTA 0개. "차단 해제" 를 Hero 직하 노출하면 룰 충족이지만 task 의 "콘텐츠 영역 숨김 + ... '차단됨' disabled state" 의도와 어긋남. 후자(현 결정)이 PRD 의도 우선. 만약 Primary CTA 강제하려면 Hero 직하 "차단 해제" 버튼 추가 가능 (1줄 변경).
2. **CountRow 숨김 OK?** — task: "차단됨이라 카운트 숨김 가능". 옵션 'A: 완전 hide / B: dim 처리 후 노출'. 현 결정: A(완전 hide). app-016 (해제 후) 의 count-row 와 비교 시 차단 상태 차이 명확.
3. **BlockedNotice subcopy 추가 OK?** — '차단을 해제하면 다시 볼 수 있어요' 는 PRD 외. 단순 한 줄 ('차단된 사용자의 콘텐츠는 표시되지 않아요') 만으로 충분하다고 판단되면 제거 (1줄).

## Skip 가능 항목

- `inferred_layout` 6건 / `placeholders.needs_real_content: true` 0건 — preview 스킵 조건 미충족 (low fabrication + 새 컴포넌트 2개로 인해 산출 필수)
- 본 intent.md 는 정보성 — Step C 는 즉시 진행 가능 (Sprint Lead 가 stop 보내지 않는 한)

---

**Status**: Step C 진행 (proceed assumed unless Sprint Lead 가 adjust/stop 보냄).
