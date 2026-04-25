# Exemplar Showcases

큐레이션된 gold-standard 프로토타입. 다음 sprint 의 Design Engineer가 Frozen Snapshot 단계에서 archetype 매칭으로 자동 참조한다.

## 큐레이션 자격 (모두 충족 시 등록 가능)

1. Pass 6 Anti-Slop Audit 7/7 통과 (`anti_slop_audit: passed`)
2. verify-prototype 통과 (`status: pass`, clickErrors 0)
3. 사용자 또는 Sprint Lead 의 명시적 승인
4. archetype 분류 동의 (DE 가 어떤 화면 유형의 좋은 예로 참조할지)

## 참조 룰 (DE 측)

- exemplar는 **참조 자료** — 모방/복제 금지
- 동일 archetype 의 exemplar 가 등록된 경우 DE Frozen Snapshot 에 top-2 가 자동 인라인
- DE 는 exemplar 의 **구조적 패턴** (레이아웃, interaction, 상태 표현) 만 참고. 콘텐츠 텍스트/이미지는 절대 복사 금지

## Validation 주기

- `pnpm gallery:exemplar:validate` — 모든 exemplar 의 verify-prototype 재실행
- `validation_status: stale` (마지막 검증 30일 초과) → 자동 표시, 다음 build 에서 lookup 제외
- `validation_status: invalid` → exemplar 자동 비활성화, 큐레이터에게 갱신 요청
