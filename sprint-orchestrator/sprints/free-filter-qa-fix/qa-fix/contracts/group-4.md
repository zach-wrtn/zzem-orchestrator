# Sprint Contract: Group 4 (free-filter-qa-fix)

> QA-Fix Stage 3 contract — Done Criteria = 각 ticket의 Verification Steps 통과 + Root Cause 확인.

## Scope

- **Sprint**: free-filter-qa-fix
- **Group**: group-4 (추천탭 z-order)
- **Tickets**:
  - `IS-1366` (P2): 추천 탭 스크롤 시 웹툰 툴팁 ↔ 필터칩 영역 겹침
- **Build**: Dev 1.3.0 (6817), iPhone 16 / Galaxy S25
- **Repos in scope**:
  - `app` — `apps/MemeApp/src/presentation/{recommend-tab|home}/components/{tooltip,filter-chip,**}`
  - `backend` — 무관 (순수 layout)

## Done Criteria

### Ticket: IS-1366

- [ ] **DC-1366-A**: 추천 탭 진입 후 스크롤 시 **웹툰 툴팁 문구가 필터칩 영역과 겹치지 않음**
- [ ] **DC-1366-B**: **Root Cause 명시** — 겹침의 원인 (z-index 누락 / sticky positioning 충돌 / parent stack context 등) 식별
- [ ] **DC-1366-C**: 회귀 점검 — 다른 화면의 ToolTip / FilterChip 컴포넌트 사용처에 영향 없음
- [ ] **DC-1366-D**: 사전조건 (웹툰 툴팁 노출 상태) 미만족 시 (툴팁 dismiss 후) 정상 동작 유지

### Default Verification Gates

- [ ] FE typecheck clean

## Verification Method

| Criterion | 검증 방법 |
|---|---|
| DC-1366-A | 수동: 웹툰 툴팁 노출 상태 → 추천 탭 → 스크롤 → 겹침 없음 시각 확인 |
| DC-1366-B | 코드 trace: ToolTip + FilterChip 컨테이너의 zIndex / position / stack context |
| DC-1366-C | grep: ToolTip / FilterChip 컴포넌트 다른 사용처 enumerate, 영향 없음 확인 |
| DC-1366-D | 수동: 툴팁 dismiss 후 추천탭 스크롤 정상 |

## Edge Cases

- **EC-1**: 다른 size 디바이스 (iPad / 작은 폰) — layout 깨지지 않음
- **EC-2**: 가로 모드 — 일반적으로 미지원이면 skip
- **EC-3**: 시스템 폰트 크기 변경 (접근성) — overflow 발생 안 함

---

## Sign-off

Round 1 self-review:
- [x] BE 무관 명시
- [x] 다른 ToolTip 사용처 회귀 검증 의무
- [x] 사전조건 (툴팁 dismiss 후) verification 분리

_Approved at: 2026-04-27T16:10:00+09:00 (self-review)_
