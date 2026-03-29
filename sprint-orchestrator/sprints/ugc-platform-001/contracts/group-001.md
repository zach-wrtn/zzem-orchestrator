# Sprint Contract: Group 001 — Profile

## Scope
- Tasks: 001-profile-api (BE), 001-profile-screen (FE)
- Endpoints: GET/PATCH /profiles/me, GET /profiles/{userId}, GET /profiles/me/share-url
- PRD: US2 (AC 2.1~2.6), US7 AC 7.5 (isPersona)

## Done Criteria
- [ ] DC-1: GET /profiles/me 호출 시 nickname, profileImageUrl, followerCount, followingCount, regeneratedCount, isPersona 필드 반환
- [ ] DC-2: 프로필 미존재 유저 최초 호출 시 고유 닉네임 자동 생성 (빈 문자열 아님, DB 내 중복 없음). 닉네임 형식은 구현 재량 (Evaluator는 형식 검증 스킵, uniqueness+non-empty만 검증)
- [ ] DC-3: PATCH /profiles/me에 빈 닉네임(trim 후) 전송 시 400, 21자 전송 시 400
- [ ] DC-4: PATCH /profiles/me에 유효 닉네임 전송 시 200 + 변경된 프로필 반환. 사용자 닉네임은 중복 허용 (고유성 제약 없음)
- [ ] DC-5: GET /profiles/{userId}에 followStatus(none/following/follower/mutual), isBlocked 포함. 비인증 호출 시 followStatus=none, isBlocked=false 반환. 자기 자신 userId로 조회 시에도 followStatus=none, isBlocked=false 반환
- [ ] DC-6: GET /profiles/{userId}에 존재하지 않는 userId → 404
- [ ] DC-7: GET /profiles/me/share-url → 딥링크 URL 반환
- [ ] DC-8: 인증 없이 GET /profiles/me → 401
- [ ] DC-9: FE ProfileScreen에서 프로필 이미지, 닉네임, 3개 카운터 표시
- [ ] DC-10: FE 3탭(게시물/비공개/좋아요) 전환 동작. 탭 콘텐츠는 Group 002 범위이므로 Group 001에서는 빈 상태 허용 — 탭 전환 UI 동작만 검증
- [ ] DC-11: FE 프로필 편집 후 저장 성공 시 queryClient invalidation 또는 setQueryData로 UI에 변경 반영
- [ ] DC-12: FE 프로필 공유 → OS 공유 시트 + 딥링크
- [ ] DC-13: FE MY 버튼 → ProfileScreen 이동 (비로그인 시 로그인 화면)
- [ ] DC-14: 동일 유저의 동시 GET /profiles/me 호출 시 프로필이 1개만 생성됨 (unique constraint 또는 lock)
- [ ] DC-15: PATCH /profiles/me에 nickname 없이 profileImageUrl만 전송 시 200 + 이미지만 변경됨. 빈 body {} 전송 시 200 (no-op)

## Verification Method
- DC-1: GET /profiles/me 응답 schema에서 각 필드 존재 + 타입 확인
- DC-2: 닉네임 자동 생성 코드에서 uniqueness 보장 로직 추적 (retry or unique constraint)
- DC-3: ValidationPipe 설정에서 nickname 규칙 확인, 컨트롤러/DTO에서 @MinLength(1), @MaxLength(20) 확인
- DC-4: AppService → DomainService → Repository 업데이트 플로우 추적
- DC-5: 타유저 프로필 조회 시 Follow/Block 조회 로직 추적
- DC-6: DomainService에서 null 체크 → NotFoundException 처리 확인
- DC-7: share URL 생성 로직 확인 (딥링크 형식)
- DC-8: LibUserGuard 데코레이터 확인
- DC-9: ProfileScreen 코드에서 API 응답 필드 바인딩 확인
- DC-10: Tabs<T> 컴포넌트 사용, 탭 상태 전환 확인
- DC-11: useMutation onSuccess에서 queryClient invalidation/setQueryData 확인
- DC-12: Share API 호출 코드 확인
- DC-13: MY 버튼 onPress → navigation.navigate("ProfileScreen") + auth guard 확인

### Edge Cases to Test
- 닉네임에 이모지, 특수문자, 공백만 입력 시 처리
- profileImageUrl이 null인 프로필 응답
- 자기 자신을 GET /profiles/{userId}로 조회 시 → followStatus=none, isBlocked=false (DC-5에 명시)
- 동시에 두 번 프로필 생성 요청 시 중복 생성 방지 (DC-14에 명시)
- PATCH에 profileImageUrl만, nickname만, 둘 다, 빈 body 전송 시 각각 정상 동작 (DC-15)
- 비인증 유저의 GET /profiles/{userId} 호출 시 followStatus/isBlocked 기본값 (DC-5에 명시)

## Sign-off
- 2026-03-29: Evaluator reviewed, Sprint Lead revised (A-2, E-1~E-4, S-1, U-1 addressed)
- 2026-03-29: Evaluator approved — all 15 DCs specific, testable, aligned
