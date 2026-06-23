#  Travel Master

> **AI 기반 여행 일정 생성 및 경로 최적화 플랫폼**

Travel Master는 여행 영상에서 장소를 추출하고, 실제 이동 시간과 위치 데이터를 분석하여 효율적인 여행 일정을 생성하는 서비스입니다.

<br>

##  Overview

기존 여행 서비스는 장소를 추천하거나 일정을 저장하는 기능에 집중되어 있습니다.

Travel Master는 **"어떻게 이동해야 가장 효율적인 여행이 될까?"**라는 문제에서 출발하여,

-  여행 영상에서 장소 자동 추출
-  이동 시간과 거리 기반 일정 생성
-  다른 사용자의 여행 경로를 재구성(Route Fork)

기능을 제공합니다.

---

## Key Features

### Video to Itinerary

YouTube 여행 영상을 분석하여 여행 후보지를 자동으로 추출합니다.

- Subtitle Parsing
- Place Extraction
- Location Normalization
- Travel Candidate Generation

---

### Smart Route Optimization

사용자가 선택한 장소를 단순 거리순이 아닌 실제 이동 환경을 고려하여 최적화합니다.

**Optimization Factors**

- Haversine Distance
- Walking Cluster
- Google Routes API
- Kakao Mobility API
- Vehicle Penalty
- Travel Time Analysis

---

### Route Fork

다른 사용자가 생성한 여행 경로를 가져와 자신의 일정으로 재구성할 수 있습니다.

Community Route

↓

Fork

↓

Edit

↓

Personal Trip

---

## Architecture

```
React (Vite + TypeScript)
            │
            │ REST API
            ▼
     Node.js + Express
            │
 ┌──────────┼──────────┐
 │          │          │
Planner  Optimizer  Community
 │          │          │
 └──────────┼──────────┘
            │
     MySQL + Redis
            │
 ┌──────────┴──────────┐
 │                     │
Google Routes     Kakao Mobility
```

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite

### Backend

- Node.js
- Express

### Database

- MySQL
- Redis(Session Storage)

### External API

- Google Routes API
- Kakao Mobility API

---

## Project Structure

```
apps/
├── api
│   ├── routes
│   ├── services
│   ├── middleware
│   ├── optimizer
│   └── database
│
├── web
│   ├── pages
│   ├── components
│   └── hooks
│
packages/
└── shared
```

---

## Technical Highlights

### 1. Route Optimization

단순한 장소 나열이 아닌 이동 효율을 고려한 일정 생성 로직을 구현했습니다.

- 위치 기반 거리 계산(Haversine)
- 도보 이동 클러스터링
- 차량 이동 패널티 적용
- 실제 이동 시간 API 반영

---

### 2. AI-based Place Extraction

YouTube 자막 데이터를 활용하여 여행 장소를 자동으로 추출합니다.

- Subtitle Parsing
- Place Normalization
- Duplicate Removal
- Structured Travel Data Generation

---

### 3. Session Architecture

브라우저 환경에 적합한 Session 기반 인증 구조를 적용했습니다.

- User Data → MySQL
- Session Data → Redis
- httpOnly Cookie Authentication

---

## My Contribution

### Backend

- REST API 설계 및 구현
- Route Optimization 로직 개발
- AI Place Parsing 기능 개발
- Redis Session 구조 적용
- Database 설계 및 API 연동

### Frontend

- React + TypeScript 기반 화면 개발
- Planner 및 Community 기능 연동

---

## What I Learned

이번 프로젝트를 통해 단순 CRUD 구현보다 **데이터를 분석하고 시스템을 설계하는 과정이 서비스 품질에 큰 영향을 준다는 것을 경험했습니다.**

특히 위치 데이터를 활용한 경로 최적화, 비정형 데이터 처리, Session 기반 인증 구조를 직접 설계하면서 문제를 다양한 관점에서 분석하고 최적의 해결 방안을 선택하는 경험을 할 수 있었습니다.

---

## Future Improvements

- AI 기반 여행 일정 추천 고도화
- Route Optimization Algorithm 개선
- 실시간 협업 플래너 기능 추가
- 성능 모니터링 및 캐싱 전략 개선