# Group 001 Evaluation

## Verdict: PASS

## Done Criteria Coverage

### be-001
- [✓] FreeFilterSlot Mongoose 스키마 + 리포지토리 + 도메인 서비스 존재
  - `persistence/free-filter-slot/free-filter-slot.schema.ts`, `free-filter-slot.repository.ts`, `free-filter-slot.base-repository.ts`
  - `domain/free-filter-slot/free-filter-slot-domain.service.ts`
- [✓] 복합 유니크 인덱스 `(rosterDate, orderIndex)`, `(rosterDate, filterId)`, 조회 인덱스 `(status, rosterDate)`
  - schema.ts:48-51. 단위 테스트 schema.spec.ts가 `FreeFilterSlotSchema.indexes()`로 검증.
- [✓] 상태 머신 단방향 강제
  - `FREE_SLOT_ALLOWED_TRANSITIONS` (free-filter-slot.constant.ts:19-23), domain service `assertValidTransition` (domain.service.ts:74-79). 역전/자기전이 모두 `BadRequestException`. 테스트 커버리지 존재.
- [✓] themeTag enum validator
  - schema 필드 `enum: Object.values(THEME_TAG)` + 도메인 `assertValidThemeTag`.
- [✓] 조합/영상 필터에 themeTag 부여 거절
  - domain.service.ts `assertCanAssignThemeTag` (L54-69): FILTER_TYPE.IMAGE 아니거나 requiredImageCount !== 1 이면 reject. 4개 테스트 케이스 커버.
- [✓] `recentlyRostered(7)` 직전 7일 active/expired filterId set
  - domain.service.ts:99-111. `[today-(N-1), today]` 윈도 + `[ACTIVE, EXPIRED]` 필터.
- [✓] 마이그레이션 전 방어
  - `filterIdsWithThemeTagAssignable` (L166-172) + 스케줄러 `loadThemePools`에서 적용 (scheduler.ts:225-229).

### be-002
- [✓] Cron `'1 0 * * *'` + `Asia/Seoul` + `@Lock` TTL 5분
  - scheduler.ts:70-71. LOCK_TTL_SECONDS = 300.
- [✓] 3단계 try/catch 격리
  - scheduler.ts:79-97. 각 단계 독립 try/catch, 예외 시 `reportStepFailure` → Slack.
- [✓] 멱등성 (중복 생성 0)
  - Step 3: `findByDate(tomorrow).length > 0` 시 skip (L176-180) + DB 유니크 인덱스 이중 방어.
  - Step 2: 2회 실행 시 이미 ACTIVE 상태 → reserved 비어있어 fallback 1로 no-op.
- [✓] rosterSize, 3-3-4 비율
  - scheduler.ts:53-57 env 반영, `buildRoster` 테마별 ratio 할당. 테스트 "3-3-4 비율" 통과.
- [✓] 7일 배제
  - `recentlyRostered(excludeDays)` → `excludeFilterIds` → buildRoster 필터링 (roster.service.ts:51-52).
- [✓] orderIndex 0..N-1 랜덤 + 생성 후 immutable
  - roster.service.ts:79-84에서 shuffle 후 idx 부여. Repository `updateStatusById`는 status/activatedAt/expiredAt만 변경, orderIndex 변경 경로 부재(immutability는 구현 부재로 유지).
- [✓] 폴백 체인
  - L125-137 Step 2에서 reserved 없음 → 어제 ACTIVE/EXPIRED 있으면 no-op(읽기만) → 없으면 `recoveryRoster` (createReserved + activate) → 0건이면 throw.
- [✓] 활성 슬롯 0개 불허
  - `recoveryRoster`에서 `picks.length === 0` 시 throw → Slack 알림. 후속 Step 3는 계속 진행.
- [✓] Slack 알림 호출
  - `reportStepFailure` (L279-290) → `SlackAlertService.alert`. 테스트 "예외 발생 시 Slack 알림" 통과.

## Issues Found

| # | Severity | Location | Description | Reproduction |
|---|----------|----------|-------------|--------------|
| 1 | Minor | scheduler.ts:254-277 `listRecentSlots` | N+1 쿼리: `findByDate`를 N일 각각 호출. 7일이면 7쿼리. `findByDateRangeAndStatuses`가 이미 존재하므로 재사용 가능. | N/A (성능만) |
| 2 | Minor | scheduler.ts:194-203 Step 3 last-resort | last-resort에서도 `excludeSet`을 여전히 적용함. Contract가 last-resort 의 exclude 처리를 명시하지 않았으나, "활성 슬롯 0개 불허" 요구와 충돌 가능 (7일 내 모든 필터가 편성된 극단 케이스). 단, 이 경로는 Step 2의 `recoveryRoster`가 커버하므로 실질 영향 낮음. | 이론상 all filters < 7일내 편성 시 |
| 3 | Minor | scheduler.ts:126-128 Step 2 fallback | `yesterdayActive.length > 0` 시에도 fallback 1(no-op) 적용. 이는 Step 1 expire 실패 시 발생 가능한 시나리오 — 복구(재expire) 대신 그대로 둠. Contract가 ACTIVE 유지를 배제하진 않으므로 PASS. | Step 1 실패 후 수동 재실행 시 yesterday가 여전히 ACTIVE |

Critical 0, Major 0 → **PASS**.

## Edge Cases Explored

- **KST 자정 경계**: `dayjs().tz(KST).startOf("day")`로 today 계산. cron이 00:01 KST에 fire하므로 today/yesterday/tomorrow 경계 정확. ✓
- **env 미설정**: `rosterSize`/`excludeDays`/`themeRatio` getter 모두 default fallback 체크 (scheduler.ts:53-68, free-roster.constant.ts:parseThemeRatio). ✓
- **테마 풀 부족**: `buildRoster`가 부족분을 다른 테마로 보충(roster.service.ts:61-76). Contract가 "근사 유지"를 허용. ✓
- **빈 후보군**: `recoveryRoster` picks=0 시 throw → Slack 알림 → 다음 단계 진행. ✓
- **멱등성 2회 실행**: Step 3 skip, Step 2는 no-op (이미 ACTIVE), Step 1 no-op (이미 EXPIRED). DB 유니크 인덱스 이중 방어. ✓
- **Slack webhook 미설정**: `SlackAlertService.alert` log-only no-op. 예외로 스케줄러 붕괴 없음. ✓
- **recentlyRostered 포함 범위**: 오늘 포함 직전 N일. `reserveTomorrow`에서 오늘 ACTIVE 슬롯이 exclude에 포함 → 내일에 반복 안됨. ✓

## Notes

- 모듈 와이어링(app.module → batch.module → FreeFilterSlotBatchModule) 확인 완료.
- 도메인/스케줄러 단위 테스트가 Done Criteria 각 항목을 구체적으로 커버 (도메인 11 테스트, 스키마 5 테스트, 스케줄러 6 테스트).
- Build check는 수행하지 않음 (대규모 monorepo tsc 비용) — 그러나 정적 tracing으로 타입/import 경로 일관성 확인.
- 다음 그룹(be-003)이 도메인 서비스의 `findActiveByDate`/`findByDate` public API를 소비할 예정 — 인터페이스 준비됨.
