# Group 002 Summary: ugc-platform-003

**Date**: 2026-04-23
**Result**: PASS / ACCEPTED (Round 1 — first-try PASS)
**Fix loops**: 0

## Scope
- Tasks: be-002, be-003, app-003, app-004, app-005
- Endpoints: POST/DELETE `/v2/users/:id/blocks`, GET `/v2/me/blocks`, POST `/v2/contents/:id/reports`
- Response extensions: `UserPublicProfile.isBlocked` (caller → target 단방향)
- Read-path filters applied to: `/v2/feed`, `/v2/users/:id/contents`, `/v2/me/likes`, `/v2/users/:id/profile`. `/v2/me/contents` public/private 명시 제외.

## Key Artifacts (for Group 003+ reference)

### Public API exposed by Group 002 (consumed by Group 003+)

| Artifact | Location | Consumer |
|----------|----------|----------|
| `UserBlockDomainService.getBlockedPairs(callerId)` | `domain/user-block/user-block-domain.service.ts` | Group 003 notification listener persona/settings gate (optional — block pair 간 알림 skip) |
| `UserBlockDomainService.isBlockedEither(a, b)` | 동일 (BlockRelationPort 실제 impl) | 기존 Group 001 follow domain 의 `BlockRelationPort` 경유 |
| `ContentReportDomainService.getReportedContentIds(reporterId)` | `domain/content-report/content-report-domain.service.ts` | Group 003 Notification (선택) — 신고한 콘텐츠 알림 filter, 현 Contract 에는 미포함 |
| `EVENT_TYPE.CONTENT_REPORTED` + payload `{reportId, reporterUserId, contentId, reason, createdAt}` | `common/constant/event-constant.ts` | PA 추천 팀 consumption (별도 서비스) — 현 스프린트 scope 외 |

### Implementation patterns (reuse in Group 003)

- **BlockRelationPort dual-provider** (user-follow-domain.module.ts + user-block-domain.module.ts): 두 모듈 모두 `BLOCK_RELATION_PORT` provider 보유. 동일 repository 경유로 결과 동치. 장기적으로 DI 단일화 필요 — Minor m2 이월.
- **Hidden UserIds Set composition** (feed/users-public/me-contents app service): `blockedHidden ∪ reportedHidden` union Set 으로 caller 입장 숨김 대상 통합. Group 003 Notification 에서도 동일 패턴 적용 가능.
- **Cursor extra-item pattern** 재확인: `buildListResponse` (user-block-app.service) 가 Group 001 `user-follow-app.service.buildListResponse` 를 mirror — `page[limit]` 인코딩.

## Issues Found & Resolved

Critical 0, Major 0. 첫 Round PASS. 4 Minor 이월 (비차단).

## Minor Deferred (retrospective 이월)

1. **m1 — Transaction rollback integration test 부재**: unit spec 은 `rollbackFollowByPair` throw 시 error propagation 만 검증. 실제 MongoDB `@Transactional` rollback 은 integration 환경 필요. meme-api 컨벤션에 위임.
2. **m2 — BlockRelationPort dual-provider**: UserFollowDomainModule 내부 inline factory + UserBlockDomainModule 의 `useExisting` alias 2개 provider 병존. circular DI 회피 pragmatic 선택. 장기적 DI 단일화 (provider topology 리팩토링) 별도 스프린트.
3. **m3 — BlockedProfileState copy UX 미정**: "이 계정을 차단했어요" 문구가 AC 7.2 문구와 완전 일치하지 않을 수 있음 (PRD 애매). 현 구현 채택. 디자이너 리뷰 필요 시 후속 adjustment.
4. **m4 — Report filter recency 반영 지연**: AC 7.4 "~1h 지연" — 본 구현은 즉시 필터링 (React Query invalidation + BE read-path). 과잉 즉시성이 business rule 과 불일치 가능. PA 추천 팀 signal 은 별도 1h 지연 — 본 그룹 scope 외. Contract 명시.

## Cross-group Integration Confirmations

- Group 001 의 `rollbackFollowByPair` + `BlockRelationPort` API 가 Group 002 에서 깨끗하게 호출 (1 callsite in user-block-domain.service).
- `swipe-feed-more-sheet.tsx` app-003 "차단" append + app-005 "신고" replace 가 merge conflict 없이 coexist.
- `feed-app.service / users-public-app.service / me-contents-app.service` 3 파일에서 block filter + report filter 가 독립 Set union 으로 합성. me-contents public/private 제외 명시.
- `UserPublicProfile` 확장 (`isBlocked: boolean`) 이 Phase 1 consumer (other-user-profile.screen) 에 backward-compat — Zod required 필드 추가로 response shape 변경이 app side 에도 정합.

## Lessons for Next Group (Group 003)

1. **Set union hidden-users 패턴 확장**: Notification center list (`/v2/me/notifications`) 는 block pair 간 알림 hide 여부 decision — 현 Contract 는 listener persist 단계에서 block 체크를 하지 않음. 만약 block 후에도 past 알림이 리스트에 남으면 UX 혼란. Contract 확정 필요: "persist 후 block 발생 시 기존 Notification 도 조회 시 hide?" → 본 그룹은 persist time block check 만 구현 권장.
2. **Event emit-only on new creation**: be-003 (ContentReport) 의 idempotent-on-duplicate 시 event 미emit 패턴을 Group 003 Notification persist (특히 PAYBACK batch idempotency) 에도 적용. `(owner, bucket=YYYY-MM-DD)` unique 제약 + 중복 시 skip (emit 없이 early return).
3. **BlockRelationPort dual-provider caveat**: Group 003 listener 가 persona + block check 를 할 때 어느 module 의 `BLOCK_RELATION_PORT` 를 주입받을지 명시적 — UserBlockDomainModule 의 useExisting alias 경유 권장 (단일 SOT).
4. **Mapper fallback 의도 분류 주석화**: be-002 가 persona nickname fallback 을 `// Why:` 주석으로 명시한 패턴이 효과적 — Group 003 listener 에서 settings 값 fallback 시에도 동일 주석 convention.
5. **Contract field-level 파일 경로 구체화**: Group 002 에서 `UserPublicProfile.isBlocked` 확장 파일 경로를 명시적으로 지정한 것이 effective — Group 003 의 NotificationItem 응답 DTO 경로 (`backend/apps/meme-api/src/application/notification/dto/notification-item.dto.ts` 예상) Contract 에 명시.
6. **Dual repo 병렬 수정 시 shared file 사전 조율**: `swipe-feed-more-sheet.tsx` 의 app-003 / app-005 공존이 문제없이 됐으나, 이는 각 agent 가 different action 에 집중한 덕분. Group 003/004 에서 HomeHeader 에 bell button 추가 (app-006) + settings body "알림 설정" activate (app-007) 가 coming-soon-settings-section `middleSlot` 패턴과 호환 필요 — Contract 명시.

## Files Changed

### backend (sprint/ugc-platform-003)
- `persistence/{content-report,user-block}/` (NEW, 4 files each)
- `domain/{content-report,user-block}/` (NEW: schema, repo, service, module, spec, event, index)
- `application/{content-report,user-block}/` (NEW: app service, DTOs, module)
- `controller/{content-report,user-block}/` (NEW)
- Modified: controller.module.ts, user-follow-domain.module.ts (BlockRelationPort useFactory), event-constant.ts, content.repository.ts, feed-app.{service,module}.ts, users-public-app.{service,module}.ts + public-profile-response.dto.ts, me-contents-app.{service,module}.ts, like-domain.service.ts (hiddenUserIds optional param)

### app (sprint/ugc-platform-003)
- `domain/{content-report,user-block}/` (NEW)
- `data/{content-report,user-block}/` (NEW)
- `presentation/{content-report,user-block}/` (NEW: hooks, components, screens)
- Modified: root-navigator, screen-layout, useNavigationLinking, user-profile entity + DTO (+ isBlocked), other-user-more-sheet, other-user-profile.screen, settings-body + coming-soon (middleSlot), swipe-feed-more-sheet, test-ids, link-screens, route.types
- E2E: `other-user-profile-block.yaml`, `settings-block-management.yaml`, `swipe-feed-content-report.yaml`

## Pressure Reset
Group 002 PASS → Group 003 pressure = 🟢 Normal.
