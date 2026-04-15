# Pattern Index

> Evaluator가 발견한 코드 패턴 인덱스. 최신순 정렬.

| ID | Title | Category | Severity | Freq | Last Seen |
|----|-------|----------|----------|------|-----------|
| correctness-001 | 커서 페이지네이션 DTO 이중 래핑 | correctness | critical | 1 | ugc-profile-nav-001 |
| correctness-002 | JS getter JSON 직렬화 누락 | correctness | critical | 1 | ugc-profile-nav-001 |
| integration-001 | BE/FE 응답 필드명 불일치 | integration | critical | 1 | ugc-profile-nav-001 |
| code-quality-001 | Clean Architecture 위반 (domain에서 react-query import) | code_quality | major | 1 | ugc-profile-nav-001 |
| code-quality-002 | 도메인 state 플래그를 repository write 부작용으로 flip (dual write site) | code_quality | major | 1 | ai-webtoon |
| completeness-001 | 네비게이션 진입점 누락 | completeness | critical | 1 | ugc-profile-nav-001 |
| completeness-002 | 훅 생성 후 호출부 미구현 | completeness | major | 1 | ugc-profile-nav-001 |
| completeness-003 | Navigation route.types param 추가 시 호출부 전달 누락 | completeness | major | 1 | free-tab-diversification |
| completeness-004 | Retry CTA가 원래 request intent를 보존하지 않고 default로 silent fallback | completeness | major | 1 | ai-webtoon |
| correctness-003 | Pricing source와 Display source 혼재 | correctness | major | 1 | free-tab-diversification |
| edge-case-001 | 2-step atomic sequence ($inc → insert) counter gap on insert failure | edge_case | major | 1 | ai-webtoon |
| integration-002 | Cross-path cleanup/rollback 누락 (legacy vs new workflow) | integration | major | 1 | free-tab-diversification |
| integration-003 | Concurrency cap source divergence (DB-sum vs Redis slot) | integration | major | 1 | ai-webtoon |
