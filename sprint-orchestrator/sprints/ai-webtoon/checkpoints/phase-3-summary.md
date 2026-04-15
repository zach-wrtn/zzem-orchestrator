# Phase 3 Checkpoint: ai-webtoon

## Prototypes Delivered

| Task | HTML | Screen Spec | 프레임 수 | 승인 |
|------|------|-------------|---------|------|
| app-001 | prototypes/app/app-001/prototype.html | screen-spec.md | 5 | ✅ |
| app-002 | prototypes/app/app-002/prototype.html | screen-spec.md | **12** (로딩 단일화 후) | ✅ |
| app-003 | prototypes/app/app-003/prototype.html | SeriesDetail + ManualContinueInput .spec.md | 6+5 상태 | ✅ |

공통: `prototypes/context/context-engine.yaml` (3개 task scope 머지), `prototypes/context/tokens.css`

## Figma Mapping

- 루트 프레임: node `37289:168285` (file `7hozJ6Pvs09q98BxvChj08`)
- 매핑 결과: **27개 screen row 중 21개 매칭**, 6개 dev-pattern
- 파일: `prototypes/figma-mapping.yaml`
- 캐시된 메타데이터 덤프의 stale "사진 2개" 프레임은 실제 Figma에서 삭제된 상태 — 매핑에서 제거

## PRD ↔ Figma 불일치 해결 (총 8건)

> `prototypes/conflicts-resolved.md` 참고.

| # | 항목 | 해결 |
|---|------|------|
| 1 | 로딩 1/2단계 UI 분리 | **figma-wins** → 단일 `WebtoonGeneratingScreen` |
| 2 | SeriesDetailScreen 네이밍 | **prd-wins** → 엔지니어링 네이밍 유지 |
| 3 | 웹툰 탭 빈 상태 | dev-pattern (component-patterns) |
| 4 | 서버 에러 UI (AC 2.3.7) | dev-pattern (Toast 재사용) |
| 5 | Timeout UI (AC 2.3.8) | dev-pattern (공통_바텀시트) |
| 6 | 동시성 제한 (BR-3) | dev-pattern (공통_바텀시트) |
| 7 | InlineEpisodeError (회차별 실패) | dev-pattern (공통 에러 블록 인라인) |
| 8 | NO_REFERENCE_EPISODE 시트 | dev-pattern (공통_바텀시트) |

## Phase 4 Build 전달 사항 (Frozen Snapshot)

**엔지니어/평가자에게 인라인 제공할 문서**:
1. `prototypes/conflicts-resolved.md` — Build 시 이 결정을 준수해야 함
2. `prototypes/figma-mapping.yaml` — 매칭된 Figma URL을 시각 레퍼런스로 제공
3. `prototypes/app/app-{N}/prototype.html` — 최종 승인 프로토타입
4. `prototypes/app/app-{N}/screen-spec.md` — 구조화된 스펙
5. `contracts/api-contract.yaml` — API SSOT (그룹 범위만)

## 주요 판단 (Phase 4에서 유지해야 함)

1. **로딩은 단일 UI**. BE 파이프라인의 업로드/AI 생성은 내부 단계, UI는 하나의 폴링 화면.
2. **크레딧 차감 타이밍**: Polling COMPLETED 시점 1회만 (BR-2).
3. **유해 이미지 수렴**: sync 422 + async PROHIBITED → 같은 `ProhibitedImageSheet`.
4. **이어가기 사진 미필수**: BR-12. Manual continue에는 photo slot 없음.
5. **Deep link 모두 홈 fallback 필수**: C8 lesson.

## Gate 체크

- ✓ 3개 app task 모두 프로토타입 생성 + 승인
- ✓ figma-mapping.yaml 존재 (매핑 21/27, 6건은 근거 있는 dev-pattern)
- ✓ 불일치 8건 전부 해결 (conflicts-resolved.md)
- ✓ approval-status.yaml 존재
- ✓ context-engine.yaml 3 task scope 머지
- ✓ 모든 프로토타입이 프레임별로 AC 참조 명시

## Ready: Phase 4 Build

그룹 진행 순서: 001 → 002 → 003 (각 그룹 내 BE + FE 병렬, 그룹 간 순차)
