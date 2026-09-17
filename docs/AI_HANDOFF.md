# AI handoff: Framebase movie library

Read this document and `README.md` before making a change. It is a compact
handoff for a developer or coding assistant joining the project.

## Purpose

Framebase is a personal movie-library web application. Registered users manage
only their own movie entries. An administrator can see safe account metadata
and reset a user's passcode, but must never be able to view existing passcodes.

The public site is intended to run at `https://taoyongli.me`.

## Technology and architecture

```text
Browser
  └─ React 19 + Vite frontend (frontend/)
       └─ /api requests
            └─ Spring Boot 4 / Java 21 application (backend/)
                 └─ PostgreSQL 17

Production:
Internet → Caddy (HTTPS) → app container (port 8080) → PostgreSQL container
```

- `frontend/`: React UI, Vite, Vitest, Testing Library, Lucide icons.
- `backend/`: Spring Boot application, Spring Security, JPA, PostgreSQL.
- `backend/Dockerfile`: multi-stage production build. It builds the frontend
  and packages it into the Spring Boot application, so one app container serves
  both the UI and API.
- `.github/workflows/ci-cd.yml`: CI, image publishing, and production deploy.
- The production Docker Compose and Caddy files are on the Azure VM in
  `~/movie-library`; they are not currently committed in this repository.

## Important product behavior

### Accounts and authorization

- Authentication uses Spring Security's server-side session cookie and CSRF
  protection. The frontend must obtain/send the CSRF token for state-changing
  requests; follow the existing helpers in `frontend/src/api/auth.js`.
- Anyone can register with a username and a passcode.
- A fresh database gets one administrator from `ADMIN_USERNAME` and
  `ADMIN_PASSWORD`. These environment variables must be set in production.
- Passwords are BCrypt hashes. Do not add an endpoint, UI, log line, test
  fixture, or admin tool that exposes a stored password/passcode.
- `ADMIN` can see username, role, creation time, and movie count; it can reset
  a passcode. It cannot reveal the previous passcode.
- Every movie is owned by a `UserAccount`. All movie queries and mutations must
  be scoped to the authenticated user. Accessing another user's movie must not
  leak data.

### Movie features

- Create, edit, delete, search, filter, sort, and paginate movie entries.
- The catalog shows 12 movies per page.
- CSV import/export uses the headers defined in `frontend/src/utils/movieCsv.js`.
- CSV imports skip duplicate entries and report valid/invalid results.
- Batch actions apply to the entire signed-in user's library, not merely the
  visible filtered page: watch all, unwatch all, and delete all.
- “Delete all” removes database records only. It must never delete files from a
  user's device.

### Main UI

- `frontend/src/components/LoginPage.jsx` is the public landing/login surface.
- It supports English and Chinese. New visible text must be added to both
  language dictionaries.
- The three classic-poster images live under `frontend/public/posters/`.
- Login/landing animations live in `frontend/src/styles.css`. Avoid putting a
  blur filter on the poster gallery itself: it can leave browser-rasterized
  poster images looking soft after the entrance animation.

## Key source locations

| Area | Start here |
| --- | --- |
| Application shell, library UI, paging, batch actions | `frontend/src/App.jsx` |
| API calls | `frontend/src/api/auth.js`, `frontend/src/api/movies.js` |
| Login, registration, language switch | `frontend/src/components/LoginPage.jsx` |
| CSV parsing/export | `frontend/src/utils/movieCsv.js` |
| Styles and responsive layout | `frontend/src/styles.css` |
| Movie HTTP endpoints | `backend/src/main/java/com/vincent/MovieLibrary/controller/MovieController.java` |
| Account HTTP endpoints | `backend/src/main/java/com/vincent/MovieLibrary/controller/AuthController.java` |
| Admin HTTP endpoints | `backend/src/main/java/com/vincent/MovieLibrary/controller/AdminController.java` |
| Authorization and initial admin | `backend/src/main/java/com/vincent/MovieLibrary/config/SecurityConfig.java` |
| Ownership and movie business logic | `backend/src/main/java/com/vincent/MovieLibrary/service/MovieService.java` |

## Local development

Use two terminals:

```bash
# Terminal 1: API and local PostgreSQL connection
cd backend
./mvnw spring-boot:run

# Terminal 2: frontend development server
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite forwards `/api` to the backend on port 8080.

If port 8080 is occupied, identify the specific process before stopping it:

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
kill <PID>
```

Do not use a force kill unless normal termination fails.

## Verification

Run the smallest relevant checks while developing, then run the full checks for
a cross-cutting change:

```bash
# Frontend
cd frontend
npm test
npm run coverage
npm run build

# Backend: unit, integration, stress, and coverage thresholds
cd backend
./mvnw verify
```

Coverage reports are generated in `backend/target/site/jacoco/` and
`frontend/coverage/`. Do not commit generated coverage or build output.

## CI/CD and production deployment

The workflow runs on pull requests to `main` and pushes to `main`:

```text
push to main
  → frontend tests and coverage
  → frontend build
  → backend unit, stress, integration, and coverage verification
  → publish Docker image to GHCR
  → SSH to Azure VM, pull image, recreate only the app container
```

Published image:

```text
ghcr.io/andrew-felicia/moviesmanagementsystem:latest
```

Each published commit also receives an immutable `sha-...` tag. The deploy job
currently pulls `latest`; rollback by source is therefore the safe normal path:

```bash
git revert <bad-commit-sha>
git push origin main
```

This creates an auditable restoration commit, which is then tested and deployed
by the same pipeline. Do not use `git reset --hard` to undo code already pushed
to a shared branch.

### Production setup facts

- Azure VM runs Ubuntu and Docker Compose under user `pandas`.
- Caddy owns public ports 80 and 443; the app is internal on port 8080 and
  PostgreSQL is internal on port 5432.
- The deploy job uses GitHub environment `production` and these secrets:
  `VPS_HOST`, `VPS_USER`, `VPS_SSH_PRIVATE_KEY`, and `VPS_KNOWN_HOSTS`.
- The VM's compose environment also has PostgreSQL/admin/session values.
  They must stay only on the VM in its `.env` file.
- Normal manual recovery/redeploy on the VM is:

```bash
cd ~/movie-library
docker compose pull app
docker compose up -d --no-deps --force-recreate app
docker compose ps
```

Never run `docker compose down -v` against the production deployment unless the
user has explicitly accepted deletion of the PostgreSQL volume and Caddy state.

## Safety rules for future changes

1. Start with `git status` and preserve unrelated or uncommitted user work.
2. Never commit `.env`, private SSH keys, database dumps, credentials, or
   GitHub Actions secrets.
3. Do not weaken authentication, CSRF protection, ownership checks, or admin
   role checks merely to make a test/UI easier.
4. Keep database changes backward-compatible or provide an explicit migration
   and rollback plan.
5. Test both English and Chinese UI copy after changing visible UI behavior.
6. For deployment changes, consider the impact on the running PostgreSQL data
   before changing Docker Compose, image tags, or volumes.
7. Tell the user which files changed, how they were verified, and any command
   the user must run themselves.

## Suggested prompt for another assistant

> Read `README.md` and `docs/AI_HANDOFF.md` before changing anything. Preserve
> existing behavior and unrelated working-tree changes. Explain the affected
> frontend, API, database, security, and deployment behavior as appropriate.
> Add or update relevant tests, run the smallest appropriate verification, and
> never expose or add secrets to the repository.
