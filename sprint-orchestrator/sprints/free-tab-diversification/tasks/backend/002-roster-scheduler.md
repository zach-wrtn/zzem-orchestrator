# be-002 · 날짜별 무료 슬롯 스케줄러

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: be-001

## Target

`wrtn-backend/apps/meme-api/src/domain/gen-meme/gen-meme.scheduler.ts` (또는 `free-filter.scheduler.ts` 신설).

## Context

현재 스케줄러는 00:01 KST에 이미지 필터 중 1개를 랜덤 선정해 `tags:["free"]` 부여한다. 이를 날짜별 N슬롯 편성으로 확장한다. 운영팀이 수동 편성 가능 여부는 ASK 항목(**Jayla** 확인) — 본 태스크 v1 범위 밖.

## Objective

매일 KST 자정 무렵 3단계(어제 만료 → 오늘 활성화 → 내일 예약)를 멱등·격리 실행한다(BR-8/9). 테마 3-3-4 비율과 7일 중복 배제(BR-5), 폴백 체인(BR-7)을 충족한다. 실패 시 Slack/Datadog 알림.

## Specification

### Cron
- 실행 시각: KST 00:00~00:01 구간. `@Cron('1 0 * * *', { timeZone: 'Asia/Seoul' })`.
- 분산 락(기존 `@Lock` 패턴 재사용, TTL 5분).

### 단계(각 독립 try/catch로 격리)
1. **어제 슬롯 만료**: `ACTIVE` + `rosterDate==어제` → `EXPIRED`. 없으면 skip.
2. **오늘 슬롯 활성화**: `RESERVED` + `rosterDate==오늘` → `ACTIVE`. 없으면 **폴백 로직 실행**.
3. **내일 슬롯 예약**: 테마 풀(아기3·반려3·인물4 = 10, 설정 가능) × 이미지 단일 입력 필터만 × 직전 7일 편성 제외. 각 테마 풀에서 랜덤 선정. `orderIndex` 0..N-1을 랜덤 배정 후 고정(BR-6). `createReserved()`.

### 폴백 (BR-7)
- 오늘 예약 없음 → 어제 EXPIRED 슬롯을 유지하여 응답에 사용(상태 변경 없음, 읽기만).
- 어제도 없음 → 이미지 필터 중 편성 횟수 최소 순으로 테마 비율 유지하며 즉시 `createReserved` + `activate`.
- 무슨 상황에서도 활성 슬롯 0개 불허 → 최후에는 테마 비율 무시하고 이미지 필터 1개라도 활성화.

### 설정
- 환경 변수 또는 설정 문서: `FREE_ROSTER_SIZE=10`, `FREE_THEME_RATIO=baby:3,pet:3,studio:4`, `FREE_ROSTER_EXCLUDE_DAYS=7`.

### 관측성
- 각 단계 성공/실패 + 활성 슬롯 수를 Datadog 메트릭으로.
- 예외 시 Slack 알림(기존 alert 채널 재사용).

## Acceptance Criteria

- [ ] 동일 크론을 2회 연속 실행해도 슬롯 중복 생성 없음(멱등성).
- [ ] 한 단계 실패가 다른 단계 실행을 중단시키지 않음(에러 격리 테스트).
- [ ] 오늘 0개 예약 + 어제 EXPIRED 존재 상태에서, 응답 시 어제 슬롯이 사용됨(상태 변경 없음).
- [ ] 오늘/어제 모두 없음 상태에서 폴백이 활성 슬롯 10개를 복구(테마 비율 근사 유지).
- [ ] 내일 예약 테마 비율이 3-3-4(또는 구성값)와 일치.
- [ ] 선정된 10필터 중 직전 7일 이내 편성된 필터 0개.
- [ ] `FREE_ROSTER_SIZE` 변경 시 편성 수량이 반영됨(통합 테스트).
- [ ] 예외 발생 시 Slack 알림 발송 호출 검증.

## Implementation Hints

- 기존 스케줄러의 `getTodayActivatedImageFilters()` 패턴 참조.
- 테마 비율 구현은 도메인 서비스로 분리(테스트 용이).
