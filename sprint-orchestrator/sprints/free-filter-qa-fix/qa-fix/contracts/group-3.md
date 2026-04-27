# Sprint Contract: Group 3 (free-filter-qa-fix)

> QA-Fix Stage 3 contract — Done Criteria = 각 ticket의 Verification Steps 통과 + Root Cause 확인.

## Scope

- **Sprint**: free-filter-qa-fix
- **Group**: group-3 (좋아요 회귀)
- **Tickets**:
  - `IS-1375` (P2): 필터 좋아요 버튼 탭 시 좋아요 상태 즉시 취소 + 좋아요 수 미반영
- **Build**: Apple 1.3.0 (6821), iPhone 17 Pro / Galaxy S24 Ultra
- **Repos in scope**:
  - `app` — `apps/MemeApp/src/{domain,data}/favorite/`, like 토글 hook + UI 컴포넌트
  - `backend` — like API 응답 (필요 시 확인만)
- **Prior reference**: IS-1345 (Verified, fixed in free-tab-diversification 작업) — 같은 영역 회귀 의심. fix diff 비교 우선.

## Done Criteria

### Ticket: IS-1375

- [ ] **DC-1375-A**: 필터 화면에서 좋아요 버튼 탭 → **좋아요 상태가 유지** (즉시 취소 안 됨)
- [ ] **DC-1375-B**: 좋아요 버튼 탭 → **좋아요 수가 정상 반영** (count +1)
- [ ] **DC-1375-C**: 다시 탭 → 좋아요 해제 + count -1 (정상 토글)
- [ ] **DC-1375-D**: **Root Cause 명시** — 즉시 취소가 발생하는 이유 (mutation onError rollback / cache race / optimistic update 충돌 등) 식별
- [ ] **DC-1375-E**: **IS-1345 회귀 여부 확인** — IS-1345 fix commit 과 본 fix 의 관계 (회귀였는지, 별개 원인이었는지) 코멘트에 명시
- [ ] **DC-1375-F**: 회귀 점검 — 다른 좋아요 진입점 (피드/swipe/내 좋아요 화면) 영향 없음

### Default Verification Gates

- [ ] Mapper fallback 금지 (KB completeness-008)
- [ ] Dead hook 금지 (KB completeness-009)
- [ ] Cross-component 전수 (KB completeness-010) — 모든 좋아요 진입점 enumerate
- [ ] FE typecheck clean

## Verification Method

| Criterion | 검증 방법 |
|---|---|
| DC-1375-A | 수동: 좋아요 탭 후 1초 이상 관찰 — 상태 안정 |
| DC-1375-B | 수동: count 표시 부분 +1 확인 |
| DC-1375-C | 수동: 다시 탭 → -1 |
| DC-1375-D | 코드 trace: `useToggleFavoriteUseCase` / mutation hooks / optimistic update / onError rollback |
| DC-1375-E | git: IS-1345 의 fix commit 찾아서 (free-tab-diversification 시기) 본 fix 와 비교 |
| DC-1375-F | grep: 좋아요 컴포넌트 callsite (FreeTab / SwipeFeed / Feed / MyLikes) 전수 확인 |

## Edge Cases

- **EC-1**: 비로그인 상태 → 로그인 유도 (auth guard)
- **EC-2**: 네트워크 오프라인 → 적절한 에러 처리 + state 복구
- **EC-3**: 빠른 더블탭 → race 없이 최종 상태 일관
- **EC-4**: 다른 디바이스에서 같은 필터 좋아요 → app 재진입 시 server state 와 sync

## Business Rules

- 좋아요 토글은 user-bound — 같은 user 가 같은 필터에 1회만 카운트
- count 표시는 server 가 SSOT — optimistic update 후에도 server 응답으로 reconcile

---

## Sign-off

Round 1 self-review:
- [x] IS-1345 비교 reference 명시
- [x] 모든 좋아요 진입점 enumerate 의무 (cross-component)
- [x] EC-3 race condition 명시 (좋아요 모듈 흔한 함정)

_Approved at: 2026-04-27T16:10:00+09:00 (self-review)_
