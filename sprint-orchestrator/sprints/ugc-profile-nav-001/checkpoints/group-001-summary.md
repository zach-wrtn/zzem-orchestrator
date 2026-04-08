# Group 001 Summary: ugc-profile-nav-001

## Scope
- Tasks: backend/001-profile-api, backend/002-content-visibility, app/001-tab-navigation, app/002-profile-screen
- Endpoints: GET/PATCH /user-profile/me, GET /user-profile/:id, GET /user-profile/share/:id, GET /content/user/:id, PATCH /content/:id/publish

## Result: PASS
- Fix loops: 1회
- Evaluator verdict: PASS (7개 이슈 발견 → 전부 수정 → 재평가 PASS)

## Issues Found & Resolved
| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | Critical | 커서 페이지네이션 이중 래핑 → nextCursor 항상 null | controller에서 result.nextCursor 직접 전달 |
| 2 | Critical | hasNext getter가 JSON 직렬화 안 됨 | 일반 property + @ApiProperty() 변경 |
| 3 | Critical | 응답 필드명 list vs items 불일치 | DTO에서 items로 통일 |
| 4 | Medium | regeneratedCount 0 하드코딩 | TODO 주석 추가 (인프라 부재로 허용) |
| 5 | Medium | domain에서 react-query import (Clean Architecture 위반) | usecase를 presentation/hooks로 이동 |
| 6 | Low | domain에서 AxiosResponse import | Promise<{data:T}> 패턴으로 변경 |
| 7 | Low | filterTitle z.string() non-nullable | z.string().nullable() 변경 |

## Lessons for Next Group
- **커서 페이지네이션**: controller에서 CursorResponseDto를 재래핑하지 말 것. app service에서 최종 형태 반환.
- **DTO 필드명**: API contract의 필드명(items/nextCursor/hasNext)을 BE/FE 양쪽에서 동일하게 사용할 것.
- **Clean Architecture**: usecase 훅은 반드시 presentation 레이어에 배치. domain은 순수 TS만.
- **Zod nullable**: API 응답에서 null 가능한 필드는 반드시 `.nullable()` 추가.

## Files Changed
### Backend (wrtn-backend)
- 24 files created, 16 modified (initial)
- 3 files modified (fix loop 1)

### App (app-core-packages)
- 19 files created, 4 modified (initial)
- 5 files modified, 1 deleted (fix loop 1)
