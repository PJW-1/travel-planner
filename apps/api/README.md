# API

## Current focus

- local auth flow
- MySQL user storage
- Redis-backed session storage

## Environment

Copy `.env.example` to `.env` and fill in the MySQL values.

Important variables:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `SESSION_STORE=redis`
- `REDIS_URL=redis://127.0.0.1:6379`

## Run order

1. Start MySQL
2. Start Redis with Docker Desktop
3. Run the auth schema SQL
4. Start the API server

## Auth session structure

- user data is stored in MySQL
- login session state is stored in Redis
- browser auth uses an `httpOnly` session cookie
