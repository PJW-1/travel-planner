# Travel Master

Travel Master is a smart travel planning platform centered around three ideas:

- `Video-to-Itinerary`: turn travel videos into place candidates
- `Smart Routing`: optimize routes with travel time and fatigue feedback
- `Route Forking`: remix other travelers' routes into your own plan

## Workspace

- `apps/web`: React + Vite frontend
- `apps/api`: Node.js + Express API
- `packages/shared`: shared types and constants
- `compose.yaml`: local Redis for team development

## Local setup

1. Install dependencies

```bash
npm install
```

2. Start Redis with Docker Desktop

```bash
npm run infra:up
```

3. Start the API server

```bash
npm run dev:api
```

4. Start the web app

```bash
npm run dev:web
```

## Redis notes

- Redis runs on `127.0.0.1:6379`
- API session storage defaults to `SESSION_STORE=redis`
- Redis data is persisted in the Docker volume `redis-data`

## Useful commands

```bash
npm run infra:up
npm run infra:logs
npm run infra:down
```

## Showcase reseed

If you want the same demo/community data used in the current local showcase, apply the reset file first and then the snapshot seed.

PowerShell:

```powershell
Get-Content .\apps\api\src\database\sql\011_reset_to_admin_only.sql | mysql -h 127.0.0.1 -P 3306 -u root -p2364 -D travel
Get-Content .\apps\api\src\database\sql\013_showcase_snapshot.sql | mysql -h 127.0.0.1 -P 3306 -u root -p2364 -D travel
```

The snapshot contains:

- 10 showcase community routes
- Korean and overseas car-route examples
- likes, bookmarks, comments, trend cards
- planner/community-linked trip, day, stop, and analysis data
