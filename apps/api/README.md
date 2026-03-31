# API Skeleton

초기 API 뼈대입니다.

## 현재 상태

- `Express` 진입점만 구성
- `trips`, `planner` 모듈 라우터 분리
- 추후 `service`, `repository`, `infra` 계층을 붙이기 쉬운 구조

## 추천 확장

1. `src/config`에 환경변수 검증 추가
2. `src/database`에 MySQL 연결 계층 추가
3. `src/modules/*`마다 `controller/service/repository` 구조 분리
4. Redis 기반 캐시/큐 모듈 추가
5. AI 영상 분석 작업은 HTTP 요청과 분리해 worker로 이동

