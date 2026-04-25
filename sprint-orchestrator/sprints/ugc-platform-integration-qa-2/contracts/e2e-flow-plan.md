# E2E Flow Plan — ugc-platform-integration-qa-2

> **v2 dogfood sprint — e2e flow 작성은 Phase 3 prototype dogfood 결과를 보고
> 별 sprint 에서 처리. 모든 AC 를 `Deferred` (reason: `prototype-only-sprint`)
> 로 분류한다.**

본 스프린트는 v2.1 prototype pipeline (Pass 6 / Preview Gate / Asset / Persona /
Variants / Exemplars) 의 첫 라이브 dogfood 가 1차 목적이며, 산출물은 23개
prototype.html 과 quality-report 다. 실 코드 (RN screen) 와 Maestro flow 는
별도 후속 스프린트에서 prototype 결과를 baseline 삼아 작성한다.

## AC Coverage Table

| AC ID | 설명 (요약) | 분류 | Reason | 후속 스프린트 |
|-------|------------|------|--------|--------------|
| AC-1.1 | 프로필편집 진입 → 닉네임/사진 변경 | Deferred | prototype-only-sprint | TBD |
| AC-1.2 | 닉네임 변경: 키보드 → validation → 저장 → 결과 | Deferred | prototype-only-sprint | TBD |
| AC-1.3 | 사진 변경: 라이브러리/삭제/크롭/저장 | Deferred | prototype-only-sprint | TBD |
| AC-1.4 | 변경 중 뒤로가기 → 나가기 confirm modal | Deferred | prototype-only-sprint | TBD |
| AC-1.5 | 변경 완료 시 MY 프로필 즉시 반영 | Deferred | prototype-only-sprint | TBD |
| AC-2.1 | 타유저 더보기 → 차단 → confirm → 적용 | Deferred | prototype-only-sprint | TBD |
| AC-2.2 | 차단 사용자 프로필 진입 시 콘텐츠 숨김 + 상태 표시 | Deferred | prototype-only-sprint | TBD |
| AC-2.3 | 차단 해제 → 프로필 복원 | Deferred | prototype-only-sprint | TBD |
| AC-2.4 | 설정 → 차단관리 리스트 → 일괄 해제 | Deferred | prototype-only-sprint | TBD |
| AC-2.5 | 차단/해제 시 toast 또는 confirm 1 step | Deferred | prototype-only-sprint | TBD |
| AC-3.1 | 알림센터 진입 → 미읽음 강조 + 시간순 | Deferred | prototype-only-sprint | TBD |
| AC-3.2 | 알림 0건 시 empty_state 화면 + CTA | Deferred | prototype-only-sprint | TBD |
| AC-3.3 | 알림 설정 4 카테고리 개별 토글 | Deferred | prototype-only-sprint | TBD |
| AC-3.4 | 토글 변경 즉시 저장 (별도 저장 버튼 없음) | Deferred | prototype-only-sprint | TBD |

## 대체 검증 수단

본 스프린트 한정 — 모든 AC 는 다음 수단으로 대체 검증한다.

1. **Phase 3 prototype.html** 의 시각적 + 인터랙션 reproduction (verify-prototype + Pass 6 audit).
2. **quality-report.{Screen}.yaml** 의 fabrication_risk + persona compliance 점수.
3. Sprint Lead 의 manual screenshot review (prototype gallery 인덱스).

실 RN 빌드 / Maestro 실행 은 본 스프린트 scope 가 아니다.

## 후속 e2e 스프린트 (가이드)

prototype 산출 종료 후, Sprint Lead 가 다음 항목을 결정하여 별 sprint kick-off:

- 어떤 화면이 e2e 가치 있는지 (CTA → result 플로우 우선).
- 신규 zzem:// 딥링크 경로 등록 필요 여부 (예: `zzem://profile/edit`,
  `zzem://settings/blocked-users`, `zzem://settings/notifications`).
- Maestro Fabric+RNGH tap 미발화 회피 — 딥링크 우선 경로 정의.
- BE 의존 (Mock → 실 API) 결정 후 e2e seed plan 작성.
