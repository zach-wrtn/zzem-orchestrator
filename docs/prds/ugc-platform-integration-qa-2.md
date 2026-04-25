---
prd_id: ugc-platform-integration-qa-2
title: "UGC Platform — 통합 QA 2차 (카메라 / 차단 / 알림)"
type: feature_addition + qa
start: 2026-04-25
predecessor: ugc-platform-integration-qa
status: draft
---

# PRD: UGC Platform Integration QA 2차

**Sprint ID**: `ugc-platform-integration-qa-2`
**Canonical PRD**: `docs/prds/ugc-platform-integration-qa-2.md` ← **SSOT**
**Figma Source**: `https://www.figma.com/design/7hozJ6Pvs09q98BxvChj08/Wrtn-X_쨈_Sprint-File`
**Predecessor**: `ugc-platform-integration-qa` (1차 — manual QA carryover 종결)

## 성격

**1차 QA + 신규 feature 3종**. 1차의 "기능 추가 금지" 와 달리 본 스프린트는 **신규 화면 23개** 산출 + 기능 동작 + QA 통합. 동시에 v2 prototype pipeline (PR #29-#36) 의 첫 라이브 dogfood — Pass 6 anti-slop / Assumption Preview / archetype persona / variants mode / curated exemplars 모두 실측.

## 선행 스프린트

- `ugc-platform-001` (merged #794/#555) — 프로필 & 네비게이션
- `ugc-platform-002` (merged #799/#562) — 피드 인터랙션 & 페이백
- `ugc-platform-003` (merged #804/#563) — 소셜 & 알림
- `ugc-platform-integration-qa` (1차) — manual QA carryover 종결

## v2 Pipeline Dogfood Scope

본 스프린트는 v2.1 파이프라인의 첫 실 운영. 각 feature 가 노출하는 v2 메커니즘:

| v2 메커니즘 | 노출 feature | 첫 실측 포인트 |
|------------|------------|--------------|
| Pass 6 Anti-Slop Audit (10 checks) | 3 features 모두 | 23 화면 모두 audit pass 필수 |
| Assumption Preview Gate §3.2.5 | 카메라 (사진 크롭/앨범 선택 추론 필요) | gate adjust loop 첫 운영 |
| Asset Layer §A.5 | 카메라 (avatar / 썸네일) | needs_real_content 첫 실측 |
| Archetype Persona | 3 features × 5 archetypes 노출 | form / modal / feed / detail / empty_state |
| Variants Mode | fabrication_risk: medium 화면 (TBD) | 3-way DE spawn 첫 가동 가능 |
| Curated Exemplars (feed) | block 차단관리_리스트 + notification 알림센터_기본 | 첫 exemplar 인라인 검증 |
| Eval Harness (CI) | DE/phase-prototype 변경 자동 감지 (별 secret 등록 후) | (선결) |

---

## Group Plan

각 Group 은 v2 파이프라인의 archetype 다양성 노출 + AC fulfillment 기준으로 구성.

### Group 001 — 카메라 / 프로필 사진 편집 (11 screens)

**Page**: Figma `37160:25098` (UGC Platform 1 - 프로필 & 네비게이션)
**Priority**: P0
**Repo**: app
**Archetype mix**: form × 6 + modal × 3 + detail × 2

| 화면 ID | Figma frame | Archetype | Notes |
|---------|------------|-----------|-------|
| `app-001` | 37160:79939 `프로필편집_메인` | form | 진입 화면 |
| `app-002` | 37160:79954 `프로필편집_닉네임_저장가능` | form | 활성 상태 |
| `app-003` | 37160:79969 `프로필편집_닉네임_바텀시트_나가기확인` | modal | confirm dialog |
| `app-004` | 37160:80000 `프로필편집_닉네임_키보드` | form | 입력 활성 |
| `app-005` | 37160:80034 `프로필편집_사진_바텀시트_선택` | modal | 라이브러리/삭제 시트 |
| `app-006` | 37160:80066 `프로필편집_사진_저장가능` | form | 활성 상태 |
| `app-007` | 37160:80081 `프로필편집_사진_바텀시트_나가기확인` | modal | confirm dialog |
| `app-008` | 37160:80112 `프로필편집_사진_크롭` | form | 크롭 UI |
| `app-009` | 37160:80126 `프로필편집_사진_앨범선택` | form | 앨범 picker |
| `app-010` | 37160:80228 `MY_프로필_사진변경완료` | detail | 결과 확인 |
| `app-011` | 37160:79937 `MY_프로필_닉네임변경완료` | detail | 결과 확인 |

**Acceptance Criteria (MVP-level — Phase 2 에서 상세화)**:
- AC-1.1 프로필편집 진입 → 닉네임/사진 변경 가능
- AC-1.2 닉네임 변경: 키보드 → validation → 저장 → 결과 화면
- AC-1.3 사진 변경: 라이브러리 선택 / 삭제 / 크롭 / 저장
- AC-1.4 변경 중 뒤로가기 → 나가기 confirm modal (저장 안된 변경 보호)
- AC-1.5 변경 완료 시 MY 프로필에 즉시 반영 (사진/닉네임)

### Group 002 — 차단 / 차단 관리 (8 screens)

**Page**: Figma `37160:51672` (UGC Platform 3 - 소셜 & 알림)
**Priority**: P0
**Repo**: app + backend (차단 API)
**Archetype mix**: modal × 4 + detail × 3 + feed × 1

| 화면 ID | Figma frame | Archetype | Notes |
|---------|------------|-----------|-------|
| `app-012` | 37211:162175 `타유저_더보기메뉴` | modal | 차단 진입 |
| `app-013` | 37211:162198 `타유저_차단확인_바텀시트` | modal | confirm + 안내 3 row |
| `app-014` | 37211:162150 `타유저_프로필_차단됨` | detail | 차단 후 프로필 상태 |
| `app-015` | 37211:162152 `타유저_차단됨_더보기메뉴` | modal | 차단 해제 진입 |
| `app-016` | 37211:162146 `타유저_프로필_차단해제후` | detail | 해제 후 프로필 상태 |
| `app-017` | 37289:169761 `차단관리_리스트` | **feed** | exemplar 인라인 첫 활용 |
| `app-018` | 37290:170093 `차단관리_바텀시트_해제 확인` | modal | 일괄 해제 confirm |
| `app-019` | 37290:170246 `차단관리_해제완료` | detail | 결과 확인 |

**Acceptance Criteria**:
- AC-2.1 타유저 프로필 → 더보기 → "차단" → confirm modal → 차단 적용
- AC-2.2 차단된 사용자 프로필 진입 시 콘텐츠 숨김 + "차단됨" 상태 표시
- AC-2.3 차단된 사용자 더보기 → "차단 해제" → 해제 → 프로필 복원
- AC-2.4 설정 → 차단관리 리스트 → 일괄 해제 가능
- AC-2.5 차단 / 해제 시 toast 또는 confirm 화면 1 step

### Group 003 — 알림 (센터 + 설정) (4 screens)

**Page**: Figma 양쪽 (`37160:25098` + `37160:51672`)
**Priority**: P1
**Repo**: app + backend (알림 설정 저장 API + push)
**Archetype mix**: feed × 1 + empty_state × 1 + form × 2 (중복 1개)

| 화면 ID | Figma frame | Archetype | Notes |
|---------|------------|-----------|-------|
| `app-020` | 37211:167171 `알림센터_기본` | **feed** | exemplar 인라인 첫 활용 |
| `app-021` | 37211:167434 `알림센터_노데이터` | empty_state | 첫 empty_state persona 검증 |
| `app-022` | 37289:169429 `알림설정_토글` | form | 카테고리 토글 4개 (canonical) |

**참고**: `37289:169342 알림설정_토글` (Page 1) 은 `37289:169429` (Page 2) 의 중복 — Page 2 canonical 사용.

**Acceptance Criteria**:
- AC-3.1 알림센터 진입 → 미읽음 강조 + 시간순 정렬
- AC-3.2 알림 0건 시 empty_state 화면 (재진입 유도 CTA)
- AC-3.3 알림 설정 진입 → 4 카테고리 (푸시/좋아요/소식/팔로우) 개별 토글
- AC-3.4 토글 변경 즉시 저장 (별도 저장 버튼 없음 — form persona 강제 룰 #2 와 충돌 가능 → archetype dogfood 핵심 케이스)

### Group 004 (optional) — Nav glue

**Page**: 양쪽
**Priority**: P2 (스프린트 scope 여유 시)

| 화면 ID | Figma frame | Notes |
|---------|------------|-------|
| `app-023` | 37174:21780 `설정` + 37289:169467/169801 `설정_메인메뉴` | 설정 → 차단관리 / 알림설정 entry 정합성 검증 |

---

## Group 의존성

- Group 001 (카메라) 는 독립 — backend 영향 최소 (avatar upload presigned URL 만)
- Group 002 (차단) 는 backend 차단 API 필요 — 별 BE 작업 또는 Mock
- Group 003 (알림) 는 backend 알림 설정 저장 API 필요 — 별 BE 또는 Mock
- Group 004 nav glue 는 003 + 002 완료 후

---

## v2 Pipeline 운영 룰 (이 스프린트 한정)

### Pass 6 Anti-Slop Audit
- 23 화면 모두 9/9 (또는 exemplar 적용시 10/10) 통과 필수
- `.control-panel` 이외 영역에서 raw hex 0 / emoji on interactive 0 / persona 강제 룰 모두 통과

### Assumption Preview Gate
- fabrication_risk: medium 트리거 화면 (사진 크롭, 앨범 선택, 차단 후 상태 등) 은 `intent.md` 산출 + Sprint Lead gate 통과 후 Step C 진입
- gate_questions 는 사용자에게 3-5문장으로 요약 제시

### Variants Mode (조건부)
- fabrication_risk: medium 트리거 화면이 1개 이상이면 3-way DE 스폰 (Conservative/Expressive/Minimal) → 사용자 1택
- 첫 운영 — 비용/가치 측정 후 후속 스프린트 정책 결정

### Asset Layer
- `avatars`, `feed_thumbnails`, `meme_images`, `icons`, `hero_banners` 슬롯별 source 명시
- 카메라 그룹: avatar = 사용자 업로드 (placeholder 허용 — 실 데이터 미존재)
- 차단/알림: 다른 사용자 avatar = `app-core-packages/ds/avatars/` fallback

### Archetype Persona
- 5 archetype 노출 (form/modal/feed/detail/empty_state) — 강제 룰 모두 적용
- 권장 룰 거절 시 quality-report 에 `archetype_recommendation_skipped` 기록

### Curated Exemplars
- `app-017 차단관리_리스트` + `app-020 알림센터_기본` 모두 feed archetype → `v2-dogfood-free-tab-app-001-freetabscreen` exemplar 자동 인라인
- 이 두 화면은 exemplar drift warning (Pass 6 #10) 발생 가능 — 차별화 검토

---

## Cross-cutting 제약

### ALWAYS DO
1. v2 파이프라인 모든 메커니즘 적용 (스킵 금지) — 본 스프린트는 dogfood 이 1차 목적
2. Sprint Lead 가 v2 메커니즘별 운영 결과를 retrospective 에 정량 기록 (어떤 메커니즘이 어떤 가치 / 비용을 만들었는지)
3. 모든 화면 verify-prototype 통과
4. exemplar drift warning 발생 시 사용자 보고

### NEVER DO
1. v2 메커니즘 우회 / 스킵
2. PRD 의 archetype 분류 무시 (B.1.1 분류 결과를 PRD 와 다르게 결정 시 Sprint Lead 보고)
3. UI copy 임의 변경 — Figma 의 한국어 카피 그대로

### OUT OF SCOPE
1. 카메라: 동영상 / 다중 사진 업로드
2. 차단: 신고 / 키워드 차단 / 일괄 차단
3. 알림: 알림 카테고리 추가 / 시간대 설정
4. Backend: 차단/알림 설정 API 신규 (별 BE 스프린트 — 또는 Mock 으로 진행)

---

## Pivot 기록

(스프린트 진행 중 작성 — 1차의 "PRD canonical 미확인 pivot" 같은 사례 기록)

---

## 산출물 (Phase 4 완료 시)

- 23 prototype.html (`sprint-orchestrator/sprints/ugc-platform-integration-qa-2/prototypes/app/{task-id}/`)
- 각 화면 quality-report.{Screen}.yaml (Pass 6 + persona + drift)
- v2 메커니즘별 retrospective (`retrospective/v2-pipeline-dogfood.md`)
- exemplar 후보 (audit 통과 화면 중 사용자 큐레이션)

## 완료 기준

- 23 화면 모두 verify-prototype + Pass 6 audit 통과
- AC 1.1-3.4 모두 prototype 으로 확인 가능
- v2 dogfood retrospective 작성 완료 (어떤 메커니즘이 효과적이었는지 정량/정성 평가)
