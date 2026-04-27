# Sprint Contract: Group 2 (free-filter-qa-fix)

> QA-Fix Stage 3 contract — Done Criteria = 각 ticket의 Verification Steps 통과 + Root Cause 확인.

## Scope

- **Sprint**: free-filter-qa-fix
- **Group**: group-2 (웹툰 생성 실패 state)
- **Tickets**:
  - `IS-1368` (P1): 웹툰 생성 실패 시 내 웹툰 목록 + 미생성 회차 필터칩 노출
- **Build**: Dev 1.3.0 (6817), iPhone 16 / Galaxy S25
- **Repos in scope**:
  - `app` — `apps/MemeApp/src/presentation/{my-webtoon,episode-filter-chip,**}`, `apps/MemeApp/src/{domain,data}/meme/` (생성 실패 후 cache invalidation 정합성)
  - `backend` — 변경 미예상 (reporter "크레딧은 정상 환불됨" → BE 결제/롤백 정상)

## Done Criteria

### Ticket: IS-1368

- [ ] **DC-1368-A**: 웹툰 1화 생성 시도 → **실패** 시 "내 웹툰" 목록에 임시 entry 가 **남지 않음** (성공한 경우만 등록)
- [ ] **DC-1368-B**: 이후 회차 생성 시도 → **실패** 시 "미생성 회차" 필터칩이 노출되지 않음 (실패 회차는 chip 에서 제외)
- [ ] **DC-1368-C**: **Root Cause 명시** — 실패 이벤트 처리에서 (a) 목록 mutation 어디서 발생하는지 (b) 회차 chip mapper 가 실패 entry 를 어떤 조건으로 포함시키는지 코드 trace 로 식별 후 jira 코멘트 기재
- [ ] **DC-1368-D**: **회귀 점검** — 정상 생성 path (성공) 의 목록/필터칩 노출 동작 보존
- [ ] **DC-1368-E**: 크레딧 환불 동작 (BE) 변경 없음 — fix 가 BE 결제/롤백을 건드리지 않음

### Default Verification Gates (template default)

- [ ] **Mapper fallback 금지** (KB completeness-008) — `rg '?? 0|?? false|\|\| ""' app/apps/MemeApp/src` 변경 영역 0 hit (예외 명시 시만)
- [ ] **Dead hook 금지** (KB completeness-009)
- [ ] **Cross-component 전수** (KB completeness-010) — 웹툰 생성 실패 처리가 영향 받는 모든 컴포넌트 (목록 / 회차 chip / 진행상태) 전수 확인
- [ ] **FE typecheck clean**: 신규 0 hit

## Verification Method

| Criterion | 검증 방법 |
|---|---|
| DC-1368-A | 수동: 웹툰 1화 생성 → 실패 (네트워크/API 에러 강제 또는 imageguidance 위반 등) → "내 웹툰" 목록에 entry 없음 확인 |
| DC-1368-B | 수동: 1화 정상 생성 → 2화 생성 시도 실패 → 회차 chip 에 2화 표시 안 됨 |
| DC-1368-C | 코드 trace: `useGenerateMemeUseCase.onError` / generation status reducer / cache invalidation. PR diff 에 명시 |
| DC-1368-D | 수동: 생성 성공 케이스에서 목록/필터칩 정상 추가 |
| DC-1368-E | grep: BE 변경 없음 확인 (`git diff backend/`) |

## Edge Cases

- **EC-1**: 실패 후 즉시 같은 회차 재생성 시도 → 정상 (state 재진입 가능)
- **EC-2**: 실패 후 다른 필터로 생성 시도 → 정상
- **EC-3**: 앱 재실행 → 실패 entry 가 persist 되지 않음
- **EC-4**: 동시 다수 생성 시 일부만 실패 → 성공한 것만 노출

## Business Rules

- 생성 결과 = 성공 entry 만 사용자 collection 에 추가
- 크레딧 환불은 BE 가 트랜잭션 단위로 보장 — FE 는 환불 결과를 신뢰

## Cross-Task Integration Points

- IS-1371 (Open, P1, "크레딧 소진 후 밈 재생성 시 ... 생성 중 목록 누적 문제") — 본 JQL 미매칭이지만 **유사 root cause 가능성 매우 높음**. 본 fix 가 IS-1371 도 해소할 가능성 → 별도 검증 권장 (deferred 라 본 sprint 비대상).

---

## Sign-off

Round 1 self-review (Sprint Lead):
- [x] Done criteria 모두 testable
- [x] BE 변경 미예상 명시 (reporter 단서 기반)
- [x] KB pattern default gates 포함
- [x] Cross-ticket 가능성 (IS-1371) 명시

_Approved at: 2026-04-27T16:10:00+09:00 (self-review)_
