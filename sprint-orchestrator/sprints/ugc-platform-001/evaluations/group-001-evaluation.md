# Group 001 Evaluation — ugc-platform-001

## Verdict
PASS with follow-ups

## Scope
Commits: `2781ac44` be-001, `3d5721ac` be-002, `13fd9218` be-003, `ccaa20d0` be-004, `4fe6955b` Round 1 fix.
Contract: `sprint-orchestrator/sprints/ugc-platform-001/contracts/group-001.md` (Round 2 signed off 2026-04-22).

## Critical Issues
없음. (Source-code Done Criteria 전부 충족.)

## Major Issues

1. **E2E 테스트가 실제로 실행되지 않음** (contract §공통빌드품질 bullet 4 — E2E).
   - 신규 파일 3개 (`apps/meme-api/test/me-contents.e2e-spec.ts:1-178`, `apps/meme-api/test/me-profile.e2e-spec.ts:1-135`, `apps/meme-api/test/users-public.e2e-spec.ts:1-236`) 는 `apps/meme-api/jest.config.ts` 의 testMatch (`**/?(*.)+(spec|test).[jt]s?(x)` via `@nx/jest/preset`) 와 매치되지 않음 — `.e2e-spec.ts` 파일명이 pattern 상 `e2e` 접두 토큰 때문에 배제됨. `nx test meme-api --listTests` 결과에도 이들 3파일 0개 포함. Sprint Lead 가 보고한 617/617 green 은 unit suite 이며 E2E 는 전무 실행.
   - 대안 config `apps/meme-api/test/jest-e2e.json:1-19` 는 이 파일들을 discover 하지만 `^src/(.*)$` moduleNameMapper 부재로 `test/me-contents.e2e-spec.ts:11` `import { MeContentsController } from "src/controller/me/me-contents.controller"` 가 resolve 실패 — 실제로 실행 시 "Cannot find module" 으로 suite 자체가 실패. nx project.json 에도 `test:e2e` target 미연결.
   - 결과: Contract "`E2E: ... be-002 (GET→PATCH + nickname 경계 2개 + 동시 GET 멱등), be-003 (...private 레거시 미필드 포함 + limit=101 400), be-004 (...404)`" 조건이 행위 검증되지 않음. Follow-up 으로 (a) `jest.config.ts` testMatch 에 `test/**/*.e2e-spec.ts` 추가 + (b) `^src/(.*)$` mapper 를 `jest-e2e.json` 혹은 위 설정에 추가.

2. **me-contents e2e 테스트 시나리오 논리 오류** (`apps/meme-api/test/me-contents.e2e-spec.ts:164-170`).
   - `get("/v2/me/contents?visibility=liked&cursor=anyjunk")` 에 대해 200 을 기대하지만 `MeContentsRequestDto.cursor` 에 `@IsBase64()` (`me-contents-request.dto.ts:19`) 강제 — `"anyjunk"` 는 7자로 padding 4-배수 조건 실패 → ValidationPipe 가 400 반환. 위 Major #1 때문에 현재 노출되지 않지만, testMatch 를 고치는 순간 적색. Done Criteria §be-003 "`visibility=liked&cursor=<anything>` → 200 + 빈 리스트 (cursor 해석이 에러를 일으키지 않는가)" 취지와도 충돌 — 현 구현은 `liked` 이전에 cursor validator 가 먼저 fire. 해결 방향: 테스트를 valid base64 cursor 로 바꾸거나, Application service 가 LIKED 분기를 먼저 타도록 cursor 검증을 완화 (후자는 SSOT 결정 필요).

## Contract Compliance Summary
| Task | Done Criteria | Status |
|------|--------------|--------|
| be-001 | isPublished default=false + 복합 인덱스 `{userId:1,isPublished:1,createdAt:-1}` + mapper `?? false` | OK — `content.schema.ts:75-76,88`, `content.mapper.ts:24`, `content.schema.spec.ts:73-83` 통합 테스트 통과. |
| be-002 | lazy bootstrap + unique sparse idx + E11000 catch + auto-nickname 단어풀≥200 + default avatar + PATCH validator + isPersona (MY only) + regeneratedCount=0 하드코딩 | OK — `user-profile.schema.ts:49`, `user-profile-domain.service.ts:77-101,131-135`, `nickname-words.constant.ts` (adj=216/ani=210, 전부 한글), `my-profile-response.dto.ts:52-54` `TODO(phase-3)` 주석 존재, `update-profile-request.dto.ts:9-12` `@Length(2,20)` 사용. |
| be-003 | public=`{isPublished:true}`, private=`{isPublished:{$ne:true}}` 강제, liked 200+빈 passthrough, limit>100→400, ContentSummary 필드 + cursor passthrough | OK — `content.repository.ts:214-216,236-238` `$ne:true` 형태 강제, `{isPublished:false}` 형태 부재. `me-contents-app.service.ts:26-29` LIKED 빈 반환. `me-contents-request.dto.ts:27` `@Max(100)` clamp 금지. `content-summary.dto.ts:10-16` 필드 집합 일치. |
| be-004 | 404 gate on both endpoints, INTERNAL 허용, PublicProfileResponse 에 isPersona 부재, 공개 필터 강제 | OK — `users-public-app.service.ts:29-33,41-44` 존재 확인 후 NotFoundException, `public-profile-response.dto.ts:12-21` isPersona 없음, `content.repository.ts:247-249` findPublicByUserWithCursor → `{isPublished:true}`. |
| KB | correctness-001 / -002 / integration-001 | OK — grep 결과 Controller 재래핑 0건, DTO getter 0건, 응답 필드명 `list` 일치. |

## Verification Method Results
- §5.1 `rg "new CursorResponseDto\(" apps/meme-api/src/controller/` → 0건 (주석 2건뿐). **PASS**.
- §5.2 `rg "^\s*get \w+\(\)" apps/meme-api/src/**/dto/` → 0건. **PASS**.
- §5.3 cursor passthrough: `me-contents.controller.ts:41`, `users.controller.ts:50` 에서 Service 결과를 그대로 return. **PASS**.
- §5.4 404 gate: `users-public-app.service.ts:29-33, 41-44` 에서 profile/contents 양쪽 동일한 `findByUserId → NotFoundException` 패턴. **PASS**.
- §5.5 regeneratedCount TODO: `my-profile-response.dto.ts:52`, `public-profile-response.dto.ts:33` 에 `// TODO(phase-3): wire to content regeneration tracking` 주석 확인. **PASS**.
- §Regression guard: `rg "isPublished" apps/meme-api/src/` → 9 file, 모두 신규 경로(`persistence/content`, `application/me-contents`, `application/users-public`, `domain/content/interface`) + 신규 테스트. 홈/피드/추천 경로 유출 0. **PASS**.
- Dir hygiene: `controller/user/` (v1 legacy) vs `controller/users/` (v2 신규) 라우트 prefix 다름 — 충돌 없음. **PASS**.

## Final Note
소스 코드 관점에서 Done Criteria 와 KB correctness/integration clauses 는 모두 충족했다. 다만 contract 에서 명시적으로 요구한 E2E 행위 검증(§공통빌드품질 bullet 4)은 테스트 harness 미연결로 실제로 실행되지 않는 상태다. Group 001 코드 PASS 로 처리하되, 다음 그룹 이관 전 follow-up 으로 (1) nx target + testMatch 조정으로 `test/*.e2e-spec.ts` 를 pipeline 에 편입, (2) me-contents e2e 의 `cursor=anyjunk` 시나리오 정정 — 두 건을 요청한다. 배포 차단 이슈는 아님.

---

## 2026-04-22 Update — Follow-ups resolved + regression found & fixed

Sprint Lead 가 Round 2 (commit `7834b5c7`) + 추가 $lte fix (commit `000fc8fd`) 로 모든 follow-up 을 해소.

### Round 2 (E2E harness wiring)
- `apps/meme-api/test/jest-e2e.json` — moduleNameMapper 추가 (`^src/(.*)$`, `^@common/(.*)$`, etc).
- `apps/meme-api/project.json` — `test-e2e` target 등록.
- `me-contents.e2e-spec.ts:164-170` — `cursor=anyjunk` → 유효 base64 `aWdub3JlZA==` 로 교체 (LIKED 분기 의도 유지).

### Regression discovered & fixed during Round 2 verification
Harness 가 제대로 동작한 순간 `me-contents` + `users-public` 의 cursor pagination 테스트 (각각 `"limit=2 + 3 public → page2.list=1"`) 가 실패. 원인은 `content.repository.ts:225` 가 `$lt` 를 사용했으나 이 코드베이스의 `CursorResponseDto` 규약은 `extra 항목 id` 를 cursor 로 인코딩하며 쿼리는 `$lte` 여야 함 (`filter.repository.ts:35,69` 선례). `$lt` 로는 page 2 에서 마지막 항목이 제외됨. **Fix**: `$lt` → `$lte` (1-line, commit `000fc8fd`). 부가 주석으로 규약 명시.

Pre-existing `findByUserWithCursor` (line 80) 의 `$lt` 는 본 스프린트 scope 외 — touch 하지 않음.

### Final E2E Results (post-fix)
```
me-profile.e2e-spec.ts   — PASS
me-contents.e2e-spec.ts  — PASS
users-public.e2e-spec.ts — PASS
app.e2e-spec.ts          — FAIL (pre-existing ExperimentRepository DI issue, unrelated)
```
우리 3개 e2e suite 22/22 green. Group 001 코드 + 행위 검증 모두 충족.

### Updated Verdict
**PASS** (follow-ups resolved). 다음 그룹 이관 가능.
