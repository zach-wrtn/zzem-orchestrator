# Group 001 Contract Review (Evaluator)

- **Date**: 2026-04-15
- **Reviewer role**: Evaluator (independent, skeptical)
- **Target**: `contracts/group-001.md`
- **Scope**: be-001 + app-001 계약만. 코드 평가 아님.

## 체크리스트 결과

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 1 | Testability | **PASS** | Done Criteria 전부 관찰 가능 (indexes(), MongoServerError, 5-parallel episodeNumber 유일성, assertVisible, NBadge 렌더 조건, `/seen` 멱등). |
| 2 | AC → Done Criteria 누락 | **PASS (minor gaps)** | be-001 9개 AC / app-001 12개 AC 모두 대응. 세부 지적은 Non-blocker 참조. |
| 3 | Edge case 기술 | **PASS (minor gap)** | Guest 401/empty, 타인 시리즈 404, feature flag off, deep-link fallback(flag off) 포함. 일반 back-stack fallback(홈으로 복귀)은 미기술. |
| 4 | Verification Method 매칭 | **PASS** | `home-tabs.yaml`/`webtoon-tab-browse.yaml`/`my-webtoon-empty.yaml`/`my-webtoon-seeded.yaml` 4종 원본 E2E 인증 섹션과 일대일. |
| 5 | conflicts-resolved 영향 | **PASS** | #1 로딩 단일화 → app-002 범위. #2 SeriesDetailScreen 네이밍 → app-003 범위. #3~#8도 app-002/003. group-001(탭/템플릿 상세/MY 리스트) 영향 없음. |

## 이의 목록

### Blocker
- 없음.

### Non-blocker (suggestion, 다음 그룹/구현 단계에서 반영 권장)
1. **S-1 (severity: non-blocker)** — Done Criteria app-001 섹션에 "템플릿 상세 → 뒤로가기 시 웹툰 탭으로 복귀" 관찰량이 빠져 있음. 원본 `001-webtoon-tab-and-template-detail.md` AC 5번째 항목. Maestro `webtoon-tab-browse.yaml`에서 back navigation step 추가하면 커버 가능.
2. **S-2 (non-blocker)** — be-001 Done Criteria "정확히 2개 엔트리 … `TemplateListResponse` 스키마와 1:1" 문장이 "stable order"(원본 AC 79행)를 명시하지 않음. 구현 시 snapshot/order 테스트로 보강 권장.
3. **S-3 (non-blocker)** — Deep-link 일반 fallback 규칙("back-stack에 홈이 없어도 뒤로가기는 홈으로") 은 app-001 spec에는 있으나 group-001.md Edge Cases에 미기술. feature-flag-off fallback과는 별개. Maestro에 deep-link → back → assert home 시나리오 추가 권장.
4. **S-4 (non-blocker, informational)** — `POST /seen` 실패 시 silent + 옵티미스틱 갱신 방침이 app-001 spec엔 명시되어 있으나 Contract Done Criteria에는 흐름만 기술. 에러 경로 관찰량(네트워크 실패 주입 시 로컬 상태 변경 여부)는 수용 기준 외로 간주, 구현 주석 수준으로 OK.

## 결론

- Blocker 0건. Sprint Lead 수정 불요. Evaluator approved.
- `contracts/group-001.md` 끝에 Sign-off 섹션 append 처리.
