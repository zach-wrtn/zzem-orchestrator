# be-001 · Free Filter Slot 스키마 + 테마 태그 인프라

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: —

## Target

`wrtn-backend/apps/meme-api/src/` — persistence + domain layer.

## Context

현재는 Filter 컬렉션의 `tags: ["free"]` 토글로 1일 1필터를 표현한다. N개 슬롯 + 상태(예약/활성/만료)를 관리할 독립 스키마가 필요하다. 테마 비율(BR-5, 아기/반려동물/인물 3-3-4)을 위해 필터에 `themeTag` 태그도 필요하다. 기존 `filter_tags` 컬렉션 활용 가능 여부는 be-engineer 판단.

## Objective

날짜별 무료 슬롯 상태 머신(3.1 State Machine)을 저장하는 스키마를 도입하고, 이미지 단일 입력 필터(BR-4)에 테마 태그를 부여할 수 있는 인프라를 제공한다.

## Specification

### Data
- `FreeFilterSlot` 컬렉션 도입.
  - 필드(최소): `rosterDate(KST, YYYY-MM-DD)`, `filterId`, `orderIndex`, `themeTag`, `status(RESERVED|ACTIVE|EXPIRED)`, `activatedAt`, `expiredAt`, 타임스탬프.
  - 복합 유니크 인덱스: `(rosterDate, orderIndex)` 및 `(rosterDate, filterId)` — 중복 편성 방지(BR-9 멱등성 근거).
  - 조회 인덱스: `(status, rosterDate)`.
- Filter/FilterTag에 `themeTag` 표현. 허용 값 `baby | pet | studio`. 조합/영상 필터는 부여 금지(BR-4).

### Behavior
- Slot 상태 전이는 Domain Service에서만 수행(RESERVED → ACTIVE → EXPIRED, 역전 불가).
- 슬롯 CRUD/조회 Domain Service 제공: `findActiveByDate`, `findReservedByDate`, `activate(slotId)`, `expire(slotId)`, `createReserved(rosterDate, picks[])`.
- 7일 이내 편성된 필터 목록 조회 API(스케줄러 소비용): `recentlyRostered(withinDays)`.

### Migration
- 기존 Filter 컬렉션에서 `tags:["free"]` 상태의 단일 필터는 그대로 두되, **신규 슬롯 테이블이 SSOT**가 된다.
- 초기 마이그레이션 스크립트: 어드민/팩토리에서 이미지 단일 입력 필터 176개에 `themeTag` 부착(방법은 `Jayla/Bob` 확인 — ASK 항목).
- 마이그레이션 누락 상태에서도 스케줄러가 `themeTag` 없는 필터 제외하도록 방어.

## Acceptance Criteria

- [ ] `FreeFilterSlot` 스키마/리포지토리/도메인 서비스 존재. 복합 유니크 인덱스 적용 확인(`db.collection.indexes()` 테스트).
- [ ] 상태 역전 시도(ACTIVE→RESERVED 등) 시 예외 발생.
- [ ] 동일 `(rosterDate, filterId)` 2회 insert 시 DB 예외 발생.
- [ ] `themeTag` 허용 값 외 값 저장 시도 시 validator 차단.
- [ ] `recentlyRostered(7)` 쿼리가 오늘 기준 직전 7일 활성/만료 슬롯의 filterId 집합 반환.
- [ ] 조합/영상 필터에 `themeTag` 설정 시도 시 도메인 레이어에서 거절.

## Implementation Hints

- 기존 NestJS + Mongoose 구조 참조: `apps/meme-api/src/persistence/filter/*`.
- KST 처리 dayjs 유틸: `dayjs().tz("Asia/Seoul").startOf("day")`.
- 스케줄러 및 Query 서비스는 be-002, be-003에서 소비.
