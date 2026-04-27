# Evaluation: Group 1 (free-filter-qa-fix)

- **Sprint Lead Verdict (post-fix, pre-QA)**: PROVISIONAL PASS — fix 적용 + 코드 trace 정합. **Manual QA 검증 대기**.
- **Independent Evaluator**: Sprint Lead self-review only (independent agent unavailable). Manual QA 가 외부 검증 역할.
- **Date**: 2026-04-27

## Tickets

| Ticket | Pri | Status (post-fix) |
|---|---|---|
| IS-1365 — 무료 필터 피드 프리뷰 → 에러 화면 | P1 | Awaiting manual QA |
| IS-1367 — 무료 필터 미사용 상태에서 생성 불가 | P1 | Awaiting manual QA |

## Fix Summary

**한 줄로:** `FilterRepository.findOneActive` 의 `activatedAt` query 가 비대칭이라 `activatedAt` 필드 누락된 무료 필터 단건 조회가 404 → 모든 callsite (프리뷰 / 생성 / 관리자) 에서 동일 증상.

**Diff** (backend, branch `sprint/free-filter-qa-fix`, commit `779cadee`):

```diff
-      activatedAt: { $lte: new Date() },
       isActive: { $ne: false },
+      $or: [{ activatedAt: { $lte: new Date() } }, { activatedAt: { $exists: false } }],
```

**File:** `apps/meme-api/src/persistence/filter/filter.repository.ts:91-104`

**Why this fixes both tickets:**

| Ticket | App path | BE path | 막혔던 곳 |
|---|---|---|---|
| IS-1365 | FilterPreviewScreen → useGetFilterUseCase (`useSuspenseQuery`) | controller → FilterQueryAppService.readOne → filterDomainService.readOne | findOneActive → 404 → Suspense throw → 에러 화면 |
| IS-1367 | SwipeFeedFreeFooter handleCta → ConfirmSheet → generateMeme | controller → FilterCreationAppService.createMeme | filterDomainService.readOne → 동일 findOneActive → 404 → 생성 차단 |

`findActiveByIds` (목록) 는 이미 `$or: [{$lte}, {$exists: false}]` 였기에 무료탭 그리드/스와이프는 정상 노출. 단건만 비대칭으로 깨져서 reporter 가 "유료에선 정상, 무료에서만 발생" 으로 관측.

## Done Criteria — Pre-Manual-QA Status

| ID | Criterion | Code review | Manual QA |
|---|---|---|---|
| DC-1365-A | 프리뷰 버튼 → 프리뷰 화면 정상 (에러 0건) | ✅ findOneActive 가 무료 필터 통과 | ⏳ |
| DC-1365-B | Root Cause 명시 | ✅ findOneActive 비대칭 | ⏳ |
| DC-1365-C | 유료 필터 프리뷰 회귀 점검 | ✅ 유료 필터는 `activatedAt` 보유 → 변경 없음 | ⏳ |
| DC-1365-D | 사용 후 무료 필터 프리뷰 정상 | ✅ 같은 fix path | ⏳ |
| DC-1367-A | 미사용 → 정상 생성 | ✅ createMeme readOne 통과 | ⏳ |
| DC-1367-B | Root Cause 명시 | ✅ 동일 findOneActive | ⏳ |
| DC-1367-C | BR-1 (1일 1회) 회귀 점검 | ✅ quota 검사 (`isFreeEligibleFilter`) 와 무관, 변경 없음 | ⏳ |
| DC-1367-D | BR-3 (DB unique) 회귀 점검 | ✅ UserFreeQuota unique index 변경 없음 | ⏳ |
| DC-G1-X1 | pricing/display source 분리 (KB correctness-003) | ✅ 변경 없음 | ⏳ |
| DC-G1-X2 | BE/FE 응답 필드명 (KB integration-001) | ✅ 응답 schema 변경 없음 | ⏳ |
| DC-G1-X3 | route params 호출부 (KB completeness-003) | ✅ 변경 없음 | ⏳ |
| DC-G1-X4 | parent context threading (KB completeness-007) | ✅ 변경 없음 | ⏳ |
| Mapper fallback 금지 (completeness-008) | grep gate | ✅ 신규 fallback 없음 | — |
| Dead hook (completeness-009) | grep gate | ✅ 신규 hook/factory 없음 | — |
| Cross-component 전수 (completeness-010) | path enumeration | ✅ 5개 callsite 전수 trace | — |

## ⚠️ Manual QA Plan

> **선결 조건 (사용자 또는 BE 엔지니어):**
>
> 1. `sprint/free-filter-qa-fix` BE 브랜치를 PR 또는 직접 deploy 로 **dev 환경 (Dev 1.3.0)** 에 반영. fix 가 배포되지 않으면 검증 불가.
> 2. 새 빌드 번호를 받아 (현재 6817 다음) iPhone 16 / Galaxy S25 에 dev 빌드 설치.
> 3. 테스트 계정: 오늘 무료 quota 미소진 상태 (UserFreeQuota 에 today entry 없음). 필요 시 DB 초기화.

### IS-1365 — 프리뷰 정상화 검증

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 1 | 앱 실행 → 무료 탭 진입 | 무료 필터 그리드 정상 노출 (회귀 없음) | ☐ |
| 2 | 무료 필터 1번째 카드 탭 → SwipeFeed 무료 모드 진입 | SwipeFeed 정상 진입 | ☐ |
| 3 | SwipeFeedFreeActions 의 thumbnail 버튼 (프리뷰 버튼) 탭 | **FilterPreview 화면이 정상 노출** (에러 화면 0건) | ☐ |
| 4 | 뒤로가기 → 다른 무료 슬롯에서 프리뷰 버튼 탭 (3~5개 슬롯) | 모두 정상 노출 | ☐ |
| 5 | 무료 1회 사용 (생성 완료) 후 다른 무료 필터의 프리뷰 진입 | 정상 노출 | ☐ |
| 6 | 유료 필터 (홈 그리드 또는 일반 SwipeFeed) 의 프리뷰 진입 | 정상 노출 (회귀 없음) | ☐ |

### IS-1367 — 미사용 상태 생성 가능 검증

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 1 | 무료 quota 미소진 상태 확인 (앱 재시작 후 무료 탭 → CTA 가 "무료" 표시) | 무료 CTA | ☐ |
| 2 | SwipeFeedFreeFooter CTA 버튼 탭 | FreeConfirmBottomSheet 정상 노출 | ☐ |
| 3 | ConfirmSheet 확인 → ImageGuidanceSheet (있다면) → 이미지 픽 → 크롭 → 생성 | **생성 정상 시작** (밈 컬렉션 화면 진입) | ☐ |
| 4 | 생성 완료 대기 → 결과 확인 | 무료 결과물 정상 | ☐ |
| 5 | 같은 날(KST) 두 번째 무료 생성 시도 | **차단** (CTA 가 유료로 표시 + 크레딧 시트) — BR-1 보존 | ☐ |

### 회귀 / 부수 callsite 검증

| # | Path | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|---|
| R1 | preview-app.service `parentFilter readOne` | preview content 진입 (parent 필터가 무료/유료 모두) | 정상 노출 | ☐ |
| R2 | admin/filter readOne | (선택) 관리자 페이지에서 필터 조회 | 정상 | ☐ |
| R3 | createMeme 유료 path | 유료 필터로 생성 | 정상 | ☐ |
| R4 | 비활성/삭제된 필터 단건 조회 | 비공개 필터 ID 로 직접 조회 시도 | 404 유지 (의도된 차단 — `isActive=false` / `deletedAt` 가드) | ☐ |
| R5 | `activatedAt` 미래 시각 필터 | 활성 예정 필터 ID 로 조회 | 404 유지 (`$lte: new Date()` 가드) | ☐ |

### Failure 처리

만약 **IS-1365 step 3 또는 IS-1367 step 3 이 FAIL** 이면:
1. 에러 메시지 / 네트워크 응답 / 콘솔 로그를 캡처하여 본 파일의 "Manual QA Result" 섹션에 기록
2. Sprint Lead 가 fix loop 1회차 진입 — 추가 root cause 추적
3. fix loop 2회차 후에도 FAIL 이면 `unresolved.md` 로 분리 후 사용자 보고

만약 **R1~R5 회귀 발생** 이면:
1. 즉시 BE fix 롤백 (`git revert 779cadee`) → unresolved
2. 더 정교한 fix 재설계 (예: 무료 필터에만 한정된 분기)

## Manual QA Result

> 사용자/QA 가 이 섹션 채워주시면 Sprint Lead 가 다음 단계 진행:

- **Tested at**: <YYYY-MM-DD HH:MM KST>
- **Build**: <앱 빌드 + BE 환경 (dev/staging/...)>
- **Tester**: <name>
- **IS-1365 verdict**: ☐ PASS  ☐ FAIL  ☐ Partial
- **IS-1367 verdict**: ☐ PASS  ☐ FAIL  ☐ Partial
- **Regression (R1~R5)**: ☐ All PASS  ☐ Some FAIL (specify)
- **Notes**:
  ```
  <attach screenshots, error messages, or video links here>
  ```

## Decision Gate (manual QA 완료 후)

- [ ] **둘 다 PASS + 회귀 0건** → Stage 5 진행 (Jira 코멘트 + transition + KB 후보)
- [ ] **하나 PASS / 하나 FAIL** → PASS 티켓만 Stage 5, FAIL 은 fix loop 또는 unresolved
- [ ] **둘 다 FAIL** → fix loop. 본 fix 가 잘못된 가정이었을 가능성 — Sprint Lead 재분석.

---

_Pending manual QA — Sprint Lead 는 결과 입력 시까지 G1 Stage 5 진행 차단._
