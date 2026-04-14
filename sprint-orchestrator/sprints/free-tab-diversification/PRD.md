# Sprint PRD: free-tab-diversification

- **원본 PRD**: [docs/prds/PRD-free-tab-filter-diversification.md](../../../docs/prds/PRD-free-tab-filter-diversification.md)
- **Notion**: https://www.notion.so/Agent-PRD-x-prd-v2-33e0159c6b598143bd62c4c136d72bd8
- **도메인**: ZZEM

## 스코프 요약

무료 필터 편성을 하루 1개 → N개(기본 10개, 테마 3-3-4)로 확장하고, 날짜별 편성 관리 구조로 전환. 1일 1회 무료 생성 제한(BR-1)과 DB 레벨 고유 제약(BR-3)은 유지.

### 핵심 딜리버러블
- **Backend**: 날짜별 무료 슬롯 스케줄러(활성화/만료/예약 3단계, BR-8/9), 필터 목록 API에 오늘 무료 사용 여부 포함(BR-13), 생성 시점 슬롯 자동 매핑(BR-12), DB 고유 제약(BR-3), KST 자정 경계(BR-16).
- **App**: 무료탭 N개 그리드 + 보라/틸 배너 전환, 레드닷, SwipeFeed circular scroll(무료 전용), 확인 바텀시트(무료/유료 CTA 분기), 추천탭 외부 진입점 동일 경험(US-7), 스크롤 위치 복원.
- **하위 호환**: 구앱은 1개 필터 경험 유지(BR-11). 서버 선배포(BR-10).

### 주요 User Stories
US-1 무료탭 N개 그리드 / US-2 SwipeFeed 생성 플로우 / US-3 SwipeFeed 탐색 / US-4 스크롤 복원 / US-5 틸 배너 전환 / US-6 사용 완료 후 유료 CTA / US-7 외부 진입점.

### Out of Scope
Task 2(예고 필터+알림), Task 3(페르소나), 카테고리 칩, 스케줄러 재시도 크론, 웹 대응.
