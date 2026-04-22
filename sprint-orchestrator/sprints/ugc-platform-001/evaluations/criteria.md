# Evaluation Criteria — Sprint ugc-platform-001

> Phase 2 (Spec) 산출물. Evaluator의 active evaluation 기준 프레임워크.
> Self-evaluation은 신뢰할 수 없으므로, 이 기준은 **독립 Evaluator**가 적용한다.

## Grading Dimensions

| 기준 | 가중치 | 설명 |
|------|--------|------|
| **Correctness** | 높음 | 비즈니스 로직이 AC와 정확히 일치하는가 (특히 visibility 필터/본인·타인 구분) |
| **Completeness** | 높음 | 모든 AC가 충족되었는가 — 진입점(버튼/메뉴/딥링크) 포함 |
| **Integration** | 높음 | api-contract.yaml의 필드명/타입/cursor 규약과 FE 소비 타입이 일치하는가 |
| **Edge Cases** | 중간 | 빈 상태, 404, 이미지 실패, 취소, 본인/타인 가드 |
| **Code Quality** | 낮음 | 기존 패턴 준수, 레이어 경계 준수 (MemeApp Clean Architecture) |

> Code Quality 가중치가 낮은 이유: Claude는 기본적으로 코드 품질이 높다.
> 본 스프린트는 **Integration**을 추가로 높게 둔다. BE ↔ FE 계약 일치가 대부분의 이슈 축.

## Severity Classification

| Severity | 정의 | 본 스프린트 예시 |
|----------|------|------------------|
| **Critical** | 기능 불가, 데이터 손상/유출 위험 | 타유저 프로필에 비공개 콘텐츠 노출, PATCH /me/profile 500, 본인 판별 실패 |
| **Major** | 동작하나 AC/비즈니스 규칙 위반 | 탭 순서 PRD 불일치, 닉네임 2자 저장 비활성 누락, cursor 재래핑, 좋아요 탭 기본 랜딩 |
| **Minor** | 동작에 영향 없는 코드 품질 | unused import, 테스트 누락(필수가 아닌 경로) |

## Verdict Rules

- **PASS**: Critical 0, Major 0 → 다음 그룹 진행
- **ISSUES**: Critical 0, Major 1+ → 수정 후 재평가 (fix loop 1~2회)
- **FAIL**: Critical 1+ 또는 Major 3+ → 수정 후 재평가, 3회차 실패 시 FAILED + 사용자 개입

## Evaluator Calibration

### Skepticism Anchors

```
당신은 코드 리뷰어가 아니라 버그 헌터다.

- 구현이 완벽해 보여도 의심하라
- "이건 동작할 것 같은데..."라고 느끼면 실제로 trace하라
- 문제를 발견한 후 "별거 아닐 수도"라고 자신을 설득하지 마라
- Happy path가 아닌 edge case에서 시작하라
- 코드가 "존재"하는 것과 "올바르게 동작"하는 것은 다르다
```

### Anti-Patterns to Avoid

- 파일/함수 존재만 확인하고 VERIFIED 판정
- 이슈를 나열한 뒤 "전반적으로 잘 구현되었다"로 결론
- Generator의 의도를 선의로 해석하여 불완전한 구현 통과
- Happy path만 테스트하고 PASS 판정
- **visibility/본인·타인 필터 존재만 확인하고 실제 응답에 섞임 여부 미점검**

## Group-Specific Criteria

### Group 001 — Backend Data Layer (be-001 ~ be-004)

**핵심 검증 포인트:**

- **be-001 (Content schema)**:
  - `isPublished: boolean = false` default 작동 확인 (기존 Content 재생성 시 false로 저장)
  - 기존 visibility-agnostic 조회 경로(홈/피드/추천)에 **회귀 없음** — isPublished 미필터 쿼리 동작
  - Compound index `{userId: 1, isPublished: 1, createdAt: -1}`가 Mongoose schema 레벨에 존재
  - Migration/backfill: 기존 레코드를 어떻게 처리하는지 명시. 기본 `false`가 허용 가능한지 확인 (본 Phase는 신규 퍼블리시 플래그 도입 → false 디폴트 허용).
- **be-002 (me/profile)**:
  - 자동 닉네임 생성 규칙: 최초 진입 시 adj+animal+4digit 생성, 멱등 (재호출 시 기존 값 유지)
  - `UserProfile.type === INTERNAL` → `isPersona: true` 매핑이 MyProfileResponse에만 포함 (PublicProfileResponse 누출 금지)
  - PATCH validator: nickname 2~20자, profileImageFileUuid 포맷 (presigned URL 흐름 호환)
  - Counts: followerCount/followingCount/regenerationCount — Phase 1에서는 0 고정 허용 (PRD scope 외), 단 필드는 스키마에 존재
- **be-003 (me/contents)**:
  - `visibility=public` → isPublished=true, `visibility=private` → isPublished=false, `visibility=liked` → Phase 1에서 빈 리스트(cursor `null`)
  - Cursor 규약: BE는 raw `{list, nextCursor}` 반환 (`CursorResponseDto` 재래핑 금지 — correctness-001)
  - counts endpoint: publicCount, privateCount, likedCount=0 반환
  - 타유저가 본인 me 엔드포인트 호출 시 본인 것만 반환되는지 (@DUser 가드 신뢰)
- **be-004 (users/:userId/*)**:
  - `/users/:userId/contents` → `isPublished=true` AND `userId=:userId` 필터 강제
  - 존재하지 않는 userId → 404 (not 200 with empty)
  - PublicProfileResponse에 `isPersona` 필드 미포함 (타입 diff로 확인)
  - INTERNAL persona 유저가 public API를 통해서도 조회 가능해야 하는지(AC는 USER 프로필만 가정 — Evaluator는 PRD 확인 후 결정)

**API Contract 준수:**
- 모든 응답이 `contracts/api-contract.yaml` schema와 일치 (필드명, nullable, enum 값)
- Integration-001 (critical): `list` 필드명, `nextCursor` nullable

### Group 002 — Navigation + Me Flow Foundations (app-001, app-002, app-003, app-004)

**핵심 검증 포인트:**

- **app-001 (Bottom tab)**:
  - Tab 3개만 존재(Home/Explore/Profile) — 기존 추가 탭 제거 여부 확인
  - 딥링크 `zzem://home`, `zzem://explore`, `zzem://profile` 전부 정상 랜딩
  - 기존 홈 스크린 리그레션 없음 (home-tabs.yaml, home-header-elements.yaml 기존 flow 통과)
  - Settings 진입은 프로필 탭의 톱니바퀴로만 (하단 탭 아님)
- **app-002 (Explore)**:
  - 기존 Home 추천 그리드 컴포넌트 재사용 (데드 코드 아닌 실제 import 확인)
  - 별도 쿼리 중복 구현 금지
- **app-003 (MY Profile 3-tab)**:
  - AC 2.1 기본 랜딩 로직:
    - 공개 > 0 → 공개 탭
    - 공개 = 0 AND 비공개 > 0 → 비공개 탭
    - 공개 = 0 AND 비공개 = 0 → 공개 탭 (빈 상태)
  - AC 2.7 post-generation redirect: 콘텐츠 생성 → MY 프로필 공개 탭으로 이동 (scope: 어느 생성 트리거인지 PRD 확인)
  - 프로필 편집/프로필 공유/톱니바퀴 버튼 **실제 navigate 연결** (completeness-001)
  - 좋아요 탭 빈 리스트 표시 (Phase 1)
  - counts가 실제 API 응답과 동기화 (react-query key 공유 또는 invalidate)
- **app-004 (Settings 7 menus)**:
  - 메뉴 순서 PRD 정확히 준수
  - 알림 설정 / 차단 관리 → ComingSoonScreen placeholder (임의 문구 금지, "준비 중"만)
  - 탈퇴하기/약관/개인정보/앱버전 기존 동작 유지 (settings-authenticated, settings-menu, settings-app-version, webview-routes 회귀 없음)

**공통:**
- `shared/routes/route.types.ts` 업데이트 시 모든 navigate 호출부 타입 에러 0
- `useNavigationLinking.ts`의 `zzem://` + `https://` prefixes 양쪽 등록 확인

### Group 003 — Profile Edit + Other User + Share + Swipe (app-005 ~ app-008)

**핵심 검증 포인트:**

- **app-005 (Profile edit)**:
  - 이미지 업로드 전체 체인: picker → (optional crop) → presigned PUT → fileUuid → PATCH
  - 닉네임 1자 / 21자 / 20자 / 2자 각 경계에서 저장 버튼 상태 정확
  - 성공 시 MY 프로필 react-query invalidate — 닉네임 변경이 프로필 헤더에 즉시 반영
  - `useUploadProfileImage` / mutation 훅 데드 코드 아닌 실제 호출 (completeness-002)
- **app-006 (Other user profile)**:
  - 딥링크 `zzem://profile/:userId` 정상 랜딩
  - 탭 1개만 노출 (게시물 공개). 비공개/좋아요 탭 **렌더되지 않음**
  - 더보기 메뉴 "프로필 URL 복사"만 (차단/신고 없음)
  - 404 유저 → 에러 상태 컴포넌트
  - 자신의 userId로 진입한 경우 동작 (본인 프로필로 리다이렉트 or 그냥 공개 뷰 — PRD 합의 필요, 기본은 공개 뷰 표시)
- **app-007 (Profile share)**:
  - `zzem://profile/{myUserId}` 문자열이 공유 메시지에 포함 (정확한 userId, 빈 문자열 금지)
  - image/file 파라미터 **미사용** (소스 코드 확인 — `useNativeShare` 호출 인자)
  - 시트 취소 시 에러 토스트 노출 없음
- **app-008 (Profile → SwipeFeed)**:
  - Source union 전 케이스:
    - `{kind: 'me', visibility: 'public'}` → `/v2/me/contents?visibility=public`
    - `{kind: 'me', visibility: 'private'}` → `/v2/me/contents?visibility=private`
    - `{kind: 'user', userId}` → `/v2/users/:userId/contents`
  - source 미전달 시 기존 추천 풀 fallback (completeness-003) — 기존 swipe-feed 동작 회귀 없음
  - `initialContentId`로 피드 초기 위치 정확
  - 커서 페이지네이션 재사용 — 재래핑/재구현 금지

**공통:**
- 모든 신규 훅/컴포넌트가 호출부 존재 (completeness-001/002)
- 기존 자산 최대 재활용 (`shared/hooks/useNativeShare.ts`, `shared/lib/image/image-library.ts`, `presentation/image/image-cropper.screen.tsx`)

## Active Evaluation Techniques

1. **Trace Execution** — Happy path가 아닌 edge를 따라가라
   - MY 탭 기본 랜딩: 공개 0, 비공개 3 → 비공개 탭으로 열리는지 실제 상태 기반 trace
   - SwipeFeed: source `{kind: 'me', visibility: 'private'}` → queryFn 실제 endpoint 문자열 확인

2. **Grep for Regressions** — 기존 홈/피드 경로에 `isPublished` 필터가 **유출되지 않았는지** grep

3. **Type Diff** — MyProfileResponse vs PublicProfileResponse 타입에서 `isPersona` 필드 존재/부재

4. **Deadhook Detection** — 신규 훅 이름을 import 문으로 grep — 호출부 0건이면 데드 훅

5. **E2E Flow Assertion** — `contracts/e2e-flow-plan.md`에 매핑된 flow가 실제 통과하는지 (Phase 4 그룹 스모크 게이트)
