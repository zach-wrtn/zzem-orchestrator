# E2E Flow Plan — ugc-platform-003

> Maestro 제약 재확인: Fabric+RNGH tap 미발화 → 네비게이션은 딥링크 우선. CTA 탭→결과 중요한 경우 assertVisible 까지만, 실제 탭 후 결과는 Evaluator 코드 트레이스에 위임.

## AC Coverage

| AC | 분류 | Flow 파일 | 관련 태스크 | 비고 |
|----|------|----------|------------|------|
| **US6 팔로우** |  |  |  |  |
| AC 6.1 팔로우 상태 3종 | New | `follow-button-tap.yaml` | app-001 | deeplink zzem://profile/{seedUserId} → FollowButton assertVisible → tap → "팔로잉" assertVisible |
| AC 6.2 내 프로필 팔로워/팔로잉 리스트 | New | `my-profile-follower-list.yaml`, `my-profile-following-list.yaml` | app-002 | zzem://follower-list / following-list 딥링크 진입 후 seed nickname assertVisible |
| AC 6.2 타 유저 프로필 숫자만 | Extend | 기존 `other-user-profile.yaml` | app-002 | 숫자 탭 시 무동작 assert (변경 없음 검증) |
| AC 6.3 피드 추천 부스트 | Deferred | — | — | `server-injection-required` — 추천 가중치 로직은 PA 팀 소관, 별도 전달. BE integration test 으로 대체 |
| **US7 차단/신고** |  |  |  |  |
| AC 7.2 차단 양방향 + 팔로우 해제 | New | `other-user-profile-block.yaml` | app-003 | 타 유저 프로필 → MoreSheet → 차단 → 바텀시트 → 차단 후 BlockedProfileState assertVisible |
| AC 7.2 차단 프로필 UX | Covered by above | (포함) | app-003 | "이 계정을 차단했어요" assertVisible |
| AC 7.3 신고 자유 텍스트 100자 | New | `swipe-feed-content-report.yaml` | app-005 | SwipeFeed more → 신고 → TextInput → 신고하기 → Toast |
| AC 7.4 신고 후 피드 필터 ~1h | Deferred | — | be-003 | `time-warp` — 1h 지연 은 FE 즉시 invalidation + BE integration test 로 대체 |
| AC 7.5 페르소나 알림/페이백 제외 | Deferred | — | be-004, be-007 | `BE-only` — 시드 페르소나 유저 생성 + listener 유닛 테스트 |
| AC 7.6 차단 관리 화면 + 차단 해제 | New | `settings-block-management.yaml` | app-004 | zzem://settings → 차단 관리 → 리스트 → 해제 → Toast |
| **US5 알림/푸시** |  |  |  |  |
| AC 5.1 카테고리 + 디폴트 ON + 페르소나 제외 | Deferred | — | be-004, be-007 | `BE-only` — 설정 default + listener persona-skip 유닛 테스트 |
| AC 5.2 팔로우 알림 | Covered by follow-button-tap + BE test | — | be-004 | follow 생성 → Notification persist + push emit BE integration test |
| AC 5.3 알림센터 진입 + red dot + 일괄 읽음 | New | `home-to-notification-center.yaml` | app-006 | zzem://notifications 딥링크 진입 → "알림" + seed notification title assertVisible |
| AC 5.3 빈 상태 | Extend | `home-to-notification-center.yaml` | app-006 | 시드 없는 user context 로 진입 시 "아직 도착한 알림이 없어요" assertVisible (별도 variant 플로우 또는 same file 내 branching 불가 → 별도 `notification-center-empty.yaml` 고려) |
| AC 5.3 푸시 권한 배너 | Deferred | — | app-006 | `native-dialog` — FCM permission 상태 모킹은 Maestro 한계. 수동 QA |
| AC 5.4 푸시 템플릿 3종 | Deferred | — | app-008, be-006 | `native-dialog` + `server-injection-required`. BE integration test (payload shape) + 수동 QA (실제 device 수신) |
| AC 5.5 알림 설정 4 토글 | New | `settings-notification-settings.yaml` | app-007 | zzem://notification-settings 딥링크 → 4 토글 라벨 assertVisible (tap 결과는 Evaluator 코드 트레이스) |
| AC 5.5 pushAll OFF 시 하위 disabled | Deferred | — | app-007 | assertVisible 로 disabled 시각 상태 확인 어려움. Evaluator 코드 트레이스 + unit test |

## 신규 Flow 목록 (9개)

1. `follow-button-tap.yaml` — app-001
2. `my-profile-follower-list.yaml` — app-002
3. `my-profile-following-list.yaml` — app-002
4. `other-user-profile-block.yaml` — app-003
5. `settings-block-management.yaml` — app-004
6. `swipe-feed-content-report.yaml` — app-005
7. `home-to-notification-center.yaml` — app-006
8. `notification-center-empty.yaml` — app-006 (optional — empty state variant)
9. `settings-notification-settings.yaml` — app-007

## Extend 대상

- `other-user-profile.yaml` — 타 유저 프로필에서 팔로워/팔로잉 숫자 탭 무동작 검증 (변경 없음 regression).

## Deeplink 경로

신규 zzem:// 경로 선언 (app 태스크에서 wiring):
- `zzem://follower-list` (app-002)
- `zzem://following-list` (app-002)
- `zzem://block-management` (app-004)
- `zzem://notifications` (app-006)
- `zzem://notification-settings` (app-007)
- 기존: `zzem://profile/{userId}`, `zzem://contents/{contentId}`, `zzem://settings`, `zzem://credit-history`, `zzem://home`

AUTH_REQUIRED_PATHS 추가 대상: `follower-list`, `following-list`, `block-management`, `notifications`, `notification-settings`.

## Maestro 제약 및 CTA 타협

- Switch (알림 설정 토글) tap 후 결과 → assertVisible 로 렌더 검증만. Toggle 상태 전환은 Evaluator 코드 트레이스.
- Bottom sheet 내 Primary button tap 후 Toast → assertVisible Toast 가 렌더되지 않는 경우 (Sheet 닫힘 즉시 사라짐) → 대안 step 으로 sheet close 후 화면 전환 assertVisible.
- Follow button 3-state 표시는 text content assert (`assertVisible: "팔로잉"`).

## 누적 flow 총계

- 기존 (Phase 1 + 2): 있음 (profile, settings, swipe-feed 등)
- 신규 (Phase 3): 9개 (optional 1 포함)
- Extend: 1개

Evaluator Round 1 에서 각 flow 파일의 appId + deeplink + assertVisible 구조 반드시 검증.
