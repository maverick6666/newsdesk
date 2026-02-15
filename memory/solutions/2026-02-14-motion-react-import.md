# motion/react 임포트 에러 해결

## 문제
- `Failed to resolve import "motion/react"` 에러
- package.json에는 motion이 있지만 컨테이너 내 node_modules에 설치 안 됨
- Docker 이미지 빌드 시점에 설치했지만, 이후 package.json 변경으로 불일치

## 해결
- 컨테이너 내부에서 직접 npm install 실행:
  ```bash
  docker exec -it newsdesk-frontend sh -c "cd /app && npm install"
  ```
- package-lock.json을 호스트로 복사:
  ```bash
  docker cp newsdesk-frontend:/app/package-lock.json frontend/
  ```

## 핵심
- Docker 개발 환경에서 package.json 변경 후엔 컨테이너 재빌드 또는 내부 npm install 필요
- 볼륨 마운트 사용 시 node_modules도 함께 마운트되므로 주의
