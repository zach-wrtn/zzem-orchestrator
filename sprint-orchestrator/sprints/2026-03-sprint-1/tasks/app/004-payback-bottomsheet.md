# Task: 004 - 페이백 안내 바텀시트

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/presentation/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US4 AC 4.4 (최초 진입 UX)
- API Contract Reference: GET /payback/config
- Dependencies: backend/004, app/003
- Parallel With: 없음 (마지막 태스크)

## Objective
유저가 콘텐츠를 최초로 생성하고 공개했을 때 1% 페이백 안내 모달을 노출한다.
1회성 노출 (최초 공개 시에만).

## Specification

### Input
- 콘텐츠 최초 생성 + 공개 완료 시점

### Output
- 페이백 안내 모달: "콘텐츠가 재생성될 때마다 생성 비용의 1%가 페이백됩니다"
- 확인 버튼 → 피드 탐색 CTA

### Business Rules
1. 1회성 노출 — 최초 공개 시에만
2. 모달 확인 후 피드 전환 CTA 노출
3. 페이백 비율은 GET /payback/config에서 동적으로 가져옴

## Implementation Hints
- 1회성 체크: AsyncStorage에 `hasSeenPaybackIntro` 플래그
- 기존 모달/바텀시트 패턴 활용
- 콘텐츠 생성 완료 화면에서 트리거

### 구현 순서
1. Data: paybackRepository.getConfig() + 쿼리 키
2. Presentation: PaybackIntroModal 컴포넌트
3. 기존 생성 완료 화면에 1회성 모달 트리거 추가

## Acceptance Criteria
- [ ] 최초 콘텐츠 공개 시 페이백 안내 모달 노출
- [ ] 모달에 페이백 비율(1%) 표시
- [ ] 확인 후 피드 화면으로 전환
- [ ] 2번째 이후 공개 시 모달 미노출
- [ ] AsyncStorage에 표시 여부 저장

## QA Checklist
- [ ] TypeScript 컴파일 에러 없음
- [ ] Lint 통과
- [ ] 기존 테스트 regression 없음
