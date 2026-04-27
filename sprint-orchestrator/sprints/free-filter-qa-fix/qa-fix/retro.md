# QA-Fix Retro — free-filter-qa-fix

**Generated at:** 2026-04-27T22:43:23+09:00
**Round entry path:** integration
**Triage approved at:** 2026-04-27T15:32:00+09:00

> **Status:** KB review COMPLETED (2026-04-27). G5 manual QA + Jira close 만 남음.

## Health Score

| Outcome | Count |
|---------|-------|
| PASS (closed in Jira — Ready for QA) | 5 (G1~G4: IS-1365, IS-1366, IS-1367, IS-1368, IS-1375) |
| PASS (pending — G5 manual QA + Jira post) | 1 (IS-1423) |
| FAILED (in unresolved.md) | 0 |
| DEFERRED (from triage) | 1 (IS-1325 — Opus 제품 out-of-scope) |
| NEEDS-INFO | 0 |
| DUPLICATE | 0 |

**Total in-scope:** 6 (5 from triage + 1 post-launch G5 follow-up)
**Pass rate:** 6/6 (= 100%, G5 confirm 시)
**Fix loop budget:** 0 (G1~G4 first-pass + G5 first-pass — fix loop 0회)

## Pattern Digest (all severities)

| Category | Count | Notes |
|----------|-------|-------|
| correctness | 2 | IS-1365 + IS-1367 — 단건/목록 활성 판정 비대칭 (한 root cause 2 ticket) |
| completeness | 2 | IS-1368 (mutation onSuccess-only), IS-1423 (cross-tab parity gap) |
| integration | 0 | |
| code_quality | 0 | |
| edge_case | 0 | |
| design_proto | 1 | IS-1366 — z-order stack 충돌 (시각 결함) |
| design_spec | 1 | IS-1375 — IS-1345 invalidate-only race window |

**Reinforcement alerts** (자동 감지 — same pattern 3+ violation):
- _없음_ (이번 라운드 패턴은 신규/2회 이하)

**Cross-pattern observations:**
- IS-1365 + IS-1367 동일 root cause → KB 후보 IS-1367 은 IS-1365 와 dedupe 또는 callsite enumeration 측면 별도 promotion
- IS-1423 가 completeness-010 의 cross-component 정신 확장 → Retro 결정으로 merge-into 또는 별개 pattern

## KB Candidates Review

**User decision (2026-04-27): all approved per Sprint Lead 추천.** KB push 성공 (HEAD 84237ce):

| Candidate File | Ticket | Pri | Decision | KB ID | Notes |
|----------------|--------|-----|----------|-------|-------|
| `kb-candidates/IS-1365.yaml` | IS-1365 | P1 | **approved** | `correctness-006` | 단건/목록 쿼리 비대칭 + callsite enumeration |
| `kb-candidates/IS-1367.yaml` | IS-1367 | P1 | **duplicate** (merge-into correctness-006) | — | callsite 측면이 correctness-006 description 에 흡수 |
| `kb-candidates/IS-1368.yaml` | IS-1368 | P1 | **approved** | `completeness-013` | Mutation onSuccess-only cache stale |
| `kb-candidates/IS-1423.yaml` | IS-1423 | P1 | **approved** (as new) | `completeness-014` | Cross-tab parity — completeness-010 와 다른 scope (enrichment 분산 helper) |

**KB merged**: 3 new patterns at `zach-wrtn/knowledge-base@84237ce`:
- `learning/patterns/correctness-006.yaml`
- `learning/patterns/completeness-013.yaml`
- `learning/patterns/completeness-014.yaml`

## Deferred Index

| Ticket | Pri | Summary | Defer Reason | Next Round Candidate |
|--------|-----|---------|--------------|----------------------|
| IS-1325 | P2 | [Opus] 시즌 종료 스토리 ... 무료 혜택 즉시 종료 | 다른 제품 (Opus) — JQL 오매칭 | no — Opus team 의 backlog |
| IS-1371 | P1 | [ZZEM] 크레딧 소진 후 밈 재생성 시 ... 생성 중 목록 누적 | 본 sprint JQL 미매칭. IS-1368 fix 와 동일 패턴 가능 — 별도 검증 필요 | yes — next round JQL 에 포함 권장 |

## Unresolved

_없음._ G1~G5 모두 first-pass 또는 manual QA 대기 — fix loop 진입 0회.

## Next Round Suggestion

다음 QA-Fix 라운드 JQL (deferred + 새 P0/P1):

```
project = IS AND status = Open AND (
  key in (IS-1371)
  OR (created > "2026-04-27T15:25:13+09:00" AND priority in ("Highest", "High"))
)
```

**검증 권장 follow-up**:
- IS-1371 가 IS-1368 fix 패턴 (mutation onSettled) 으로 해소되는지 확인 — 안 되면 별도 fix
- E2E 자동화 인프라 — Maestro 의 Fabric+RNGH+tap 한계 follow-up (free-tab REPORT minor item)
- **CD workflow fix** — `.github/workflows/` 의 helm chart "Commit files" step 이 commit message escape 안 함. PR #863 머지 시 CI 실패 (run 21653) 의 원인. infra 담당 area.

## Lessons (next-sprint actionable)

- **Cross-tab parity 검증**: 새 enrichment (rosterContext 같은 cross-cutting) 도입 시 도메인의 모든 list/single endpoint enumerate. Contract Scope 섹션에 명시 의무. (← KB 후보 IS-1423)
- **단건/목록 쿼리 활성 조건 정합성**: 같은 컬렉션의 활성 판정은 list/single 양쪽에서 같은 표현 사용. helper extract 권장. (← KB 후보 IS-1365)
- **Mutation onSettled 우선**: backend 비동기 후처리 (orchestrate, payment, generate) 가 있는 mutation 은 onSuccess 단독 사용 금지. (← KB 후보 IS-1368)
- **CD workflow 의 commit message escape**: PR title/body/squash message 의 백틱/$ 등을 inline string 으로 사용하는 workflow step 은 syntax error trigger. 인프라 영역 follow-up.
- **Maestro 인프라 fragility 인지**: G3 (좋아요), G4 (z-order) 같은 시각/터치 결함은 자동화 비현실적 — manual QA 가 1차 검증.

## Pointers

- Manual QA plan: `qa-fix/manual-qa-integrated.md`
- Group evaluations: `qa-fix/evaluations/group-{1,2,3,4}.md`
- G5 contract: `qa-fix/contracts/group-5.md`
- KB candidates: `qa-fix/kb-candidates/IS-{1365,1367,1368,1423}.yaml`
- PRs:
  - BE G1 #862 (kiwi merged)
  - App G2/G3/G4 #595 (zzem/sprint-002 merged)
  - BE G5 #866 (kiwi base, pending review)
- Jira: G1~G4 transitioned to "Ready for QA" (R_QA 요청). G5 (IS-1423) pending after manual QA.

---

_Pending — G5 manual QA + Stage 5 close 후 최종 확정. KB Candidate Review 가 사용자 승인 게이트._
