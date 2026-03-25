# Task: 002-payback-bottomsheet

## Target
- target_app: MemeApp
- target_path: apps/MemeApp/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US4 크레딧 페이백 (AC 4.2, AC 4.4), US1 피드 공개 (AC 1.2)
- API Contract Reference:
  - GET /credit/payback/config (getPaybackConfig)
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: app/001-feed-publish-toggle-cta (공개 토글 기능 필요)
- Parallel With: backend/002-credit-payback, app/002-follow-ui

## Objective
콘텐츠를 최초로 공개한 유저에게 1% 페이백 안내 모달을 노출하고, 확인 후 피드 탐색으로 유도하는 CTA를 제공한다. 또한 크레딧 히스토리에 "크레딧 페이백" 항목이 올바르게 표시되도록 한다.

## Specification

### Screens / Components
- `PaybackInfoBottomSheet` — 최초 공개 시 페이백 안내 바텀시트
  - 메시지: "콘텐츠가 재생성될 때마다 생성 비용의 1%가 페이백됩니다"
  - 확인 버튼 + 피드 탐색 CTA 버튼
- `CreditPaybackHistoryItem` — 크레딧 히스토리 목록 내 페이백 항목 (타이틀 + 콘텐츠 썸네일)
- 기존 크레딧 히스토리 화면 수정

### User Interactions
1. 유저가 콘텐츠를 최초로 공개(토글 ON) → PaybackInfoBottomSheet 노출
2. 바텀시트에서 "확인" 탭 → 바텀시트 닫힘
3. 바텀시트에서 "피드 탐색하기" CTA 탭 → 피드 화면으로 navigate
4. 크레딧 히스토리 화면에서 페이백 항목 표시: "크레딧 페이백" 타이틀 + 콘텐츠 썸네일

### Business Rules
1. 페이백 안내 바텀시트는 1회성 (최초 콘텐츠 공개 시에만 노출)
2. 노출 여부를 로컬 저장소(AsyncStorage/MMKV)에 플래그로 저장
3. 페이백 비율은 GET /credit/payback/config에서 동적으로 가져옴 (현재 1%)
4. 크레딧 타입 = 프로모션 크레딧 (유료 크레딧과 구분하여 표시)
5. 크레딧 히스토리 페이백 항목에 원본 콘텐츠 썸네일 포함

## Interaction States

### PaybackInfoBottomSheet
- **Config 로딩 실패**: 바텀시트 미노출 (silent fail — 페이백 안내는 nice-to-have, 공개 동작은 정상 진행)
- **바텀시트 외부 탭**: 바텀시트 닫힘 (확인과 동일 처리, 1회성 플래그 저장)

### CreditPaybackHistoryItem
- **썸네일 로드 실패**: placeholder 이미지 표시

## Implementation Hints
- 기존 패턴 참조: credit 도메인의 기존 크레딧 히스토리 UI 패턴, 기존 바텀시트 컴포넌트
- 1회성 플래그 저장: Zustand persistent store 또는 AsyncStorage (기존 프로젝트 패턴 따름)
- Domain: useGetPaybackConfig 쿼리 훅, PaybackConfig 엔티티
- Data: PaybackConfigDto, PaybackConfigMapper, creditPaybackQueryKeys
- 기존 크레딧 히스토리 아이템에 "credit_payback" 타입 분기 추가
- 필수 스킬 참조:
  - `.claude/skills/rn-architecture/SKILL.md`
  - `.claude/skills/stylev2-rn-tailwind/SKILL.md`

## Acceptance Criteria
- [ ] 최초 콘텐츠 공개 시 페이백 안내 바텀시트가 노출된다
- [ ] 바텀시트에 페이백 비율(1%)이 동적으로 표시된다
- [ ] 바텀시트 확인 후 닫힌다
- [ ] 피드 탐색 CTA 탭 시 피드 화면으로 이동한다
- [ ] 2회차 이후 공개 시에는 바텀시트가 노출되지 않는다
- [ ] 크레딧 히스토리에 "크레딧 페이백" 항목이 썸네일과 함께 표시된다
- [ ] 프로모션 크레딧 타입이 구분되어 표시된다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
