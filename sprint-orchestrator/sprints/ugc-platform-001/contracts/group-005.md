# Sprint Contract: Group 005 — Credit Payback

## Scope
- Tasks: 005-credit-payback-api (BE), 005-credit-payback-ui (FE)
- Endpoints: GET /payback/config
- BE Internal: payback trigger in meme generation flow
- PRD: US4 (AC 4.1~4.4)
- Depends on: Group 002 (Feed Publish — visibility toggle + paybackInfo response)

## Done Criteria
- [ ] DC-1: 타유저의 공개 콘텐츠를 재생성하여 성공적으로 생성 완료된 ��, 원작자에게 ��생성 비용의 1% 크레딧이 적립된다. 트리거 시점: 재생성된 콘텐츠가 DB에 저장된 후 (실패한 생성은 페이백 미발생)
- [ ] DC-2: 적립 금액의 소수점은 올림 처리 (ceil). 예: 비용 150 → 페이백 2 (150 * 0.01 = 1.5 → ceil → 2)
- [ ] DC-3: 적립된 크레딧 타입이 promotion (CREDIT_SOURCE.PROMOTION)이다. 만료 정책: 기존 promotion 크레딧 기본 만료 정책을 따른다
- [ ] DC-4: CreditHistory에 title="크레딧 페이백", thumbnail=원본 콘텐츠의 썸네일 URL, description에 원본 콘텐츠 ID가 기록된다
- [ ] DC-5: 페르소나 콘텐츠(isPersona=true인 소유자) 재생성 시 페이백이 발생하지 않는다 (에러 없이 스킵)
- [ ] DC-6: 비공개 콘텐츠(isPublished=false) 재생성 시 페이백이 발생하지 않는다
- [ ] DC-7: 본인 콘텐츠 재생성 시 셀프 페이백이 적립되지 않는다 (원작자 == 재생성자면 스킵)
- [ ] DC-8: 페이백 금액이 0인 경우 적립을 스킵한다 (issueCredits 호출 안 함, 이벤트 미발행, 히스토리 미생성)
- [ ] DC-9: GET /payback/config (LibUserGuard) → 현재 paybackRate(0.01) 반환
- [ ] DC-10: paybackRate가 ConfigService 또는 상수로 중앙 관리되어 변경 가능하다
- [ ] DC-11: 마진 체크 로직이 실행되며 logger.warn으로 마진 비율과 페이백 금액이 로깅된다. 마진 부족 시에도 페이백은 정상 적립된다 (시스템 차단 없음, 로그만)
- [ ] DC-12: 페이백 발생 시 `credit.payback` 이벤트 발행 (payload: { userId, contentId, amount, timestamp }). Transport: EventEmitter
- [ ] DC-13: FE 콘텐츠 최초 공개 시 (visibility toggle 응답에 paybackInfo 존재 시) PaybackInfoSheet 바텀시트 표시
- [ ] DC-14: FE PaybackInfoSheet에 페이백 비율(1%) 안내 문구 포함 + 피드 전환 CTA
- [ ] DC-15: FE 이미 공개된 적 있는 콘텐츠 재공개 시에는 바텀시트 미표시 (paybackInfo=null)
- [ ] DC-16: FE 크레딧 히스토리에 "크레딧 페이백" 항목이 콘텐츠 썸네일과 함께 표시 (기존 CreditHistory 화면이 새 타입을 렌더링)

## Verification Method
- DC-1: 재생성 flow에서 콘텐츠 저장 후 → 원작자 조회 → 소유자 체크 → 페이백 금액 계산 → CreditDomainService.issueCredits() 호출 추적
- DC-2: Math.ceil(cost * paybackRate) 계산 확인
- DC-3: issueCredits 호출 시 source: CREDIT_SOURCE.PROMOTION + expiresAt 설정 확인
- DC-4: CreditHistory 생성 시 title, thumbnail, description 필드 확인
- DC-5: 원작자 프로필에서 isPersona 체크 → true면 early return
- DC-6: 원본 콘텐츠 isPublished 체크 → false면 early return
- DC-7: 원작자 userId == 재생성자 userId → early return
- DC-8: paybackAmount === 0 → early return (issueCredits 미호출)
- DC-9: Controller + route 확인
- DC-10: paybackRate 값이 ConfigService.get() 또는 named constant에서 읽히는지 확인
- DC-11: 마진 계산 후 logger.warn 호출 확인 (마진 값 포함)
- DC-12: EventEmitter.emit('credit.payback', payload) 확인
- DC-13~15: FE visibility toggle onSuccess에서 paybackInfo 존재 체크 → PaybackInfoSheet 표시 로직
- DC-16: CreditHistory 렌더링에서 payback 타입 항목 처리 확인

### Edge Cases to Test
- 재생성 비용 0 → 페이백 0 → 스킵 (DC-8)
- 본인 콘텐츠 재생��� → 셀프 페이백 불가 (DC-7)
- 페르소나 콘텐츠 재생성 → 스킵 (DC-5)
- 비공개 콘텐츠 재생성 → 스킵 (DC-6)
- 재생성 실패 시 → 페이백 미발생 (DC-1 트리거 조건)

## Sign-off
- 2026-03-29: Evaluator reviewed (6 objections), Sprint Lead revised (A-1~A-3, E-1~E-3 all addressed)
- 2026-03-29: Evaluator approved — all 16 DCs specific, testable, aligned
