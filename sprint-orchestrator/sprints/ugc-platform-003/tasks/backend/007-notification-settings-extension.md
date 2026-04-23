# be-007 · 알림 설정 확장 (4 토글 + 페르소나 lock)

- **Group**: 003
- **Owner**: be-engineer
- **Depends on**: none (be-004/005/006 와 병렬)

## Target

`backend/apps/meme-api/src/` 내:
- 기존 `persistence/notification-setting/notification-setting.schema.ts` — 필드 확장
- 기존 `domain/notification-setting/notification-setting-domain.service.ts` — 메서드 확장 + 페르소나 lock
- 신규 또는 확장 `controller/notification-setting/notification-setting.controller.ts` — `/v2/me/notification-settings` endpoints
- 신규 `common/dto/notification-setting.dto.ts`
- 관련 Nx integration test

## Context

AC 5.5: 4 토글 (푸시 알림 전체 / 좋아요 / 소식 / 팔로우). 디폴트 전부 ON. 크레딧 페이백은 별도 토글 없음 (항상 ON, AC 5.5). pushAll=false 시 하위 3 토글 비활성화 (응답 상 false 강제 표시). 페르소나 계정은 알림 수신 대상 아님 — 설정 변경 자체 차단.

기존 NotificationSetting schema 는 Phase 0 부터 존재: `memeNotification`, `memeGenCompletePush` 등. 기존 consumer 는 이 필드들을 참조 중 — 회귀 금지. 본 태스크는 새로운 4 필드를 **추가** 만 수행.

## Objective

NotificationSetting 도메인 확장 + 신규 endpoints. be-004 listener 들이 새 필드를 참조할 수 있도록 `shouldNotify(ownerId, type)` helper 노출.

## Specification

### Schema 확장

```
NotificationSetting:
  ...existing fields (memeNotification, memeGenCompletePush, ...) UNCHANGED
  pushAll: boolean (default true)
  like: boolean (default true)
  news: boolean (default true)
  follow: boolean (default true)
```

- 페르소나 계정 (UserProfile.type === INTERNAL) 초기 document 생성 시: 4 필드 전부 false.
- 일반 유저 초기 document 생성 시: 4 필드 전부 true.
- Default document 생성 경로: 기존 lazy-create 또는 회원가입 시점 어느 쪽이든 4 필드 추가 적용. Migration 스크립트 불필요 — upsert with `$setOnInsert` 로 신규 document 에만 default 적용, 기존 document 는 read 시 `??` 없이 필드 존재 여부로 처리 **불가** (fallback 금지). 대신 `get` 시점에 document 에 필드 없으면 upsert 로 default 값 세팅 후 반환 (write-through lazy default).

### Endpoints

**GET /v2/me/notification-settings**
- Caller 의 NotificationSetting document 조회. 없으면 write-through 로 default 생성.
- Mapper:
  - 페르소나: 실제 값이 false 여야 함 (초기화 규칙). 응답 그대로 false 반환.
  - 일반 유저: 실제 값 반환.
  - **pushAll=false 시 응답 상 like/news/follow 도 false 강제 표시** (저장값은 유지 — 나중에 pushAll=true 로 되돌릴 때 하위 토글 복원).
    - 구현: `response.pushAll === false ? {pushAll:false, like:false, news:false, follow:false} : {pushAll, like, news, follow}`.
    - 저장값 유지: persist 시점에는 개별 필드 그대로 save. **응답 mapper 만** 계산.
- Response: NotificationSettingsResponse (contract).

**PATCH /v2/me/notification-settings**
- 부분 수정: 바디에 있는 필드만 update.
- 페르소나 → 403 PERSONA_NOTIFICATION_LOCKED.
- pushAll=true/false 만 변경 시 하위 3 필드는 미변경 (저장값 유지).
- pushAll=false 상태에서 like=true 변경 시도 → save 되지만 응답은 여전히 like=false (pushAll 우선).
- minProperties=1 (빈 바디 400).

### shouldNotify(ownerId, type) helper

- be-004 listener 들이 호출.
- persona → false.
- pushAll === false → false.
- type 별: LIKE → like, FOLLOW → follow. PAYBACK 은 토글 없음 → true (persona 체크 외).
- 반환 boolean.
- 단일 정의 (cross-path cleanup integration-002): `rg 'shouldNotify\(' backend/apps/meme-api/src → 1 정의 + ≥ 2 callsite (be-004 listener 2+)` (completeness-009).

### Mapper fallback 금지

- Get endpoint 응답 시 필드가 undefined 인 경우 절대 `?? true` 금지 — write-through 로 document 에 실제 값 저장 후 반환. (completeness-008)

### Out of Scope

- 크레딧 페이백 토글 (PRD 명시 제외).
- 소식 알림 on/off 외 기타 세부 카테고리.
- 시간대별 DND / 방해 금지 (scope 외).

## Acceptance Criteria

- [ ] Schema 에 pushAll, like, news, follow 필드 추가. 기존 필드 변경 없음.
- [ ] 일반 유저 default: 4 필드 true. 페르소나 default: 4 필드 false.
- [ ] GET 응답 매핑: 일반 유저 pushAll=true 시 실제 값. pushAll=false 시 like/news/follow 강제 false (저장값은 유지).
- [ ] PATCH partial update 동작. pushAll 단독 변경 시 하위 미변경 검증.
- [ ] 페르소나 PATCH → 403 PERSONA_NOTIFICATION_LOCKED. GET 은 허용 (전부 false).
- [ ] `shouldNotify` helper 단일 정의 + be-004 listener 2개 이상 callsite (grep ≥ 3 hit: 정의 + Like/Follow listener + Payback scheduler 3 callsite).
- [ ] Mapper fallback 금지 grep: `rg '\?\?\s*true|\?\?\s*false' backend/apps/meme-api/src/domain/notification-setting backend/apps/meme-api/src/common/dto/notification-setting.dto.ts → 0 hit` (completeness-008).
- [ ] Write-through default: document 없는 유저 GET 호출 시 save 후 반환 (integration test — document count before/after 검증).
- [ ] Cross-component 전수 나열 (completeness-010): NotificationSetting 을 read 하는 모든 consumer — be-004 Like/Follow listener (각 1회), be-006 PushNotificationService (1회), be-007 GET endpoint, be-007 PATCH endpoint. 그 외 read 경로 금지.
- [ ] Regression: 기존 memeNotification / memeGenCompletePush 를 참조하는 기존 consumer 동작 회귀 없음 (기존 test green).
- [ ] Nx integration test 커버.
- [ ] lint / typecheck 신규 에러 0.

## Implementation Hints

- 기존 `notification-setting.schema.ts` 에 `@Prop({ default: true }) pushAll: boolean` 형태로 추가.
- Default document bootstrap: `domain/notification-setting-domain.service.ts` 의 get 메서드에서 `findOneAndUpdate({userId}, {$setOnInsert: defaults}, {upsert: true, new: true})` 패턴.
- Persona 판정: UserProfile 조회 후 `type === USER_PROFILE_TYPE.INTERNAL`.
- Controller: `@UseGuards(LibUserAuth)` + `@GetUser()`, PATCH body validation class (class-validator).

## Regression Guard

- 기존 memeNotification / memeGenCompletePush 등 필드 + 호출자 동작 불변.
- NotificationSetting document 가 없던 유저의 기존 동작 (lazy default) 시 side-effect 없음.
- Cross-component 영향 전수: persistence/notification-setting/, domain/notification-setting/, controller/notification-setting/, common/dto/notification-setting.dto.ts. 외 파일 수정 금지.
- be-004 listener 는 `shouldNotify` 호출만 추가 (별도 태스크이므로 직접 수정은 그쪽에서).
