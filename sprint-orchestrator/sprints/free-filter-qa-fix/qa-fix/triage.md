# QA-Fix Triage — free-filter-qa-fix

**Snapshot:** `qa-fix/jira-snapshot.yaml` (snapshot_at: 2026-04-27T15:25:13+09:00)
**Total fetched:** 6 tickets
**Sprint Lead recommendation:** in-scope 5, deferred 1, needs-info 0, duplicate 0

> **User action required:** Review classifications below. Mark `[x] Approved` at the bottom to unlock Stage 2.

> **Note on description location:** 표준 Jira `description` 필드는 비어있지만, 실제 repro 정보는 IS 프로젝트 커스텀 필드 **`customfield_10632` ("IS Description")** 에 들어 있음 — 환경/디바이스/빌드/사전조건/경로/실제/기대/추가 모두 포함. 모든 in-scope 티켓이 정식 repro를 보유하므로 needs-info 분류 없음. (이 컨벤션은 이후 KB pattern 후보로 검토.)

---

## In-Scope (5)

| Ticket | Pri | Type | 품질 특성 | 빌드 | 경로 → 실제 / 기대 |
|--------|-----|------|-----------|------|---------------------|
| [IS-1365](https://wrtn.atlassian.net/browse/IS-1365) | P1 | Bug | 기능성 | Dev 1.3.0 (6817) | 무료탭 → 무료필터 피드 → 프리뷰 버튼 → **에러 화면 노출** (정상은 프리뷰 화면). 유료 필터에선 정상. |
| [IS-1366](https://wrtn.atlassian.net/browse/IS-1366) | P2 | UX | 사용성 | Dev 1.3.0 (6817) | 추천 탭 진입 → 스크롤 → **웹툰 툴팁과 필터칩 영역 겹침**. 사전조건: 웹툰 툴팁 노출 상태. |
| [IS-1367](https://wrtn.atlassian.net/browse/IS-1367) | P1 | Bug | 기능성 | Dev 1.3.0 (6817) | 무료 필터 **미사용** 상태 → 무료 필터 생성 동작 → **생성 안 됨**. (free-tab BR-1 위반) |
| [IS-1368](https://wrtn.atlassian.net/browse/IS-1368) | P1 | Bug | 기능성 | Dev 1.3.0 (6817) | 웹툰 1화 생성 실패 → **내 웹툰 목록 생성됨** + 이후 회차 실패 시 **미생성 회차 필터칩 노출**. (크레딧 환불은 정상) |
| [IS-1375](https://wrtn.atlassian.net/browse/IS-1375) | P2 | Bug | 기능성 | Apple 1.3.0 (6821) | 필터 화면 → 좋아요 탭 → **즉시 취소 + 카운트 미반영**. (IS-1345 Verified 와 동일 모듈 — 회귀 의심) |

## Deferred (1)

| Ticket | Pri | Type | Summary | Defer Reason | Next Round Candidate |
|--------|-----|------|---------|--------------|----------------------|
| [IS-1325](https://wrtn.atlassian.net/browse/IS-1325) | P2 | Bug | [Opus] 시즌 종료 스토리 구매 후 상세 진입 시 무료 혜택 즉시 종료 | **Out of scope** — Opus product (시즌 스토리 기능). JQL false-positive on "무료 혜택". | no (different product team) |

## Needs-Info (0)

_None._ See note at top — repro 정보는 전부 `customfield_10632` ("IS Description") 에 정식 포맷으로 보유.

## Duplicate (0)

_None._

---

## Approval

- [x] **Approved by user — proceed to Stage 2 (Grouping)**
- Approved at: `2026-04-27T15:32:00+09:00`
- Notes: 변경 없이 그대로 진행 (5 in-scope, 1 deferred).

### Post-approval actions
- needs-info Jira write: **SKIP** (0건)
- duplicate Jira write: **SKIP** (0건)
- Stage 2 (Grouping) 진입.
