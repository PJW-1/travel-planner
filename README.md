# Travel Master

확장형 여행 일정 서비스의 초기 워크스페이스입니다.

## 구조

- `apps/web`: React + Vite 기반 프론트엔드
- `apps/api`: Node.js + Express 기반 API 서버 뼈대
- `packages/shared`: 프론트/백엔드가 함께 쓰는 타입과 상수

## 왜 이렇게 시작했나

- 지금은 프론트 데모를 빠르게 발전시키되,
- 이후 `MySQL`, `Redis`, `S3`, `Queue`, `Auth`, `Next.js` 전환 여부까지 감안해
- 기능 단위로 분리하기 쉬운 형태로 잡아두기 위함입니다.

## 시작 명령

```bash
npm install
npm run dev:web
```

API 서버도 별도로 실행하려면:

```bash
npm run dev:api
```

## 다음 추천 단계

1. `apps/api`에 실제 MySQL ORM 도입
2. 인증 모듈과 사용자/일정/장소 도메인 분리
3. 유튜브 장소 추출 파이프라인을 비동기 잡 구조로 분리
4. Redis를 캐시와 작업 큐 용도로 추가
5. 프론트에서 mock data를 실제 API query layer로 교체

