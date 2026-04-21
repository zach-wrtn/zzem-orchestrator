# E2E Flow Plan — Sprint ugc-platform-001

> Phase 2 산출물. AC ↔ Maestro flow 매핑. Phase 4 그룹 스모크 게이트 + Phase 5 풀스위트 회귀 게이트 근거.
> 기존 22 flow는 `app/apps/MemeApp/e2e/flows/`에 위치.

## 분류 규칙

| 분류 | 의미 |
|------|------|
| **Covered** | 기존 flow로 이미 검증됨 — 회귀만 감시 |
| **Extend** | 기존 flow 확장 (step/assert 추가) |
| **New** | 신규 flow 작성 필수 |
| **Deferred** | Maestro로 자동화 불가 — Manual QA 또는 Evaluator 코드 추적으로 대체 |

## 기존 22 Flows (Baseline — 회귀 금지)

```
credit-history.yaml, credit-paywall.yaml, custom-prompt-preview.yaml,
deeplink-smoke.yaml, feedback-form.yaml, filter-preview.yaml,
guest-credit-redirect.yaml, home-header-elements.yaml, home-tabs.yaml,
home-to-settings.yaml, login-entry-point.yaml, meme-collection-empty.yaml,
meme-collection.yaml, meme-viewer-actions.yaml, meme-viewer-direct.yaml,
meme-viewer.yaml, settings-app-version.yaml, settings-authenticated.yaml,
settings-menu.yaml, smoke-test.yaml, swipe-feed.yaml, webview-routes.yaml
```

## AC 매핑

### PRD 1 — 기본 탐색 & 홈

| AC | 요약 | 분류 | Flow | 비고 |
|----|------|------|------|------|
| 1.1 | 하단 탭 3개(홈/둘러보기/프로필) | **New** | `bottom-tab-nav.yaml` | tapOn 기반 탐색 + 각 탭 타이틀 assertVisible |
| 1.2 | 기존 홈 스크린 유지 | **Covered** | `home-tabs.yaml`, `home-header-elements.yaml` | 회귀 감시 |
| 1.3 | 홈에서 추천 콘텐츠 생성/진입 | **Covered** | `smoke-test.yaml`, `swipe-feed.yaml` | 기존 경로 보존 |
| 1.4 | 둘러보기 탭 → 추천 그리드 | **New** | `explore-tab.yaml` | Home 그리드와 동일 item 등장 assert |

### PRD 2 — 프로필

| AC | 요약 | 분류 | Flow | 비고 |
|----|------|------|------|------|
| 2.1 | MY 프로필 3탭 기본 랜딩 로직 | **New** | `my-profile-default-landing.yaml` | seed: 공개 1+, 비공개 0 → 공개 탭; 공개 0, 비공개 1+ → 비공개 탭. 2 시나리오 flow 분기 |
| 2.2 | 3탭 (공개/비공개/좋아요) 노출 | **New** | `my-profile-default-landing.yaml` 확장 또는 `my-profile-tabs.yaml` | 3 탭 헤더 전부 assertVisible |
| 2.3 | 프로필 공유 → OS 공유 시트 | **Deferred** | — | native sheet 자동화 불가. buildProfileShareUrl 유닛 + 수동 QA |
| 2.4 | 프로필 편집 (이미지/닉네임) | **New** | `profile-edit.yaml` | openLink `zzem://profile/edit` → 닉네임 inputText + 저장 assertVisible. 업로드 성공은 Evaluator 코드 추적 |
| 2.5 | 공개/비공개 탭 → 세로 스와이프 피드 | **New** | `profile-to-swipe-feed.yaml` | 공개 탭 첫 아이템 tap → SwipeFeed 첫 아이템 콘텐츠 id 일치 assert |
| 2.6 | 기존 SwipeFeed 동작 회귀 없음 | **Covered** | `swipe-feed.yaml` | 기존 flow에서 source 파라미터 미전달 경로 통과 |
| 2.7 | 콘텐츠 생성 완료 → MY 공개 탭 | **Deferred** | — | 콘텐츠 생성은 실 API 호출/결과 대기 → Evaluator 코드 추적 |
| 2.8 | 설정 메뉴 7개 + 앱버전 | **New** | `settings-menu-full.yaml` | 7개 row assertVisible. 기존 `settings-menu.yaml`과 별도 유지 (기존은 축약형) |

### PRD 7 — 타유저 프로필

| AC | 요약 | 분류 | Flow | 비고 |
|----|------|------|------|------|
| 7.1 | 타유저 프로필 (게시물 공개 탭만) | **New** | `other-user-profile.yaml` | seed userId deeplink `zzem://profile/:userId` → 탭 1개 + 그리드 아이템 assertVisible |
| 7.2 | 프로필 URL 복사 액션 | **Extend** | `other-user-profile.yaml` | 더보기 → 복사 tap → 토스트 assertVisible (실제 clipboard 확인은 Evaluator 코드 추적) |
| 7.3 | 타유저 그리드 → 스와이프 피드 | **New** | `profile-to-swipe-feed.yaml` 확장 또는 `other-user-to-swipe-feed.yaml` | `{kind: 'user', userId}` source 검증 |
| 7.4 | 존재하지 않는 userId → 에러 상태 | **Deferred** | — | 404 응답 시나리오는 seed 불가. Evaluator 코드 추적 |

### Placeholder / Phase 3 대기

| AC | 요약 | 분류 | Flow | 비고 |
|----|------|------|------|------|
| 알림 설정 진입 | 준비 중 placeholder | **Extend** | `settings-menu-full.yaml` | placeholder 화면 assertVisible |
| 차단 관리 진입 | 준비 중 placeholder | **Extend** | `settings-menu-full.yaml` | placeholder 화면 assertVisible |

## 신규 Flow 목록 (우선순위 순)

1. **`bottom-tab-nav.yaml`** — 하단 3탭 전환 (group-002 스모크)
2. **`my-profile-default-landing.yaml`** — 기본 랜딩 로직 (group-002 핵심)
3. **`settings-menu-full.yaml`** — 7개 메뉴 + placeholder (group-002)
4. **`explore-tab.yaml`** — 추천 그리드 재사용 (group-002)
5. **`profile-edit.yaml`** — 편집 화면 진입 + 저장 CTA (group-003)
6. **`other-user-profile.yaml`** — 타유저 공개 프로필 (group-003)
7. **`profile-to-swipe-feed.yaml`** — 프로필→피드 source 전달 (group-003, 최종 스모크)

## 그룹 스모크 게이트 매핑

- **Group 001 (Backend)**: E2E 게이트 없음. Evaluator 코드 추적 + 계약 diff만.
- **Group 002**: `bottom-tab-nav.yaml`, `my-profile-default-landing.yaml`, `settings-menu-full.yaml`, `explore-tab.yaml` 4종 전부 PASS.
- **Group 003**: `profile-edit.yaml`, `other-user-profile.yaml`, `profile-to-swipe-feed.yaml` 3종 전부 PASS + Group 002 회귀 0.

## Phase 5 풀스위트 회귀 게이트

- 기존 22 flow + 신규 7 flow = **29 flow** 전부 PASS 시에만 PR 병합 허용
- iOS 기본. Android는 로드맵 (Phase 6 retrospective에서 decide)

## 자동화 타협 (Deferred 처리 근거)

| Deferred | 이유 | 대체 검증 |
|----------|------|-----------|
| OS 공유 시트 | Maestro가 native sheet 조작 불가 | `buildProfileShareUrl(userId)` 유닛 + 수동 QA 1회 |
| 콘텐츠 생성 후 리다이렉트 | 실제 생성은 외부 서비스 의존 | Evaluator가 navigation reset/replace 호출 확인 |
| 404 유저 에러 상태 | 에러 seed 주입 불가 | Evaluator가 404 핸들링 코드 확인 (mock test or try/catch) |
| clipboard 실제 값 | iOS clipboard API 비노출 | 더보기 tap → 토스트까지만 flow. 실제 값은 Evaluator 코드 추적 |
| Presigned URL 업로드 완료 | S3 PUT 응답 재현 불가 | Unit: mutation 훅 호출 인자 검증 |

## Seed 의존성

신규 flow는 대부분 `zzem://e2e-auth?...` + seed API 토큰에 의존. 상세는 `e2e-seed-plan.md` 참조.
