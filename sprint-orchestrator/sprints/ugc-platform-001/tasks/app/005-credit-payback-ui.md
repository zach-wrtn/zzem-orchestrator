# Task: 005-credit-payback-ui

## Target
app-core-packages/apps/MemeApp

## Context
- PRD US4: 크레딧 페이백 (AC 4.1~4.4)
- 페이백 안내: 최초 공개 시 바텀시트, 크레딧 히스토리에 페이백 항목
- 기존 크레딧 히스토리 화면 존재
- API Contract: PATCH /contents/{contentId}/visibility 응답의 paybackInfo, GET /payback/config

## Objective
페이백 안내 바텀시트 (최초 공개 시), 크레딧 히스토리의 페이백 항목 표시를 구현한다.

## Specification

### Screens / Components
- **PaybackInfoSheet**: 페이백 안내 바텀시트
  - 최초 콘텐츠 공개 시 표시 (visibility toggle 응답의 paybackInfo 존재 시)
  - 내용: "콘텐츠가 재생성될 때마다 생성 비용의 1%가 페이백됩니다"
  - 확인 버튼 + 피드 전환 CTA
  - 1회성 노출 (최초 공개 시에만)
- **CreditHistory 확장**: 페이백 항목 표시
  - 기존 크레딧 히스토리에 "크레딧 페이백" 타입 항목이 콘텐츠 썸네일과 함께 표시

### Data Flow
- paybackInfo는 Group 002의 visibility toggle 응답에서 수신
- PaybackInfoSheet 표시 조건: visibility toggle 성공 응답에 paybackInfo 필드 존재 시

### Implementation Hints
- 기존 크레딧 히스토리 화면 (presentation/credit/) 패턴 참조
- 바텀시트: 기존 BottomSheet 컴포넌트 사용
- 1회성 노출: 서버 응답 기반 (paybackInfo는 최초 공개 시에만 반환)

## Acceptance Criteria
- [ ] 콘텐츠 최초 공개 시 페이백 안내 바텀시트가 표시된다
- [ ] 바텀시트에 페이백 비율(1%) 안내 문구가 포함된다
- [ ] 바텀시트 확인 후 피드 전환 CTA가 동작한다
- [ ] 이미 공개된 적 있는 콘텐츠 재공개 시에는 바텀시트가 표시되지 않는다
- [ ] 크레딧 히스토리에 "크레딧 페이백" 항목이 콘텐츠 썸네일과 함께 표시된다
