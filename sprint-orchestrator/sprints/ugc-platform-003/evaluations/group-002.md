# Evaluation: group-002 — Block & Content Report

- Round: 1
- Verdict: PASS
- Date: 2026-04-23

## Summary
be-002 / be-003 / app-003 / app-004 / app-005 모두 Contract Done Criteria 충족. 트랜잭션·idempotent·cross-feed 필터·UI 문구·네비게이션·E2E 를 전수 trace 했고 Critical / Major 모두 0. 다만 경계 케이스(persona display fallback 주석 허용, 경미한 설계 선택) 몇 가지를 Minor 로 기록.

## Critical
(none)

## Major (fix loop required)
(none)

## Minor (deferred)

| # | Task | Issue | File:Line | Recommendation |
|---|------|-------|-----------|----------------|
| m1 | be-002 | `@Transactional()` 데코레이터가 AsyncLocalStorage 기반 (meme-api custom). MongoDB session 이 `upsertBlock` + `rollbackFollowByPair` 에 명시적으로 전달되는 경로는 코드상 보이지 않음 — `@Transactional` 이 내부적으로 repository 레이어까지 session 을 주입한다는 전제 (meme-api convention). unit test 는 AOP 미적용이라 rollback 검증은 "raw error propagation only" 수준. Integration / E2E 에서 실제 abort 검증은 Contract 명시하지 않았지만 후속 스프린트 회귀 리스크. | `domain/user-block/user-block-domain.service.ts:68-93` | Follow-up retrospective: 명시적 session param 또는 integration test 케이스 추가 검토. |
| m2 | be-002 | `UserBlockDomainModule` 은 `BLOCK_RELATION_PORT` 를 `useExisting: UserBlockDomainService` 로 export 하지만, 실제 consumer (`UserFollowDomainModule`) 는 module-local factory 를 별도로 구성 — 두 개의 port 인스턴스가 병존. 결과 동치 (동일 repository 경유) + 모듈 주석이 이를 명시하지만, 향후 캐시/타이밍 의존 로직 추가 시 혼선 여지. | `domain/user-block/user-block-domain.module.ts:22` + `domain/user-follow/user-follow-domain.module.ts:34-47` | 장기적으로 DI 단일화 (shared module or forwardRef) 검토. 현 스프린트 scope 외. |
| m3 | be-002 | `application/user-block/user-block-app.service.ts:72` 에 `profile.nickname ?? profile.name` persona display fallback — Group 001 Lesson `Why: persona display fallback` 주석 의무 이행 완료. KB completeness-008 의 "의도적 허용" 경계. 수용. | `application/user-block/user-block-app.service.ts:72` | `displayName(profile)` helper 도입 후속 스프린트 이월 (Group 001 Lesson #4 대응). |
| m4 | be-003 | `/v2/contents/:contentId/reports` 는 신규 생성 시 HTTP 201, 중복 신고 시 200 을 `res.status()` 로 동적 설정. 응답 body 양쪽 동일. api-contract.yaml 명시와 일치하나 클라이언트 UX 관점에서는 "신고 접수" 동일 Toast 라 관찰 불가. 테스트는 created flag 로만 검증. | `controller/content-report/content-report.controller.ts:57-59` | 후속 회귀 리그레션 시 status code 검증 유지. |

## Regression Check

| Target | Result | Notes |
|--------|--------|-------|
| ProfileScreen 본인/타 유저 분기 | PASS | `other-user-profile.screen.tsx` — isBlocked=true 시 BlockedProfileState, 그 외 기존 렌더 유지. `useGetUserContentsUseCase` `enabled: !!userProfile && !isBlocked` 로 404/차단 분기 모두 방어. |
| Settings canonical order (알림 설정 → 차단 관리 → 고객센터) | PASS | `settings-body.tsx` 주석 + `ComingSoonSettingsSection` middleSlot 주입 패턴으로 순서 보존. |
| swipe-feed more-sheet owner 분기 | PASS | `swipe-feed-more-sheet.tsx` meMenu (다운/의견/삭제) 불변. otherMenu 에 report 교체 + block append. |
| ReportFilterScreen (필터 신고) | PASS | git diff 0 파일. 본 스프린트에서 언급/수정 없음. |
| /v2/feed 응답 스키마 | PASS | DTO schema 불변. 필터만 추가 (`buildContentFeedItems` hidden + reported set). |
| /v2/me/contents public/private | PASS | visibility=liked 경로에만 hiddenUserIds / reportedSet 적용. public/private 분기 영향 없음 (`me-contents-app.service.ts:44-66`). |
| /v2/me/likes | PASS | `likeDomainService.findLikedContents` 에 `options.hiddenUserIds` 주입 (Set 기반 in-memory filter). |
| /v2/users/:id/profile 응답 필드 | PASS | `isBlocked` 추가만 (타 필드 불변). BE DTO `dto.isBlocked = false` default 초기화 후 caller→target 단방향 계산값 세팅. |
| Group 001 `rollbackFollowByPair` 동작 | PASS | be-002 가 `userFollowDomainService.rollbackFollowByPair(caller, target)` 단일 helper 경유. grep: 2 callsite (domain + spec). direct `UserFollow.deleteMany` 0 hit (comment-only). |

## KB Pattern Gates (active trace)

| Pattern | Result | Notes |
|---------|--------|-------|
| completeness-008 (mapper fallback 금지) | PASS | BE/FE user-block, content-report 디렉토리 내 `?? 0 / ?? false / \|\| ""` 0 hit. Persona display fallback (`profile.nickname ?? profile.name`) 은 주석 명시 Minor 예외 (m3). |
| completeness-009 (dead hook/method) | PASS | `rollbackFollowByPair(` 2 callsite, `isBlockedEither(` 3+ callsite (follow-domain.module factory + user-block-domain.service + block-relation.port noop default). `useBlockUser / useUnblockUser / useReportContent` 각 ≥ 2 callsite (definition + consumer). `ContentReportedEvent / EVENT_TYPE.CONTENT_REPORTED` emit 1 + spec 2 + consumer 파일 1 = 4+ hit. |
| completeness-010 (cross-component 전수) | PASS | Block filter 4 endpoint 전수 — /profile (isBlocked), /contents (empty), /me/likes (hiddenUserIds), /feed (buildContentFeedItems hidden). /me/contents public/private 제외 명시 (주석). Report filter 3 endpoint 전수 — /feed, /users/:id/contents, /me/likes. /me/contents public/private 제외 주석 명시. |
| correctness-004 (cursor $lte) | PASS | user-block repository `findBlocksWithCursor` compound cursor `$or: [{createdAt: $lt}, {createdAt: eq, _id: $lte}]` — $lt 는 "이전 날짜" 측, $lte 는 tie-break id 측. content-report cursor 없음. list endpoint gate 통과. |
| integration-002 (cross-path cleanup 단일 helper) | PASS | `domain/user-block/` 내 direct `UserFollow.deleteMany` / `followRepository.delete` 0 hit (comment 2건만). 모든 follow 해제는 `rollbackFollowByPair` 경유. |
| e2e appId uniformity | PASS | `rg '^appId:' e2e/flows | sort -u` → 단일 `com.wrtn.zzem.dev`. 신규 3개 yaml (`other-user-profile-block`, `settings-block-management`, `swipe-feed-content-report`) 모두 일치. |
| Block/Report 미통지 grep | PASS | `notifyBlock / BLOCK_CREATED / notifyReport / REPORT_CREATED` 0 hit. AC 7.2 / 7.3 미통지 원칙 준수. |

## Cross-group Integration Verification

- **rollbackFollowByPair correctness**: `user-block-domain.service.ts:86` 단일 호출, `@Transactional` 내부 — upsert + rollback 연쇄. spec (`user-block-domain.service.spec.ts:97-140`) 이 rejection 시 propagation 검증. decorator AOP 로 실제 abort 는 integration layer 에서 일어남 (Contract 허용 범위).
- **BlockRelationPort useFactory behavior**: `user-follow-domain.module.ts:34-47` — circular DI 회피 목적으로 `UserBlockRepository` 만 주입받아 inline factory 로 `BlockRelationPort` 구성. `isBlockedEither(a, b)` 는 양방향 `existsByPair` Promise.all + OR. self (a===b) early return 포함. UserFollowDomainService 의 follow-state / followUser 분기가 BLOCKED 처리에 사용. `UserBlockDomainModule` 이 별도 `useExisting` alias 를 export 하지만 module-local scope 상 UserFollowDomainModule 의 factory 가 우선 (실제 결과 동치 — 동일 repository 경유). Minor m2 로 기록.
- **swipe-feed-more-sheet merge conflict free**: app-003 block append + app-005 report replace 가 동일 `otherMenu` 배열에 공존. meMenu 불변. 각 action 의 if-guard (`item.userProfile.name` 체크) 가 KB completeness-008 준수. 원래 actions 전수 유지 (owner: 다운/의견/삭제, non-owner: 다운/의견/신고/차단).
- **feed / users-public / me-contents dual filter composition**: 3 endpoint 모두 `userBlockDomainService.getBlockedPairs` + `contentReportDomainService.getReportedContentIds` 를 독립적으로 Set 으로 수집하여 AND 합성. feed: recommendation 선 filter → owner hidden filter. users-public: hiddenUserIds 에 target 포함 시 early empty + caller 가 신고한 contentId 후처리 제외. me-contents liked: likeDomainService 에 hiddenUserIds 주입 + reportedSet 후처리. 상호 배타 없음 (set union semantics).

## Lessons for Next Group (Group 003 — Notification Backend)

1. **Transactional abort 검증 강화**: be-002 spec 은 unit level 에서 "raw error propagation" 만 검증. be-004 (Notification entity) 는 persona/settings gate 단일 helper 주변에 @Transactional 도입 시 integration-level 검증 케이스 명시 권장.
2. **Module-level DI override vs. factory**: be-002 의 `BLOCK_RELATION_PORT` 가 두 Module 에 병존 (UserFollowDomainModule 내 factory + UserBlockDomainModule 내 useExisting alias). 결과 동치지만 신규 port 추가 시 반드시 "단일 Module 에서만 useExisting / useFactory" 원칙 Contract 에 명시. 혼선 방지.
3. **/v2/me/contents visibility=liked 경로 재사용**: be-002 가 `likeDomainService.findLikedContents(userId, limit, cursor, { hiddenUserIds })` 파라미터 확장 패턴 수립. Group 003 be-005 (`/v2/me/notifications`) 는 read-only 리스트이므로 동일 패턴으로 `{ hiddenActorIds }` 같은 optional 필터 확장 시 재사용 가능 (현 필요도는 없음).
4. **Content-level event emit payload 설계 precedent**: `ContentReportedEvent { reportId, reporterUserId, contentId, reason, createdAt }` 형식 — Group 003 `FOLLOW_CREATED` 대칭 + 추후 추천 penalty subscriber 를 위한 re-reference 가능. persona/settings gate 조건이 별도로 필요한 이벤트 (예: FEED_REACTION_CREATED) 추가 시 `shouldNotify` flag 를 payload 에 함께 싣는 Group 001 패턴을 재확인.
5. **Settings canonical order slot pattern**: app-004 가 `ComingSoonSettingsSection` 에 `middleSlot` prop 을 도입 — app-007 (알림 설정 실 활성화) 시 동일 slot 패턴 재사용. ComingSoon 자체가 점진적으로 비어가는 방향이므로, 차기 그룹은 "middleSlot 2 추가" 패턴 (알림 설정 slot + 차단 관리 slot) 고려 권장.
6. **Content repository `hiddenUserIds` option**: `findByUserAndVisibilityWithCursor` 가 `options.hiddenUserIds` 에 현재 target userId 포함 시 `return []` early exit — target 소유 콘텐츠는 단일 userId 이므로 AND 평가 불필요. 비슷한 "단일 target filter + hidden set" 패턴은 Group 004 notification consumer 에서도 동일 shortcut 재활용 가능.
