# FitSync codebase audit and revamp plan

Audit date: 2026-10-02

> **Historical audit:** The findings below describe the inherited prototype at
> the start of the revamp, not the current codebase. Phases 0-4 are implemented
> for local use, including JWT authentication, owner-scoped APIs, validation,
> pagination, tests, Vite migration, token-based password reset, and validated
> local avatar uploads. Docker Compose now runs the complete local stack.
> Production hosting, cloud media/email providers, load testing, and CI/CD remain
> intentionally deferred.

## Executive summary

FitSync is a working proof-of-concept UI with basic MongoDB persistence, but the
current backend is not a secure multi-user application. The existing React pages
and chart/calculator ideas are reusable. Authentication, API authorization,
password handling, data isolation, validation, error handling, file storage,
configuration, tests, and deployment should be rebuilt.

The safest approach is an incremental replacement: first establish a tested API
and authentication foundation, then migrate each existing screen to the new API,
then refresh the UI and deploy. CI/CD should be added after local and hosted builds
are stable.

## Current implementation

### Repository layout

- `frontend/fit-sync`: Create React App, React Router, Axios, Tailwind, Chart.js,
  Recharts, and several overlapping UI libraries.
- `backend`: one Express process, Mongoose schemas, route handlers, Nodemailer,
  Multer, and local disk storage.
- There is no usable Git repository metadata in the supplied project directory.
- There is no root workspace configuration, shared environment example, API
  documentation, or deployment configuration.

### Existing product features

- Registration and login.
- User profile, height, weight, and date of birth.
- BMI, body-fat, and weight history charts.
- Workout logging with calories burned and duration.
- Meal/calorie logging.
- Dashboard summary and a seven-day workout leaderboard.
- Profile image upload.
- Contact form and password reset email.

### Existing data model

- `login`: users and plaintext passwords.
- `details`: parallel arrays for chart dates and values, keyed with the same ID as
  a user.
- `workout`: user ID, name, calories, duration, and date.
- `calories`: user ID, food name, calories, and date.
- `Pic`: user ID and a filename stored on the API server's local disk.

## Critical findings

### Security

1. Passwords are stored and compared as plaintext.
2. There is no JWT, session, or server-side authentication middleware.
3. The browser decides whether a user is logged in with a mutable local-storage
   flag.
4. User IDs supplied by the browser are trusted. Any caller can read or mutate
   another user's records by changing an ID.
5. Workout, calorie, chart, and profile-image list endpoints return every user's
   data. Filtering happens in React after the data is exposed.
6. Update and delete endpoints do not verify record ownership.
7. The password-retrieval endpoint sends a user's password to the browser.
8. Forgot-password generates a password in the browser, sends it to the API,
   stores it immediately, and emails it in plaintext.
9. The Outlook SMTP username and password are committed in source. Those
   credentials must be rotated; removing them from the current file does not erase
   them from any upstream Git history.
10. CORS accepts all origins and there is no rate limiting, secure-header
    middleware, request-size policy, or upload type/size enforcement.

### Correctness and reliability

1. The old API host (`http://3.110.40.0:4000`) is hard-coded throughout the
   frontend and is currently unreachable.
2. The MongoDB connection string is a placeholder and is hard-coded in source.
3. The server begins listening without waiting for the database connection.
4. Several Mongoose handlers use callback forms that are incompatible with newer
   Mongoose versions.
5. There is no centralized async error handling; responses and status codes are
   inconsistent.
6. Signup creates the user and chart document through multiple client-driven
   requests. A partial failure leaves inconsistent data. The signup path also reads
   `userID` from local storage without setting it from the newly created user.
7. The forgot-password request is not awaited, so the UI reports success before
   the email/API operation completes.
8. Some forms attach the same submit handler to both the form and button, creating
   a risk of duplicate requests.
9. Query parameters for user filtering are sent by the UI but ignored by the API.
10. Progress is represented by parallel arrays, which can become misaligned and
    are difficult to query or aggregate.
11. Local profile-image files are unsuitable for free hosts with ephemeral disks.
12. Several endpoints fetch entire collections and compute filtering or aggregates
    in the browser, which will not scale cleanly.

### Maintainability and verification

1. Route naming mixes verbs, nouns, casing, and unrelated responsibilities.
2. API URLs are duplicated across components instead of using one configured API
   client.
3. Authentication helpers are duplicated.
4. Large commented-out blocks and debug logging obscure active code.
5. The backend test script intentionally fails and contains no tests.
6. The only frontend test is the unused Create React App starter assertion.
7. The frontend lists backend-only packages such as Express, MongoDB, Mongoose,
   CORS, and Nodemon.
8. The backend uses Nodemon as its production start command.

## Target architecture

Keep a MERN modular monolith. It is simpler to explain, test, deploy, and operate
than splitting this project into services.

### Backend modules

```text
src/
  app.js
  server.js
  config/
  middleware/
    authenticate.js
    authorize.js
    validate.js
    notFound.js
    errorHandler.js
  modules/
    auth/
    users/
    workouts/
    nutrition/
    progress/
    dashboard/
  services/
    email/
    storage/
  utils/
tests/
```

Use versioned REST endpoints under `/api/v1`:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET/PATCH /users/me`
- `GET/POST /workouts`
- `GET/PATCH/DELETE /workouts/:id`
- `GET/POST /nutrition-entries`
- `GET/PATCH/DELETE /nutrition-entries/:id`
- `GET/POST /progress-entries`
- `GET /dashboard/summary`
- `GET /dashboard/leaderboard`
- Admin-only endpoints under `/admin` only where an actual admin use case exists.

### Recommended models

- `User`: name, normalized unique email, password hash, role (`user` or `admin`),
  profile fields, avatar URL/public ID, timestamps.
- `Workout`: owner, exercise name/type, duration minutes, calories burned, date,
  optional notes, timestamps.
- `NutritionEntry`: owner, food/meal name, calories, date, optional protein/carbs/
  fat, timestamps.
- `ProgressEntry`: owner, date, weight, BMI, body-fat percentage, optional
  measurements, timestamps.
- `PasswordResetToken`: owner, hashed single-use token, expiry, timestamps. This
  can alternatively be embedded in `User` if kept narrowly scoped.

Add indexes for normalized email, owner/date queries, and reset-token expiry.
Derive BMI where practical rather than trusting arbitrary client values.

### Authentication and authorization

- Hash passwords with Argon2id or bcrypt; never return a password hash.
- Issue short-lived access JWTs and a refresh strategy appropriate to the final
  hosting topology. Prefer secure, HTTP-only, same-site cookies when frontend and
  API can share a site; otherwise use a carefully configured token flow.
- Authentication middleware establishes `req.user` from the verified token.
- Queries always scope records to `req.user.id`; they never accept ownership from
  the request body.
- Authorization middleware restricts role-specific routes.
- Add login and password-reset rate limits and generic reset responses to prevent
  email enumeration.

### Password reset

1. Accept an email and always return the same generic response.
2. If the account exists, create a cryptographically random token.
3. Store only a hash of that token with a 15-30 minute expiry.
4. Email a frontend reset link containing the original token.
5. On reset, verify token hash and expiry, validate/hash the new password, consume
   the token, and invalidate existing refresh sessions.

Use environment variables for the email API key and sender. Resend is a suitable
free-tier transactional provider; Nodemailer SMTP can remain as an adapter if a
working SMTP account is preferred.

### Frontend

- Keep React, but migrate from Create React App to Vite.
- Create a single environment-driven API client and auth/session provider.
- Add protected routes and role-aware navigation.
- Use server-owned queries and React Query (or a small equivalent data layer) for
  loading, caching, mutation invalidation, and error states.
- Preserve the dashboard/calculators initially; redesign after all data flows use
  the secure API.
- Remove redundant UI and backend packages from the frontend.

## Delivery plan

### Phase 0 - repository and secrets

- Initialize/recover Git history and create a feature branch.
- Rotate the exposed Outlook credential immediately.
- Add root `.gitignore`, `.env.example` files, supported Node version, and setup
  documentation.
- Decide whether any legacy MongoDB data is available for migration. The rebuild
  does not depend on it.

### Phase 1 - backend foundation

- Create the modular Express app and environment validation.
- Add MongoDB connection lifecycle and health/readiness endpoints.
- Add request validation, standard response errors, centralized error handling,
  secure headers, CORS allowlist, logging, and rate limiting.
- Add User model, registration/login, password hashing, JWT authentication, and
  `user`/`admin` authorization.
- Add unit and API integration tests.

### Phase 2 - domain APIs

- Implement owner-scoped workout, nutrition, progress, dashboard, and leaderboard
  APIs with pagination and date filters.
- Add ownership and validation tests, including cross-user access denial.
- Add a development seed command for demo users/data.

### Phase 3 - frontend migration and redesign

- Move to Vite and the shared API client.
- Replace local-storage login flags and direct user-ID ownership.
- Migrate registration, login, profile, workout, nutrition, progress, dashboard,
  and leaderboard screens.
- Add accessible validation, loading, empty, and failure states.
- Add component and flow tests.

### Phase 4 - password reset and media

- Implement token-based password reset using Resend (or configured SMTP).
- Store avatars in Cloudinary instead of the API filesystem.
- Validate file type/size and retain only the resulting media identifiers/URLs.

### Phase 5 - deploy and verify

- MongoDB Atlas Free cluster for the database.
- Vercel Hobby for the React static frontend.
- Render Free web service for the Express API.
- Cloudinary Free for profile images and Resend Free for transactional email.
- Configure separate development and production secrets, exact CORS origins,
  HTTPS URLs, health checks, and a production seed/demo account.
- Run smoke tests for registration, login, CRUD ownership, dashboards, reset email,
  avatar upload, logout, and mobile layout.

Render Free services sleep after inactivity and use an ephemeral filesystem, so a
cold start is expected and uploads must not be stored locally. This stack is good
for an interview/portfolio deployment, not a production SLA.

### Phase 6 - CI/CD (intentionally last)

- GitHub Actions: install from lockfiles, lint, test, build, and optionally run a
  dependency audit on pull requests and pushes.
- Let Vercel/Render deploy only after the required checks pass, or trigger deploy
  hooks from the protected deployment job.
- Add branch protection and document rollback and environment promotion.

## Acceptance criteria for the resume claims

- Workout logging, progress tracking, and personalized dashboards are backed by
  authenticated owner-scoped APIs.
- REST APIs cover users, workouts, nutrition, progress, and dashboard aggregates.
- JWT authentication and role-based authorization are demonstrated by automated
  tests.
- Every mutating endpoint has schema validation and all errors use the centralized
  handler.
- Passwords and reset tokens are hashed; no secret is committed or returned.
- A load-test script demonstrates the agreed 500-user workload without data leaks
  or correctness failures.
- Build/test/deploy automation is reproducible and documented.

Do not claim that the application **served 500+ real users** unless there is real
usage evidence. After load testing, an accurate alternative is: "validated the API
against a 500-virtual-user workload." If the figure refers to registered users,
capture an anonymized database count or hosting metric before using it.

## Immediate decisions

The following defaults allow implementation to start without blocking:

- JavaScript throughout, preserving the current team's language.
- Modular Express monolith and versioned REST API.
- MongoDB Atlas Free with a newly created database if the old account is
  unavailable.
- Vercel frontend, Render backend, Cloudinary avatars, and Resend email.
- Preserve current features first; visual redesign follows functional migration.
- Add CI/CD only after local tests and both deployments are stable.
