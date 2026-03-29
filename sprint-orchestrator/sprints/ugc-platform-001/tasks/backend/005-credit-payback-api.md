# Task: 005-credit-payback-api

## Target
wrtn-backend/apps/meme-api

## Context
- PRD US4: 크레딧 페이백 (AC 4.1~4.4)
- 기존 Credit 도메인: issueCredits, deductCredits, CreditWallet 등 완비
- 기존 CREDIT_SOURCE: free, referral, paid, promotion, admin
- 페이백 = 기존 credit issue 로직에 promotion 소스로 적립
- API Contract: GET /payback/config

## Objective
콘텐츠 재생성 시 원작자에게 크레딧 페이백을 적립하는 로직을 구현한다. 마진 체크, 페이백 비율 Config, 히스토리 기록을 포함한다.

## Specification

### Endpoints (api-contract.yaml 참조)
- `GET /payback/config` — 페이백 설정 조회 (LibUserGuard)
- 페이백 트리거: 별도 endpoint 없음. 기존 meme generation flow 내에서 재생성 감지 시 내부 호출

### Payback Logic (기존 generation flow에 통합)
1. 유저가 타인의 공개 콘텐츠를 재생성 (동일 필터/프리셋 사용)
2. 재생성 비용 확인
3. 마진 체크: 마진 = 수익 - 원가 - 페이백. 마진 부족 시 시스템 차단 없음 (모니터링만)
4. 페이백 금액 = ceil(재생성 비용 * paybackRate)
5. 원작자 계정에 promotion 크레딧으로 적립
6. CreditHistory에 "크레딧 페이백" 타이틀 + 콘텐츠 썸네일로 기록

### Config
- paybackRate: 0.01 (1%), Config/환경변수로 변경 가능
- minPaybackRate: 0.001 (0.1%), 마진 압박 시 최저 하한
- 크레딧 타입: promotion (프로모션 크레딧)

### Business Rules
- 소수점 처리: 올림 (ceil)
- 마진에서 차감하지 않고 마진에 포함하여 계산
- 공개→비공개 전환 시 기지급 페이백 회수 안 함
- 비공개→공개 재전환 시 재지급 (추가 적립) — 단, paybackInfo는 최초 공개 시에만
- 페르소나 콘텐츠 재생성 시: 페이백 적립 대상 없음 (수신 계정 없음, 스킵)
- 어드민 크레딧 회수: 기존 admin credit reclaim API 활용

### Implementation Hints
- 기존 CreditDomainService.issueCredits() 활용
- 기존 CREDIT_SOURCE.PROMOTION 사용
- Config: ConfigService 또는 Unleash feature flag

## Acceptance Criteria
- [ ] 타유저의 공개 콘텐츠를 재생성 시 원작자에게 재생성 비용의 1% 크레딧이 적립된다
- [ ] 적립 금액의 소수점은 올림 처리된다 (예: 1.2 → 2)
- [ ] 적립된 크레딧 타입이 promotion이다
- [ ] CreditHistory에 "크레딧 페이백" 타이틀과 관련 콘텐츠 정보가 기록된다
- [ ] 페르소나 콘텐츠 재생성 시 페이백이 발생하지 않는다 (에러 없이 스킵)
- [ ] 비공개 콘텐츠 재생성 시 페이백이 발생하지 않는다
- [ ] `GET /payback/config` 호출 시 현재 paybackRate가 반환된다
- [ ] paybackRate를 Config/환경변수로 변경 가능하다
- [ ] 마진 체크 로직이 실행되며 결과가 로깅된다
