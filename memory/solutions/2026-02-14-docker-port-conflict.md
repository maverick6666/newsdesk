# Docker 포트 충돌 해결

## 문제
- fundmessage 프로젝트가 이미 PostgreSQL(5432), Backend(8000) 포트 사용 중
- newsdesk Docker Compose 서비스 시작 시 포트 바인딩 실패

## 해결
- .env에서 POSTGRES_PORT=5433, BACKEND_PORT=8001 로 변경
- docker-compose.yml에서 ${POSTGRES_PORT:-5433}:5432 매핑
- 프론트엔드는 5173 유지 (충돌 없음)

## 핵심
- 같은 머신에서 여러 Docker Compose 프로젝트 돌릴 때 포트 매핑 주의
- .env 파일로 포트를 변수화하면 관리가 편함
