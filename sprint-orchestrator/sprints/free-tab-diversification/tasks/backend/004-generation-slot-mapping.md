# be-004 · 생성 시 무료 슬롯 자동 매핑 + 1일 1회 DB 고유 제약

- **Group**: 002
- **Owner**: be-engineer
- **Depends on**: be-001

## Target

`wrtn-backend/apps/meme-api/src/domain/gen-meme/*` (기존 `GenMemeDomainService.deductCredit` 등).

## Context

앱은 슬롯 식별자를 전달하지 않는다(BR-12). 서버가 `(userId, filterId, 오늘 KST)`로 자동 조회해 무료/유료를 결정한다. 레이스 컨디션으로 인한 중복 무료 생성은 DB 고유 제약으로 원천 차단한다(BR-3, ALWAYS).

## Objective

무료 생성 경로에서 슬롯 자동 매핑, DB 레벨 1일 1회 고유 제약, 생성 실패 기회 복구(BR-2), KST 자정 경계 재검증(AC 2.2.10)을 구현한다.

## Specification

### 슬롯 매핑
- `POST /filters/:filterId/gen` 수신 시:
  1. KST 오늘 기준 `ACTIVE` 슬롯 조회. filterId가 슬롯 집합에 포함되고 `hasFreeUsedToday(userId) == false` → **무료(0원)**.
  2. 그 외 → 유료(기존 로직).
- 앱이 슬롯 식별자를 바디/쿼리로 전송하는 경로 허용 금지(NEVER DO) — 검증 로직에서 무시.

### DB 유니크 제약
- `UserFreeQuota` (또는 Content 컬렉션 파생 인덱스) 신설:
  - 필드: `userId`, `quotaDate(KST, YYYY-MM-DD)`, `contentId`, 상태.
  - 유니크: `(userId, quotaDate)` — 상태가 ACTIVE(진행중/완료)일 때만. 실패로 전이되면 레코드 제거 또는 soft-delete하여 재시도 허용.
- 무료 생성 진입 시 레코드 선생성 → 실패(오류 응답) 시 롤백/삭제(BR-2).
- 2번째 무료 시도 시 DB 예외 감지 → 자동 유료 폴백(**유료 가격 응답** + `FREE_ALREADY_USED` 에러 코드로 프론트 분기 가능).

### 생성 시점 재검증
- 요청 처리 중 KST 날짜 경계 넘는 경우(AC 2.2.10): 생성 시작 시각의 KST 날짜로 재조회.

### 에러 처리 (AC 2.2.11, BR-2)
- 외부 생성 파이프라인 실패 → 에러 응답 + `UserFreeQuota` 레코드 제거. 앱은 재시도 가능.

## Acceptance Criteria

- [ ] 오늘 활성 슬롯 필터로 생성 요청 → `priceApplied == 0`, `usedFreeQuota == true`, 크레딧 차감 없음(BR-15).
- [ ] 무료 사용 직후 동일/다른 무료 필터로 2번째 생성 요청 → DB 유니크 예외 감지 → `FREE_ALREADY_USED` + `paidPrice`.
- [ ] 무료 생성 요청 처리 중 생성 파이프라인 실패 → 응답 에러 + `UserFreeQuota` 레코드 제거 → 동일 유저 재요청 시 다시 무료 적용.
- [ ] KST 23:59에 시작 → 00:01에 처리 완료된 경우, 생성 시점 KST 날짜로 검증 수행.
- [ ] 다른 기기에서 동일 유저의 동시 무료 시도 → 1건만 성공, 나머지 유료 폴백(AC 2.6.5).
- [ ] 미로그인 상태 요청 → 무료 적용 불가(유료 가격 반환 또는 기존 로그인 요구 응답 체인).
- [ ] 크레딧 차감 로그/외부 분석 기록은 본 경로에서 0원 처리 시 0 기록(BR-15 위배 없음).

## Implementation Hints

- MongoDB 유니크 인덱스는 partial filter로 ACTIVE 상태만 유일성 강제 가능.
- 기존 `hasGeneratedToday` / `deductCredit` 함수에 슬롯 매핑 로직 통합.
