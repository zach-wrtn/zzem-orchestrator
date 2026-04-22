# Group 002 Checkpoint — ugc-platform-001 (App Foundation)

> Group 003 은 본 파일을 우선 참조. 원본 contract/evaluation 은 이슈 재현 시에만 Read.

## Verdict

**PASS** (2026-04-22) — Evaluator Round 1 PASS with follow-ups + FE Fix Round 1 (Major 1/2 해소) + Sprint Lead 검증 완료.

## Scope

app-001 ~ app-004: Bottom tab navigation + Explore reuse + MY profile (3 tabs + landing rule) + Settings canonical 8 menus.

## Commits on `sprint/ugc-platform-001`

| SHA | Task | 내용 |
|-----|------|------|
| `fdbb6a25c` | app-001 | 하단 3탭 네비게이터 + 딥링크 (`zzem://home|explore|profile[/:userId]`) + testID (`home-tab`/`explore-tab`/`my-tab`) |
| `5444141ac` | app-002 | 탐색 탭 — 홈 추천 그리드 재사용 (`FilterChipsProvider` + `HomeBody`), headerBar "탐색" |
| `722ed9e01` | app-003 | MY 프로필 화면 + 3탭 (공개/비공개/좋아요) + 랜딩 규칙 + `profile.tab.*` testID + 생성후 routing 3 callsite (filter/custom-prompt/swipe-feed) |
| `71ea74a54` | app-004 | Settings canonical 8 메뉴 (계정/비밀번호/알림/차단/고객센터/약관/개인정보/탈퇴 + AppVersion) + ComingSoon placeholder |
| `5e1040d0f` | fix R1 | `generating-failed.screen.tsx:45` — `tag:"all"` → nested `screen:"HomeTab", params:{tag:"all"}` |
| `cdedaa8f2` | fix R1 | `screen-params.ts` — `withGlobalScreenConfig` 제네릭 `PathConfigMap<object>` 로 완화 |

6 commits total.

## 주요 결정 / 트랩 해결

| 항목 | 결정 |
|------|------|
| **Canonical labels** | 홈/탐색/MY (DRIFT-04). `root-tab-navigator.tsx:51,79,107` `tabBarLabel` + analytics `tab_name`. "프로필/둘러보기/생성" 어디에도 등장 금지. |
| **Count labels** | 팔로워/팔로잉/재생성된 (DRIFT-02). `profile-count-row.tsx:21-44`. |
| **Settings 8 메뉴** | 계정→비밀번호→알림→차단→고객센터→약관→개인정보→탈퇴 + 앱버전 (DRIFT-01 canonical). `settings-body.tsx:13-29`. 알림/차단/고객센터 3개는 `coming-soon-settings-section` 로 placeholder. |
| **ComingSoon copy** | 공통 `ComingSoonScreen` ("준비 중이에요" 고정) 재사용. 메뉴별 특화 copy 금지. |
| **MY profile landing 우선순위** | route param override > public>0 → public > private>0 → private > else public. `use-profile-landing-tab.ts:20-44`. counts API 실패 (undefined) → public fallback. |
| **생성 후 routing (AC 2.7)** | 3 callsite 모두 `landingTab` 전달: `filter-preview-footer.tsx:191` (public), `custom-prompt-footer.tsx:184` (private), `swipe-feed-footer.tsx:148` (public, 단일 이미지 필터 생성). Contract 는 2 callsite 만 명시했으나 3번째가 추가 발견되어 함께 처리. |
| **Profile content tap → SwipeFeed** | `profile-content-item.tsx:22` `navigation.navigate("SwipeFeed", { targetId, type:"content", entryPoint:"profile" })`. 신규 경로 금지, 기존 SwipeFeed 재사용. (Group 003 `profile-to-swipe-feed.yaml` precondition 충족) |
| **Korean count 포맷** | `korean-count.ts` `Math.floor(value/1000)/10` 기반 수동 구현, `Intl.NumberFormat` 금지 (contract 명시). 유닛 테스트 10/10 (0/999/1000/1234/8600/10000/12345/1억/-1/128). |
| **Deep link 인증** | `useNavigationLinking.ts:25-29` `AUTH_REQUIRED_PATHS = [..., "profile"]`. 비회원 `zzem://profile` → 로그인 리다이렉트. `zzem://profile/:userId` 는 오픈. |
| **Home header gear 유지** | Minor follow-up — dual entry. Sprint Lead 의도적 유지 판단. 정리 필요 시 별도 스프린트. |

## KB Clauses 검증 결과

- **completeness-001** (critical): 모든 진입점 실제 라우팅 존재. 0 unreachable. **PASS**.
- **completeness-002** (major): `useGetMyProfile/MyContentsCounts/MyContents` UseCase 모두 실 사용. 미사용 export 0. **PASS**.
- **completeness-003** (major): `landingTab` 3 callsite + Home nested callsite (`generating-failed`) 모두 정렬. **PASS (post-fix Round 1)**.
- **code_quality-001** (major): `domain/*` react-query 관습 +2 파일 (기존 22). "확대하지 않는 선" 엄격 해석 시 minor expansion — codebase convention 내 허용 판단. **aspirational minor**.
- **integration-001** (critical): BE 필드 (`list`, `nextCursor`, `profileImageUrl`, `regeneratedCount`, `isPersona`, `followerCount`, `followingCount`) FE 타입과 1:1. rename 0. **PASS**.

## 유닛 테스트 & Maestro

| 파일 | 결과 |
|------|------|
| `korean-count.test.ts` | 10/10 PASS |
| `bottom-tab-nav.yaml` | YAML valid, testID 매칭 |
| `explore-tab.yaml` | YAML valid, testID 매칭 |
| `my-profile-default-landing.yaml` | YAML valid, 로그인 + profile.tab.public 진입 검증 |
| `settings-menu-full.yaml` | YAML valid, 8 메뉴 + 3 placeholder assertVisible |
| `home-to-settings.yaml` | MY 탭 경유로 업데이트 (option b 반영) |

## Typecheck

- 타겟 2 regressions 제거 (`generating-failed.screen.tsx:45`, `screen-params.ts:45`) → 0 hit.
- 전체 `yarn workspace MemeApp typescript` → pre-existing `@wrtn/*` 캐스케이드 + `filter-list::imp_id` 이벤트 스펙 + `theme: any` inference 만 잔존. 본 스프린트 신규 에러 0.

## Pressure 현황

- Total fix iterations: 1 (FE Round 1).
- 소진된 fix loop budget: 1/2. Round 2 여유 있음.
- Pressure 레벨: 🟡 Caution (fix loop 1회 진입 → 해소 후 회복).

## Group 003 진입 준비

- **블록 해소**: app-001~004 완료. Profile grid → SwipeFeed 경로 존재 (app-005 precondition). SwipeFeed route param (`targetId`, `type`, `entryPoint`) 관례 확인됨.
- **브랜치**: `sprint/ugc-platform-001` 에 app-001~004 + fix R1 총 6 commits 대기.
- **다음 그룹 주의사항**:
  - app-005 (Settings 계정/비밀번호/탈퇴): `settings-body.tsx` 섹션 구조 재사용. ComingSoon placeholder 3개는 Phase 2 에서 교체 대상.
  - app-006 (Other User Profile): `useNavigationLinking.ts::AUTH_REQUIRED_PATHS` 는 `profile` (own) 만 포함, `profile/:userId` 는 오픈 — 404/비공개 처리 주의.
  - app-007 (프로필 수정): nickname `@Length(2,20)` (BE 확정) — 실시간 글자수 카운터 필요.
  - app-008 (기타): FE 측 limit ≤100 clamp (BE 400 방지).
- **다음 액션**: Group 003 (app-005/006/007/008) 계약 드래프트 → Evaluator 검토 → 구현 → 평가 루프.
