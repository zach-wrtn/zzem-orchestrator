# Sprint Contract: Group 5 (free-filter-qa-fix — post-launch)

> QA-Fix Stage 3 contract — Done Criteria = ticket Verification Steps + Root Cause.

## Scope

- **Sprint**: free-filter-qa-fix
- **Group**: group-5 (post-launch follow-up)
- **Tickets**: `IS-1423` (P1) — 무료 필터가 추천 탭에서 노출될 때 무료 혜택 미적용
- **Build target**: Dev 1.3.0 (6817+)
- **Repos in scope**: backend only (FE 변경 없음)

## Done Criteria

- [ ] **DC-1423-A**: 추천 탭 응답에서 무료 슬롯 필터의 `requiredCredit=0` + `isFreeFilter=true` 정상 노출 (오늘 무료 미사용 상태)
- [ ] **DC-1423-B**: 무료 1회 사용 후 추천 탭 응답의 같은 필터가 `requiredCredit > 0` + `hasGeneratedToday=true` (BR-1 보존)
- [ ] **DC-1423-C**: Root cause 명시 — `readGridFeedRecommendations` rosterContext 미로드 + `enrichRecommendedFilters` 하드코딩
- [ ] **DC-1423-D**: 회귀 점검 — 무료 탭 / 일반 탭 / FilterPreview 단건 조회 응답 변경 없음
- [ ] **DC-1423-E**: 1.2.0~1.2.x 구앱 응답 schema 변경 없음 (capable=false → rosterContext null → legacy)

## Verification Method

| Criterion | 검증 방법 |
|---|---|
| DC-1423-A | API 직접 호출 (`GET /filters` w/ grid feed cursor) 또는 추천 탭 진입 후 응답 inspect |
| DC-1423-B | quota 소진 후 같은 응답 inspect — requiredCredit/isFreeFilter 변화 |
| DC-1423-C | PR diff 의 fix 코멘트 (jira-comments/IS-1423.md) 에 명시 |
| DC-1423-D | 무료 탭 / 일반 탭 / 단건 API 응답 schema diff 없음 |
| DC-1423-E | app-version 1.2.x 헤더로 API 호출 → 새 필드 (themeTag/isFreeFilter) 영향 없음 (기존 클라이언트는 무시) |

## Edge Cases

- **EC-1**: 무료 슬롯이 0개 (어제 폴백 EXPIRED 만) → 추천 탭에서도 모든 필터 유료 (rosterContext.todayActiveSlots 비어있음)
- **EC-2**: guest user → `loadRosterContextIfCapable` 의 `computeFreeUsedToday` 가 false 반환 (isGuestUser 체크), rosterContext 로드는 정상이지만 freeUsedToday=false
- **EC-3**: cursor 기반 페이징 다음 페이지 → 같은 enrichment 적용
- **EC-4**: source=filter cursor (group A/B/C 모두) → readListV2 fallback path 도 appVersion 전달되어 정상 enrichment

## Business Rules

- BR-1: 1일 1회 무료 생성 — fix 후에도 quota 소진 후 추천 탭에서 유료 표시
- BR-13: 필터 목록 API 가 오늘 무료 사용 여부 포함 — 추천 탭 응답에도 `hasGeneratedToday` 정확

---

## Sign-off

Round 1 self-review (Sprint Lead):
- [x] BE 단일 모듈 fix, FE 무관
- [x] enrichFilters 와 동일 패턴 (검증된 분기 재사용)
- [x] capable check 로 backward compat 보장
- [x] EC-2 (guest) edge case 명시

_Approved at: 2026-04-27T22:30:00+09:00 (self-review)_

**PR**: https://github.wrtn.club/wrtn-tech/wrtn-backend/pull/866
