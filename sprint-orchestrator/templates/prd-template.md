> 📝 PRD 작성 시 이 템플릿을 복사하여 `docs/prds/PRD-{project}-{번호}-{slug}.md`로 저장하세요.
> 네이밍 예시: PRD-ugc-platform-2-feed-interaction.md

---

```yaml
title: "(PRD 제목)"
domain: ZZEM
status: 대기  # 대기 | 진행 중 | 완료
description: "(한 줄 요약 — 핵심 범위와 선행 조건)"
kpi: "(지표 → 인과관계 → 비즈니스 임팩트)"
notion_url: (Notion 원본 링크)
```

---

# (PRD 제목)

> 📋 (시리즈 PRD인 경우) 관련 PRD 목록과 개발 순서를 기술한다.
>
> 1. (PRD 1 제목) — (순서/조건)
> 2. (PRD 2 제목) — (순서/조건)

## 교차 참조 규칙

- (이 PRD에서 구현하는 것 vs 다른 PRD에서 구현하는 것의 경계를 명시)
- (예: "팔로워 카운트 UI는 본 PRD에서, 팔로우 기능 자체는 PRD 3에서 구현")

---

## Overview

(이 PRD가 구축하는 시스템/기능의 전체 그림을 1~2문장으로)

### 구현 범위

- (범위 항목 1)
- (범위 항목 2)

---

## User Stories & Acceptance Criteria

### US1: (스토리 제목)

(역할)로서, (행동)하여 (가치)를 얻고 싶다.

### AC 1.1: (조건명)

- Given (전제조건)
- When (행동)
- Then (기대결과)

---

## 비즈니스 룰

### (도메인 규칙 그룹명)

1. (규칙 1)
2. (규칙 2)

---

## 경계 (Boundary)

### ALWAYS DO

1. (반드시 지켜야 할 사항)

### NEVER DO

1. (이번 버전에서 절대 하지 않는 것 — Out of Scope 포함)
