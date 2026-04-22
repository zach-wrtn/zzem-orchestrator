# UGC Platform Phase 2 — 피드 인터랙션 & 페이백

## 선행 스프린트

- **Sprint**: [ugc-platform-001](../ugc-platform-001/) (프로필 & 네비게이션)
- **Coverage**: 15/17 AC fulfilled (+ 2 partially_fulfilled: AC-2.3 공유, AC-7.4 404)
- **Gap Analysis**: [retrospective/gap-analysis.yaml](../ugc-platform-001/retrospective/gap-analysis.yaml)
- **Pattern Digest**: [retrospective/pattern-digest.yaml](../ugc-platform-001/retrospective/pattern-digest.yaml)
- **Deferred Items**: [retrospective/deferred-items.yaml](../ugc-platform-001/retrospective/deferred-items.yaml)

## 원본 PRD

- **Notion**: [AI UGC Platform 2 — 피드 인터랙션 & 페이백](https://www.notion.so/AI-UGC-Platform-2-33b0159c6b5981c481b5f75110a04872)
- **KB Mirror**: `~/.zzem/kb/products/ugc-platform/phase-2-feed-payback/prd.md`
- **Notion ID**: `33b0159c-6b59-81c4-81b5-f75110a04872`
- **Figma**: https://www.figma.com/design/7hozJ6Pvs09q98BxvChj08/Wrtn-X_%EC%A8%88_Sprint-File?node-id=37160-51671

## 스코프 요약

세로 스와이프 피드의 모든 인터랙션 + 크레딧 페이백 시스템 구축. Phase 1 프로필/네비게이션 골격 위에서 피드 상세 인터랙션을 채운다.

### 구현 범위 (원본 PRD 기준)

**US1 — 피드 공개 (8 AC)**
- AC 1.1: 공개 기본 정책 (자동 공개, 업데이트 전 콘텐츠는 비공개 유지, 워터마크 없음)
- AC 1.2: 페이백 조건 (1%, sourceContentId 추적, 직전 1단계만)
- AC 1.3: 비공개 전환 (확인 바텀시트)
- AC 1.4: 커스텀 프롬프트 결과물 (공개 불가)
- AC 1.5: CTA 분기 (템플릿 사용하기 / 다시 생성하기)
- AC 1.6: 재생성 플로우 (MIXED 예외, 삭제된 필터 에러 모달)
- AC 1.7: 액션 바 + 더보기 메뉴 (좋아요/재생성/공유/더보기, 소유자 분기)
- AC 1.8: 게시 토글

**US3 — 좋아요 (3 AC)**
- AC 3.1: 셀프 좋아요 허용
- AC 3.2: 좋아요 탭 (최신순, 경로 통합)
- AC 3.3: 좋아요 표시 (실제 숫자, 추천 시그널)

**US4 — 크레딧 페이백 (4 AC)**
- AC 4.1: 페이백 조건 (Phase 1 MVP: 1% 무조건, 페르소나 제외)
- AC 4.2: 크레딧 히스토리 (썸네일 + "크레딧 페이백" 타이틀)
- AC 4.3: 세부 정책 (프로모션 크레딧, 올림, Config 조정)
- AC 4.4: 최초 진입 UX (1회성 안내 모달)

### Spec-out (원본 PRD 명시)

- 댓글 기능
- 공유 횟수 노출
- 수익화/광고 로직
- 콘텐츠 모더레이션
- 신고하기 (Phase 3 소관)
- 팔로우/알림 (Phase 3 소관)

## 이월 항목 (Deferred from ugc-platform-001)

Phase 1 에서 partially_fulfilled 또는 미충족 처리된 항목을 본 스프린트에서 마무리한다.

### 재검증 대상 — technical_limit (medium priority)
- **AC-2.3** 프로필 공유 native 시트 — Phase 5 PR 전 수동 QA (iOS+Android)
- **AC-7.4** 404 에러 화면 — Phase 5 PR 전 수동 QA (임의 userId 딥링크)

### UX 보정 — follow-up scope (low~medium priority)
- **MINOR-G2-1** Home header gear 제거 + `home-to-settings` flow MY 경유 전환 (PRD 재확인)
- **MINOR-G2-2** `profile.screen.tsx::useEffect([landingTab])` race — 1회 sync 플래그
- **MINOR-G3-3** Clipboard 모듈 교체 (`@react-native-clipboard/clipboard`)
- **MINOR-G3-4** SwipeFeed initialContentId fallback UX

### 별도 스프린트 이관 (본 스프린트 scope 아님)
- **MINOR-G2-3** Domain 레이어 react-query import (Clean Architecture refactor 전용)

## Regression Guard

Phase 1 에서 fulfilled 된 15 AC 는 본 스프린트 작업으로 깨지지 않아야 한다:

- [ ] AC-1.1 ~ AC-1.4 (탭바, 홈, 탐색)
- [ ] AC-2.1 ~ AC-2.8 (MY 프로필 3탭, 편집, 공유, 스와이프, 닉네임 자동생성, 라우팅, 설정)
- [ ] AC-7.1 ~ AC-7.5 (타유저 프로필, URL 복사, 스와이프, 페르소나 플래그)
- [ ] `korean-count.ts` 포맷 유지 (좋아요는 축약 없음 — 본 스프린트 AC 3.3 규약)
- [ ] `SwipeFeed` discriminated union — 새 variant 추가 시 legacy callsite 무회귀

## 시스템 개선 (Pattern Digest 기반)

Phase 1 retrospective 에서 도출된 systemic fix 를 본 스프린트 Sprint Contract / Evaluator V-method 에 반영한다:

1. Cursor 쿼리 `$lte` 의무 — `rg '_id:\s*\{\s*\$lt\s*:' repository/` → 0 hit
2. 신규 e2e-spec 추가 시 nx project.json test-e2e target + moduleNameMapper 검증
3. FE typecheck 는 `grep -v '@wrtn/'` clean 측정 의무
4. Discriminated union / parent-dependent query 는 `enabled` 가드 필수
5. Navigate payload 의 parent context 의존 → prop threading Done Criterion 명시
6. Deferred AC (native sheet / 404) 는 Phase 5 PR 전 수동 QA 필수
