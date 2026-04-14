# Sprint Contract: Group 001 (free-tab-diversification)

## Scope
- Tasks: be-001 (FreeFilterSlot 스키마 + themeTag 인프라), be-002 (날짜별 슬롯 스케줄러)
- Endpoints: 없음 (다음 그룹에서 사용)

## Done Criteria

### be-001
- [ ] `FreeFilterSlot` Mongoose 스키마 + 리포지토리 + 도메인 서비스 존재.
- [ ] 복합 유니크 인덱스 `(rosterDate, orderIndex)`, `(rosterDate, filterId)` 존재(`db.collection.indexes()` 검증 가능).
- [ ] 상태 머신: `RESERVED → ACTIVE → EXPIRED` 단방향 강제. 역전 시도 시 도메인 예외.
- [ ] `themeTag` enum `baby | pet | studio` validator로 강제. 그 외 값 거절.
- [ ] 조합/영상 필터에 `themeTag` 부여 시도 시 도메인 레이어가 거절.
- [ ] `recentlyRostered(7)` 쿼리가 직전 7일 활성/만료 슬롯의 filterId set 반환.
- [ ] 마이그레이션 전 상태에서도 스케줄러가 `themeTag` 없는 필터를 자동 제외.

### be-002
- [ ] Cron `'1 0 * * *'` + `Asia/Seoul` 등록. `@Lock` TTL 5분.
- [ ] 3단계(어제 만료 → 오늘 활성 → 내일 예약) 각 try/catch 격리.
- [ ] 동일 크론 2회 실행 시 슬롯 중복 생성 0건(멱등성).
- [ ] 내일 예약 슬롯 수 == `FREE_ROSTER_SIZE`(default 10), 테마 비율 == 설정값(default 3-3-4).
- [ ] 선정 필터 중 직전 7일 편성 필터 0개.
- [ ] `orderIndex` 0..N-1 랜덤 배정, 같은 슬롯 내 변경 불가(생성 후 immutable).
- [ ] 폴백 체인: 오늘 예약 없음 → 어제 EXPIRED 유지(상태 변경 없음). 어제도 없음 → 편성 횟수 최소 순으로 즉시 createReserved + activate. 최후엔 비율 무시.
- [ ] 활성 슬롯 0개 상태 절대 불허(폴백 후 최소 1개 보장).
- [ ] 단계 예외 발생 시 Slack 알림 호출 검증(스파이/모킹).

## Verification Method
- **Schema**: 통합 테스트로 인덱스 존재 확인(`Model.collection.indexes()`). 중복 insert 시 MongoServerError 검증.
- **상태 머신**: 도메인 서비스 단위 테스트로 역전 케이스 expect throws.
- **themeTag**: validator 단위 테스트.
- **Scheduler 멱등성**: 같은 시점 2회 호출 → 슬롯 count 동일 검증.
- **에러 격리**: 단계별 mock failure 주입 후 다음 단계 호출 여부 검증.
- **테마 비율**: 통합 테스트에서 RESERVED slots 그룹화 후 themeTag별 count 일치.
- **7일 배제**: 시드 + 호출 후 결과 set 교집합 0 검증.
- **폴백**: 시나리오별 setup → 호출 → ACTIVE slots 검증.

## Edge Cases
- KST 자정 정확히 호출 시 어제/오늘 경계 정확성.
- 환경 변수 미설정 시 default 값 적용.
- 일부 테마 풀에 후보 부족 시(예: pet 필터 < 3개) 폴백 동작.

## Sign-off
- Evaluator review 생략(첫 그룹, 자체 검증 후 진행).
