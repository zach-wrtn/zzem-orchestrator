# Integrated Manual QA Plan — free-filter-qa-fix

> 5 티켓 통합 검증. 모든 fix 가 dev 환경에 배포된 후 1회 QA 로 5 티켓 동시 verdict.

**Sprint:** free-filter-qa-fix
**Date prepared:** 2026-04-27
**Tester:** _<자기 이름 기재>_
**Tested at:** _<YYYY-MM-DD HH:MM KST>_

---

## E2E 결정

본 sprint 는 **Maestro e2e flow 추가/실행을 skip** 하고 manual QA 만으로 진행한다.

**근거:**
- Fabric + RNGH + Maestro 의 알려진 결함으로 버튼 `tapOn` 의 `onPress` 가 발화 안 됨 → 5 티켓 중 4 (IS-1367/1368/1375/1366) 는 본질적 자동화 불가
- IS-1365 만 deeplink 로 부분 자동화 가능했으나 (시드 fetcher + flow 추가) 인프라 의존성 (auth 토큰 + dev API + simulator) 대비 1회용 가치 낮다고 판단
- free-tab-diversification REPORT.md 에서 이미 minor deferred 로 "E2E env prerequisites fragile" 기록

**대안:** Stage 5 회귀 evidence 항목에 "N/A — Maestro 인프라 한계 + 본 fix 의 즉시 검증은 manual QA 로 충분" 명시. Retro 에 "IS-1365 자동 회귀 가드 추가" 를 follow-up 후보로 기록.

---

## 0. 배포 준비 (선결 조건)

### Backend
- **Repo:** `wrtn-backend`
- **Branch:** `sprint/free-filter-qa-fix` (tracking `origin/kiwi`)
- **Base:** `kiwi` (변경됨 — 기존 `develop`)
- **HEAD:** `5a5ba0c2` — `fix(filter): align findOneActive activatedAt query with findActiveByIds`
- **Commits ahead of `origin/kiwi`** (2개):
  1. `aa042b18` Revert "fix(filter): findOneActive에서 activatedAt 미설정 필터 조회 허용 (IS-1367)" (`e3efb018` revert)
  2. `5a5ba0c2` G1 fix (위)
- **Diff vs `origin/kiwi`:** 1 file
  - `apps/meme-api/src/persistence/filter/filter.repository.ts` (+5/-1) — 우리 fix
- **Action:**
  ```bash
  cd ~/dev/work/wrtn-backend && git checkout sprint/free-filter-qa-fix
  gh pr create --base kiwi --title "fix(filter): align findOneActive activatedAt query (G1)" --body "..."
  ```

### App
- **Repo:** `app-core-packages`
- **Branch:** `sprint/free-filter-qa-fix`
- **Commit:** `b9f810f72`
- **Diff:** 4 files (46 lines)
- **Action:** PR → `zzem/sprint-002` merge → 새 dev 빌드 cut (1.3.0 6822 또는 그 이후)
- **빌드 설치:** iPhone 16 / Galaxy S25 (G1/G2/G4) + iPhone 17 Pro / Galaxy S24 Ultra (G3 reporter 환경)

### 계정
- 무료 quota 미소진 계정 (UserFreeQuota DB 에 today entry 없음). 필요 시 admin 으로 reset.
- 좋아요 toggle 검증을 위해 favorite 데이터 일부 사전 시드 (옵션)

---

## 1. Group 1 — IS-1365 + IS-1367 (BE fix `findOneActive`)

### IS-1365 — 무료 필터 프리뷰 정상화

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 1.1 | 앱 실행 → 무료 탭 진입 | 무료 필터 그리드 정상 노출 | ☐ |
| 1.2 | 무료 필터 1번째 카드 탭 → SwipeFeed 무료 모드 진입 | SwipeFeed 정상 진입 | ☐ |
| 1.3 | SwipeFeedFreeActions thumbnail 버튼 (프리뷰) 탭 | **FilterPreview 화면 정상 노출** (에러 화면 0건) | ☐ |
| 1.4 | 다른 무료 슬롯 3~5개에서 프리뷰 탭 | 모두 정상 | ☐ |
| 1.5 | 무료 1회 사용 후 다른 무료 필터 프리뷰 진입 | 정상 | ☐ |
| 1.6 | 유료 필터 (홈 그리드 또는 일반 SwipeFeed) 프리뷰 진입 | 정상 (회귀 없음) | ☐ |

### IS-1367 — 무료 필터 미사용 상태 생성 가능

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 1.7 | 무료 quota 미소진 상태 확인 — CTA 가 "무료" 표시 | 무료 CTA | ☐ |
| 1.8 | SwipeFeedFreeFooter CTA 버튼 탭 | FreeConfirmBottomSheet 정상 노출 | ☐ |
| 1.9 | ConfirmSheet 확인 → ImageGuidanceSheet (있다면) → 이미지 픽 → 크롭 → 생성 | **생성 정상 시작** (밈 컬렉션 진입) | ☐ |
| 1.10 | 생성 완료 → 결과 확인 | 무료 결과물 정상 | ☐ |
| 1.11 | 같은 날 두 번째 무료 생성 시도 | **차단** (CTA 가 유료로 표시 + 크레딧 시트) — BR-1 보존 | ☐ |

### G1 회귀 점검

| # | Path | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|---|
| 1.R1 | preview-app.service `parentFilter readOne` | preview content 진입 | 정상 | ☐ |
| 1.R2 | admin/filter readOne (선택) | 관리자 페이지 필터 조회 | 정상 | ☐ |
| 1.R3 | 유료 createMeme | 유료 필터로 생성 | 정상 | ☐ |
| 1.R4 | 비활성/삭제된 필터 단건 조회 | 비공개 필터 ID 직접 조회 | 404 유지 (의도된 차단) | ☐ |
| 1.R5 | `activatedAt` 미래 시각 필터 | 활성 예정 필터 조회 | 404 유지 (`$lte` 가드) | ☐ |

---

## 2. Group 2 — IS-1368 (FE fix webtoon mutation onSettled + chipIndices)

### 정상 path 회귀 우선

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 2.1 | 웹툰 1화 정상 생성 | "내 웹툰" 목록에 entry 추가 | ☐ |
| 2.2 | 2화 정상 생성 (자동 이어가기) | 회차 chip 에 1, 2 표시 | ☐ |

### 실패 path 검증

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 2.3 | 웹툰 1화 생성 시도 → 강제 실패 (네트워크 차단 또는 비윤리 이미지 등) | "내 웹툰" 목록에 **entry 없음** | ☐ |
| 2.4 | 정상 1화 생성 후 → 2화 생성 시도 → 실패 | 회차 chip 에 **2화 표시 안 됨** (1화만 표시) | ☐ |
| 2.5 | 2.4 실패 후 같은 회차 재시도 | 정상 진입 가능 (state 재진입) | ☐ |
| 2.6 | 2.3 후 앱 재실행 | 실패 entry 가 persist 되지 않음 | ☐ |
| 2.7 | 크레딧 환불 영수증 (CreditHistory) | 환불 처리 정상 (BE 변경 없음 확인) | ☐ |

---

## 3. Group 3 — IS-1375 (FE fix favorite cache setQueriesData)

> **테스트 디바이스 권장**: iPhone 17 Pro 또는 Galaxy S24 Ultra (reporter 환경). 다른 디바이스에서도 검증 권장.

### 무료 필터 좋아요

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 3.1 | 무료 SwipeFeed 진입 → 좋아요 버튼 탭 | 좋아요 활성 상태 유지 (즉시 취소 X), count +1 | ☐ |
| 3.2 | 다시 탭 | 좋아요 해제 + count -1 | ☐ |
| 3.3 | 1초 이상 관찰 | 상태 안정 (refetch 후에도 일관) | ☐ |
| 3.4 | 다른 무료 필터 swipe 후 다시 돌아옴 | 좋아요 상태 보존 | ☐ |
| 3.5 | 앱 재실행 | server 와 sync 된 상태 유지 | ☐ |

### 유료 필터 좋아요 회귀

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 3.6 | 일반 SwipeFeed 좋아요 탭 | 정상 (회귀 없음) | ☐ |

### 다른 좋아요 진입점

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 3.7 | 더블탭 좋아요 (DoubleTapLikeOverlay) | 정상 | ☐ |
| 3.8 | 내 좋아요 목록 화면 진입 | 좋아요한 필터 노출 정상 | ☐ |

---

## 4. Group 4 — IS-1366 (FE fix sticky overlay zIndex)

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 4.1 | 홈 추천 탭 진입 (웹툰 툴팁이 노출되는 상태) | 툴팁 정상 표시 | ☐ |
| 4.2 | 추천 탭 하단으로 스크롤 → 필터칩 sticky 영역 진입 | **툴팁 텍스트와 필터칩 영역 겹치지 않음** (sticky 가 위에) | ☐ |
| 4.3 | 다시 위로 스크롤 → 툴팁 영역 복귀 | 정상 (sticky 해제 후 헤더 정상) | ☐ |
| 4.4 | 툴팁 dismiss 후 동일 시나리오 | 정상 | ☐ |

### G4 회귀

| # | Step | 기대 결과 | PASS / FAIL |
|---|---|---|---|
| 4.R1 | 다른 화면의 ToolTip 사용처 | 영향 없음 | ☐ |
| 4.R2 | FilterChip 다른 사용처 (필터 detail 등) | 영향 없음 | ☐ |

---

## 5. Failure 처리

| 결과 패턴 | 다음 단계 |
|---|---|
| **모두 PASS** | Sprint Lead 가 Stage 5 진행 — 5 티켓 모두 Jira 코멘트 + transition `Ready for QA` + KB 후보 (P1 3건). |
| **일부 FAIL** | PASS 티켓만 Stage 5. FAIL 티켓은 fix loop 1회차 진입 — 영상 첨부와 함께 Sprint Lead 에 통보. |
| **G1 PASS but G2 FAIL** 등 그룹별 mix | 각 그룹 독립 — PASS 그룹은 close, FAIL 그룹만 retry. |
| **회귀 발견** (R 항목) | 즉시 BE/App 의 해당 commit revert → unresolved 분류 → 재설계 |

### Fix loop 진입 시 보고 양식

```
티켓: IS-XXXX
Step 번호: X.X
실제 동작: <한 문장>
스크린샷/영상: <첨부 또는 링크>
콘솔/네트워크 로그: <가능 시>
```

---

## 6. Decision Gate

QA 완료 후 본 파일 하단 "Manual QA Result" 채워서 알려주시면 Sprint Lead 진행:

### Manual QA Result

- **Tested at**: `<YYYY-MM-DD HH:MM KST>`
- **App build**: `<버전 + 빌드번호>`
- **BE env**: `<dev / staging / ...>`
- **Tester**: `<이름>`

| Group | Verdict | Notes |
|---|---|---|
| G1 (IS-1365) | ☐ PASS  ☐ FAIL  ☐ Partial | |
| G1 (IS-1367) | ☐ PASS  ☐ FAIL  ☐ Partial | |
| G2 (IS-1368) | ☐ PASS  ☐ FAIL  ☐ Partial | |
| G3 (IS-1375) | ☐ PASS  ☐ FAIL  ☐ Partial | |
| G4 (IS-1366) | ☐ PASS  ☐ FAIL  ☐ Partial | |

**Regression check (R items)**: ☐ All PASS  ☐ Some FAIL (specify)

**Notes / attachments**:
```
<screenshots, error messages, video links>
```

---

## Appendix: Fix commit 요약

| Group | Repo | Commit | Files | Lines |
|---|---|---|---|---|
| G1 (IS-1365 + IS-1367) | `wrtn-backend` | `5a5ba0c2` (was `779cadee` on develop base; rebased onto kiwi with revert of `e3efb018` only — `4b823198` left intact) | 1 | +5/-1 |
| G2 (IS-1368) | `app-core-packages` | `b9f810f72` (혼합) | 2 | +22 |
| G3 (IS-1375) | `app-core-packages` | `b9f810f72` (혼합) | 1 | +22 |
| G4 (IS-1366) | `app-core-packages` | `b9f810f72` (혼합) | 1 | +5/-1 |

> App 의 G2/G3/G4 는 단일 commit `b9f810f72` 안에 통합. 필요 시 그룹별 cherry-pick 은 file 경로로 분리 가능.
