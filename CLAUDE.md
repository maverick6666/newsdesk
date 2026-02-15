# NewsDesk Center

뉴스데스크 센터 - 펀드메신저 프리미엄 뉴스 인텔리전스 플랫폼

## UX/UI 최우선 원칙
- **이 프로젝트에서 가장 중요한 것은 프론트엔드 디자인**
- 프론트엔드 작업(컴포넌트, 페이지, 스타일, UI 변경) 시 반드시 `frontend-design` 스킬을 호출할 것
- 뉴스데스크는 "예뻐야" 한다 — 디자인 품질이 기능보다 우선

## 프로젝트 구조
- 백엔드: FastAPI (Python 3.14)
- LLM: Ollama + Qwen3-8B (로컬 GPU, RTX 5070 12GB)
- 데이터베이스: PostgreSQL
- 연동: fundmessage 프로젝트 (F:\fundmessage) 에 API 제공

## 메모리 시스템

이 프로젝트는 세션 간 지식 유지를 위한 **자동화된 메모리 시스템**을 사용합니다.
메모리 파일은 프로젝트 루트 `memory/` 디렉토리에 있습니다.

### 파일 구조
- `memory/session-state.md` - 현재 상태 스냅샷 (진행중/완료 작업, 이슈)
- `memory/work-log.md` - 시간순 작업 이력 (최신이 위)
- `memory/decisions.md` - 기술적 결정 & 환경 변경 이력
- `memory/solutions/` - 상세 해결 기록 (YYYY-MM-DD-설명.md)
- `memory/patterns/` - 재사용 코드 패턴 (주제명.md)

### 세션 시작 시 (필수)
1. SessionStart 훅이 session-state.md와 work-log.md를 자동 출력
2. 사용자 요청 관련 키워드로 memory/solutions/와 memory/patterns/ Grep 검색

### 사용자 메시지 파싱 규칙 (필수)
사용자가 긴 메시지에 여러 작업을 섞어 보낼 때, 코드 작업 전에 반드시:
1. 메시지에서 개별 작업 단위를 분리하고 분류 (버그/UI/기능/개선/설정변경)
2. memory/session-state.md에 체크리스트로 기록
3. 각 작업 키워드로 memory/solutions/와 memory/patterns/ 검색

### 설정/규칙 변경 즉시 반영 (작업 완료 기다리지 않음!)
"이제부터/앞으로/~로 바꿀래/~로 전환" 같은 환경 규칙 변경 감지 시:
1. 즉시 memory/decisions.md에 Before/After/이유 기록
2. 즉시 memory/session-state.md 개발 환경 섹션 업데이트
3. 즉시 MEMORY.md의 "절대 규칙" 섹션 업데이트
4. 사용자에게 변경 확인
5. 사용자에게 파싱 결과 확인 후 순차 작업

### 작업 완료 시 (필수)
1. memory/work-log.md 맨 위에 작업 요약 추가
2. memory/session-state.md 업데이트
3. 버그 수정 → memory/solutions/YYYY-MM-DD-설명.md 생성
4. 재사용 패턴 → memory/patterns/주제명.md 생성/업데이트
5. 환경/기술 결정 변경 → memory/decisions.md에 추가

### 컨텍스트 압축 시
- PreCompact 훅이 알림을 표시함
- 압축 후 반드시 memory/session-state.md를 다시 읽어 맥락 복구
