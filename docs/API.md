# FitSync API

Base URL for local development: `http://localhost:4000/api/v1`

Except for registration, login, password reset, contact, and health endpoints,
requests require this header:

```http
Authorization: Bearer <access-token>
```

## Authentication

- `POST /auth/register` — create a user and return `{ user, token }`.
- `POST /auth/login` — authenticate and return `{ user, token }`.
- `POST /auth/forgot-password` — create a short-lived, single-use reset token.
- `POST /auth/reset-password/:token` — consume the token and set a new password.

When SMTP is not configured and `NODE_ENV` is not `production`, the forgot-password
response includes a `development.resetUrl`. This is only for local development.

## User and role access

- `GET /users/me`
- `PATCH /users/me`
- `PATCH /users/me/password`
- `GET /users` — admin only, paginated.

New registrations always receive the `user` role. Promote an account to `admin`
only through an authorized database administration process.

## Pagination

Collection endpoints accept positive integer `page` and `limit` query parameters.
The default page size is 20 and the maximum is 100. Paginated responses use:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

Pagination applies to users, workouts, nutrition entries, progress entries, and
the leaderboard. Workout and nutrition lists also accept `from` and `to` date
filters.

## Workouts

- `GET /workouts`
- `POST /workouts`
- `PATCH /workouts/:id`
- `DELETE /workouts/:id`

Workout writes accept `exerciseName`, `caloriesBurned`, `durationMinutes`, `date`,
and optional `notes`. Every query is scoped to the authenticated owner.

## Nutrition

- `GET /nutrition-entries`
- `POST /nutrition-entries`
- `PATCH /nutrition-entries/:id`
- `DELETE /nutrition-entries/:id`

Nutrition writes accept `foodName`, `calories`, `date`, and optional macronutrients.
Every query is scoped to the authenticated owner.

## Progress and dashboard

- `GET /progress-entries`
- `GET /progress-entries/summary`
- `POST /progress-entries` — upserts one entry per user/day.
- `DELETE /progress-entries/:id`
- `GET /dashboard/summary`
- `GET /dashboard/leaderboard`

Progress writes can contain `weightKg`, optional `heightCm`, and
`bodyFatPercentage`. When weight is supplied, the server calculates BMI from the
request height or the authenticated user's profile height; a client-provided BMI
is never trusted. Updating profile height or weight also updates today's progress
record. One progress record is retained per user per UTC calendar day.

`PATCH /users/me` also accepts `goalWeight`. Goal weight is a target and is never
stored as an actual progress measurement.

## Media

- `POST /media/avatar` — multipart field `avatar`; JPG, PNG, or WebP; maximum 5 MB.
- `DELETE /media/avatar`

Uploads are owner-authenticated and stored under `backend/uploads/avatars` for
local development. Files are intentionally ignored by Git. A persistent object
store must replace local disk storage before deployment to an ephemeral host.

## Other endpoints

- `POST /contact`
- `GET /health`
- `GET /readiness`

Errors use the common shape:

```json
{
  "error": {
    "message": "Human-readable message",
    "details": []
  }
}
```
