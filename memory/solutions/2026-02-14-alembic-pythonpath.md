# Alembic PYTHONPATH 문제 해결

## 문제
- Docker 컨테이너 내에서 `alembic upgrade head` 실행 시 `ModuleNotFoundError: No module named 'app'` 발생
- 작업 디렉토리는 /app이지만 PYTHONPATH가 설정되지 않음

## 해결
- backend/Dockerfile에 `ENV PYTHONPATH=/app` 추가
- 이후 alembic.ini의 `script_location = alembic`과 `app.models` 임포트 정상 동작

## 핵심
- Docker 컨테이너에서 Python 프로젝트 실행 시 PYTHONPATH 반드시 설정
