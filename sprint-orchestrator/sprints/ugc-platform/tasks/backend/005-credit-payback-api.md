# BE-005: Credit Payback API

## Target
- **User Story**: US4 (크레딧 페이백)
- **Acceptance Criteria**: AC 4.1, 4.2, 4.3
- **API Contract**: `api-contract.yaml` — CreditPayback section

## Context
공개 콘텐츠 재생성 시 원작자에게 생성 비용의 1% 크레딧 페이백. 기존 크레딧 시스템 API를 통해 프로모션 크레딧으로 적립. 마진 체크 필수. 페르소나 계정 콘텐츠는 페이백 대상 제외.

## Objective
- `POST /payback/process` — 페이백 처리 (내부 호출, 콘텐츠 재생성 시 트리거)

## Specification

### Data Model
- **CreditPayback** collection (MongoDB)
  - `contentId` (string, indexed)
  - `originalUserId` (string, indexed) — 원작자
  - `regeneratorUserId` (string) — 재생성한 유저
  - `generationCost` (number) — 생성 비용
  - `paybackRate` (number) — 적용된 페이백 비율
  - `paybackAmount` (number) — 실제 적립 금액
  - `creditType` (string: "promotion") — 프로모션 크레딧
  - `processed` (boolean)
  - `reason` (string, nullable) — 미처리 사유
  - `createdAt` (Date)

### Payback Processing Logic
1. 콘텐츠의 원작자 조회
2. 페르소나 계정 체크 → persona면 skip (`reason: persona_account`)
3. Config에서 페이백 비율 조회 (default 1%, min 0.1%)
4. 마진 체크: `margin = revenue - cost - payback` → 적자 시 skip (`reason: margin_check_failed`)
5. 페이백 금액 계산: `ceil(generationCost * paybackRate)` (올림 처리)
6. 기존 크레딧 시스템 API로 프로모션 크레딧 적립
7. CreditPayback 이력 저장
8. 알림 발송 트리거 (배치, BE-007)

### Config
- `PAYBACK_RATE`: 페이백 비율 (default: 0.01)
- `PAYBACK_MIN_RATE`: 최저 하한 (default: 0.001)
- 마진 압박 시 Config 값 수동 조정

### Credit History Integration
- 기존 크레딧 히스토리에 "크레딧 페이백" 타이틀 + 콘텐츠 썸네일로 노출
- 크레딧 타입: promotion (유료 크레딧과 구분)

### Implementation Hints
- `@Transactional()` for payback + credit API call
- Config 값은 환경변수 또는 DB Config collection
- 기존 크레딧 시스템 API 연동 (적립 API)

## Acceptance Criteria

### AC 4.1: 페이백 조건
- 재생성 비용의 1% 크레딧 적립 (Config 비율 적용)
- 마진 체크 통과 시에만 적립
- 페르소나 계정 콘텐츠 → 페이백 미적립 (reason 기록)
- 공개→비공개 전환 시 기존 페이백 회수 안 함
- 비공개→공개 재전환 시 페이백 재지급

### AC 4.2: 크레딧 히스토리
- 크레딧 시스템에 "크레딧 페이백" 타이틀로 적립 기록
- 콘텐츠 썸네일 URL 메타데이터 포함

### AC 4.3: 크레딧 페이백 세부 정책
- 크레딧 타입 = promotion
- 소수점 올림 처리 (1.2 → 2)
- 마진에 포함하여 계산 (margin = revenue - cost - payback)
- 최저 0.1% 하한 (Config)
