# APP-005: Credit Payback UI

## Target
- **User Story**: US4 (크레딧 페이백)
- **Acceptance Criteria**: AC 4.1, 4.2, 4.3
- **API Dependency**: BE-005 (Credit Payback API), BE-002 (payback/info)

## Context
페이백 안내 모달(최초 1회), 크레딧 히스토리에 페이백 항목 표시. 페이백 처리 자체는 서버 내부 로직이므로 앱에서는 안내/표시 UI만 담당.

## Objective
크레딧 페이백 관련 안내 UI 및 히스토리 표시 구현.

## Specification

### Screens / Components

#### PaybackInfoModal
- APP-002의 PaybackInfoModal과 동일 (공유 컴포넌트)
- 최초 콘텐츠 공개 시 1회 노출
- 내용: "콘텐츠가 재생성될 때마다 생성 비용의 1%가 페이백됩니다"
- [확인] 후 피드 탐색 CTA
- `GET /payback/info` → hasSeen 체크
- `POST /payback/info/seen` → 확인 마킹

#### CreditHistoryPaybackItem
- 기존 크레딧 히스토리 리스트에 페이백 항목 추가
- 표시: "크레딧 페이백" 타이틀 + 콘텐츠 썸네일
- 크레딧 타입: 프로모션 크레딧으로 표시 (유료와 구분)
- 기존 크레딧 히스토리 API 응답에서 렌더링

### Data Flow
- PaybackInfoModal: APP-002와 동일 flow
- CreditHistoryPaybackItem: 기존 크레딧 히스토리 쿼리에서 타입별 분기 렌더링

### Implementation Hints
- PaybackInfoModal은 APP-002와 같은 컴포넌트 — 별도 구현 불필요
- CreditHistoryPaybackItem: 기존 히스토리 리스트 아이템 컴포넌트 확장
- 썸네일: 기존 이미지 컴포넌트 재사용

## Acceptance Criteria

### AC 4.1: 페이백 조건
- 안내 모달에서 1% 페이백 정보 정확히 표시
- hasSeen 후 재노출 없음

### AC 4.2: 크레딧 히스토리
- 페이백 항목: "크레딧 페이백" 타이틀 표시
- 콘텐츠 썸네일 노출

### AC 4.3: 크레딧 페이백 세부 정책
- 프로모션 크레딧으로 구분 표시 (UI 뱃지 또는 라벨)
