# APP-008 — Deep Link Routes for Preview

## Target
- `apps/MemeApp/src/shared/routes/meme-routes.ts` (또는 동등 디렉토리의 라우팅 정의 파일)
- e2e flow가 사용할 수 있도록 zzem:// 스킴에 신규 화면 등록 (Maestro 제약상 딥링크 우선 — `feedback_e2e_maestro` 참조).

## Context
PreviewLoadingScreen, PreviewResultScreen은 신규 화면. e2e를 위해 딥링크 경로 필요.

## Objective
신규 화면 두 개에 대한 deep link 경로를 등록한다.

## Specification

### Routes
| Screen | Path | Params |
|---|---|---|
| PreviewLoadingScreen | `zzem://preview/loading` | `contentId`, `parentFilterId` |
| PreviewResultScreen | `zzem://preview/result` | `contentId` |

### Behavior
- 외부에서 진입 시 인증 체크 후 해당 screen으로 navigate.replace.
- 인증 없으면 Splash → 로그인 → resume.

### TestIDs (이미 APP-003/004에 정의됨 — 본 태스크는 라우터 코드만)

## Acceptance Criteria
- [ ] zzem://preview/loading?contentId=...&parentFilterId=... 호출 → PreviewLoadingScreen 진입.
- [ ] zzem://preview/result?contentId=... 호출 → PreviewResultScreen 진입.
- [ ] 비인증 시 Splash → 로그인 → 정상 진입.
- [ ] e2e flows에서 `launchApp`/`openLink`로 진입 가능.
