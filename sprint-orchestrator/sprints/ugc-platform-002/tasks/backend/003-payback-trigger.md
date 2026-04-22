# be-003 · 크레딧 페이백 트리거 + 크레딧 히스토리 페이백 행

- **Group**: 001
- **Owner**: be-engineer
- **Depends on**: be-002 (sourceContentId tracking)

## Target

`backend/apps/meme-api/src/` 내:
- `application/credit/credit-app.service.ts` + listener
- `persistence/credit/credit.schema.ts` (CREDIT_TRANSACTION_TYPE enum 확장 필요 시)
- `common/constant/credit.constant.ts`
- 기존 ContentGeneration 완료 이벤트 파이프라인
- 관련 e2e

## Context

AC 4.1: 내 공개 콘텐츠가 타 유저에 의해 세로 스와이프 CTA 경유로 재생성될 때, 재생성자가 소비한 크레딧의 1% 를 원본 소유자 계정에 적립. AC 4.2: 크레딧 히스토리에 "크레딧 페이백" 타이틀 + 콘텐츠 썸네일로 노출.

Credit 도메인 인프라는 이미 존재 (Credit, CreditHistory, CreditDetailHistory, CreditWallet). `CREDIT_SOURCE.PROMOTION` enum 값도 존재. 본 태스크는 기존 인프라를 엮는다.

## Objective

재생성 완료 이벤트에서 페이백 조건을 만족하는 경우 원본 소유자에게 promotion 크레딧 1% 적립 + CreditHistory 엔트리 생성.

## Specification

### Trigger
- Content generation 완료 이벤트 (be-002 에서 regenerateCount 증가 위치와 동일 지점) 에서:
  - `sourceContentId` 존재 필수.
  - 원본 콘텐츠 소유자 userId resolve.
  - 원본 소유자 `UserProfile.type === INTERNAL` → skip (페르소나는 페이백 대상 아님, AC 4.1 마지막 줄).
  - 재생성자 본인 소유 콘텐츠 재생성 (self-regeneration) → skip (페이백 대상 없음 — 자기 자신에게 지급 방지).
    - 다만 Content regenerateCount 자체는 증가함 (be-002).
  - 재생성자가 custom-prompt 결과물을 원본으로 "편집하기" 진입하는 경우 — 원본이 custom-prompt 면 페이백 대상 아님 (AC 1.4: custom prompt 는 공개 불가 → isPublished=true 여야 하는 페이백 전제 미충족). be-002 의 validation 이 선제적으로 걸러내므로 여기서는 double-check 불필요.

### Amount
- Config env: `PAYBACK_RATE` (default `0.01`).
- 재생성자가 소비한 크레딧 (`creditUsed` — ContentGeneration 완료 이벤트 payload 의 크레딧 차감 값) × `PAYBACK_RATE`.
- `Math.ceil` 로 올림. 최소 1 크레딧 보장 (1 미만이어도 ceil → 1). AC 4.3.

### Credit Grant
- `CREDIT_SOURCE.PROMOTION` 사용 (기존 enum 값 재사용).
- Transaction type: 기존 enum 에 `PAYBACK` 이 없으면 추가 (`CREDIT_TRANSACTION_TYPE.PAYBACK`). 있으면 재사용.
- CreditWallet 증분 + CreditHistory 엔트리 생성은 기존 `CreditDomainService.grant()` 류 메서드 경유.

### Credit History Entry
- `title`: `"크레딧 페이백"` (고정 문자열 — 국제화 없음, Phase 2 MVP).
- `thumbnailUrl`: 재생성된 신규 콘텐츠 (not 원본!) 의 thumbnail. 근거: "{다른 사람이 이 콘텐츠로 재생성했어요" 의 "이 콘텐츠" 는 재생성 결과물. PRD AC 4.2 문구 애매 → 기본 해석은 "원본" 이지만 FE 측 UX 합의 필요. **※ Prototype 단계에서 확정.**
  - 현 시점 SSOT: 원본 콘텐츠의 thumbnail 로 기록 (PRD 직역 "원본 콘텐츠" 해석). 프로토타입 리뷰 amendment 로 변경 가능.
- `amount`: 페이백 크레딧 (양수, 올림).
- `description` / `source`: 필요 시 "{재생성자 닉네임}님이 재생성" 추가. Optional.
- `transactionType`: `PAYBACK`.

### Idempotency
- 동일 신규 콘텐츠 이벤트에 대해 중복 트리거되면 중복 적립 위험. 신규 콘텐츠 id + sourceContentId 조합을 키로 멱등 보장 (혹은 이벤트 ID 활용).
- 최소한 CreditDetailHistory 조회로 중복 방지 (`contentId + sourceContentId` 기반 lookup).

### Out of Scope
- 어드민 회수 API (기존 flow 재사용).
- 공개→비공개 전환 시 회수 (비즈니스 룰: 회수 안 함).
- 공개 콘텐츠 삭제 시 회수 (비즈니스 룰: 회수 안 함).

## Acceptance Criteria

- [ ] 재생성 이벤트 (sourceContentId 있음) 시 정확한 페이백 크레딧 적립 (ceil(used × rate)).
- [ ] 페르소나 원본 → skip. CreditHistory 엔트리 미생성. UserProfile.type 기준 판정.
- [ ] Self-regeneration (소유자가 자기 콘텐츠 재생성) → skip.
- [ ] Custom-prompt 결과물을 source 로 한 재생성 → 페이백 없음 (be-002 validation 이 사전 차단하지만 double-check 테스트 권장).
- [ ] Credit history 엔트리: title, thumbnailUrl, amount, transactionType=PAYBACK 검증.
- [ ] 중복 트리거 방지 (idempotency key).
- [ ] `PAYBACK_RATE` env override 동작 (예: 0.05 로 설정 시 5% 적립).
- [ ] 공개→비공개 전환 후에도 기존 페이백 크레딧 잔존 (CreditWallet 감소 없음) — 본 태스크는 "회수 없음" 을 negative test 로 증명.
- [ ] e2e 테스트: 재생성 플로우 전체 (seed: persona + regular user + content + credit balance). nx listTests 포함 확인.
- [ ] lint / typecheck 신규 에러 0.

## Implementation Hints

- ContentGeneration 완료 이벤트 payload 에 `creditUsed` 가 없으면, 기존 차감 로직 (`CreditProductPlanDomainService`) 을 참조해 consumed 값을 resolve.
- 기존 `CreditDomainService.grant(userId, amount, { source, transactionType, title, thumbnailUrl, description })` 류 signature 우선 찾기. 없으면 기존 grant path 재사용 (예: `POST /v2/credit/reward/app-install` 내부 로직).
- `PAYBACK_RATE` 는 nest `ConfigModule` 또는 기존 env 접근 패턴 (`process.env.PAYBACK_RATE`) 중 codebase convention 따르기.
- Cursor pagination 관련 새 쿼리 추가 시 `$lte` 의무 (rubric C10).
- 페르소나 판정은 `UserProfile.type === 'INTERNAL'` (Phase 1 be-002 선례).
