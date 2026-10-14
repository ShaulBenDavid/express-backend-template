# Express Backend Template

Express 5 + TypeScript REST API template with Prisma, PostgreSQL, Google OAuth login and a revocable
JWT refresh-token flow. Ships with `User` and `Book` example models.

## Stack

- **Runtime:** Node.js 22+, TypeScript
- **Framework:** Express 5
- **ORM:** Prisma 7 + PostgreSQL (`@prisma/adapter-pg`)
- **Auth:** Google OAuth (authorization code) → access JWT + httpOnly refresh cookie
- **Validation:** Zod
- **Security:** Helmet, CORS, express-rate-limit, HPP
- **Tooling:** ESLint, Prettier, Husky (pre-commit), lint-staged
- **Local DB:** Docker Compose
- **Deploy:** `render.yaml` blueprint (Render)

## Getting started

```bash
# 1. Start Postgres
docker compose up -d

# 2. Copy env and install deps
cp .env.example .env
npm install

# 3. Apply migrations (creates `users` + `books`)
npm run db:migrate

# 4. Start dev server
npm run dev
```

Server runs on `http://localhost:3000` (set `PORT` in `.env`).

## Project structure

```
src/
├── server.ts                  Entry point + graceful shutdown
├── app.ts                     Express factory + middleware stack
├── config/env.ts              Fail-fast env validation
├── lib/prisma.ts              PrismaClient singleton
├── errors/AppError.ts         Operational error class
├── middleware/
│   ├── errorHandler.ts        Global error handler
│   ├── notFound.ts            404 catch-all
│   └── validate.ts            Zod body/params/query validation
├── routes/index.ts            Route registry + rate limiters
├── utils/                     Status codes, cookie names, ms(), query param parsing
└── modules/
    ├── health/                GET /health (DB ping)
    ├── auth/                  Google sign-in, refresh, logout, authenticate/requireAdmin
    ├── users/                 Admin-only user management
    └── books/                 Example owned resource (CRUD scoped to the logged-in user)
```

## Authentication

### Google OAuth setup

1. Create an OAuth 2.0 Client ID (Web application) in Google Cloud Console.
2. Add your frontend origin to **Authorized JavaScript origins** and set the redirect URI.
3. Fill `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` in `.env`.

### Flow

1. The frontend runs Google's authorization-code flow and sends the returned `code` to
   `POST /api/v1/auth/google` → body `{ code }`.
2. The backend exchanges the code, verifies the ID token (email must be verified), upserts the user and
   responds with `{ accessToken, user }`. A refresh token is set as an **httpOnly, SameSite=strict cookie**
   scoped to `/api/v1/auth`.
3. Send the access token on protected requests: `Authorization: Bearer <accessToken>`
   (short-lived, `JWT_ACCESS_EXPIRES_IN`, default `15m`).
4. When it expires, call `POST /api/v1/auth/refresh` (with `credentials: 'include'`) to get a new
   access token.
5. `POST /api/v1/auth/logout` clears the cookie and bumps `User.tokenVersion`, which revokes every refresh
   token issued to that user.

Guards: `authenticate` (valid access token) and `requireAdmin` (`ADMIN` role) in
`src/modules/auth/auth.middleware.ts`. New users get the `USER` role — promote one to `ADMIN` directly in
the DB (e.g. `npm run db:studio`).

## API endpoints

| Method   | Path                   | Auth   | Description                                              |
| -------- | ---------------------- | ------ | -------------------------------------------------------- |
| `GET`    | `/health`              | —      | DB ping                                                  |
| `POST`   | `/api/v1/auth/google`  | —      | Sign in with Google `{ code }`                           |
| `POST`   | `/api/v1/auth/refresh` | cookie | New access token                                         |
| `POST`   | `/api/v1/auth/logout`  | cookie | Clear cookie + revoke refresh tokens                     |
| `GET`    | `/api/v1/users`        | admin  | List users                                               |
| `GET`    | `/api/v1/users/:id`    | admin  | Get user                                                 |
| `POST`   | `/api/v1/users`        | admin  | Create user `{ name, email }`                            |
| `DELETE` | `/api/v1/users/:id`    | admin  | Delete user                                              |
| `GET`    | `/api/v1/books`        | user   | List own books `?search=&page=&limit=`                   |
| `GET`    | `/api/v1/books/:id`    | user   | Get own book                                             |
| `POST`   | `/api/v1/books`        | user   | Create `{ title, author, description?, publishedYear? }` |
| `PUT`    | `/api/v1/books/:id`    | user   | Update own book (partial)                                |
| `DELETE` | `/api/v1/books/:id`    | user   | Delete own book                                          |

Responses use `{ status: 'ok', data }`; list endpoints return `{ results, count, next, previous }`.

## Scripts

```bash
npm run dev              # Start with hot reload (tsx watch)
npm run build            # prisma generate + tsc → dist/
npm run start            # Run compiled output
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier write
npm run format:check     # Prettier check
npm run db:migrate       # Create/apply Prisma migrations (dev)
npm run db:migrate:prod  # Apply migrations (prod)
npm run db:generate      # Regenerate Prisma client
npm run db:studio        # Open Prisma Studio
```

## Error handling

All errors flow through the global `errorHandler` middleware.

- `AppError(message, statusCode)` — operational errors (4xx). The message is forwarded to the client.
- Anything else — logged server-side, client receives `500`. In `development`, the stack trace is included.

Express 5 forwards thrown errors and rejected promises from route handlers automatically.

## Adding a new module

Use `src/modules/books/` as the reference:

1. `prisma/schema.prisma` — add the model, then `npm run db:migrate -- --name add_<model>`.
2. `src/modules/<name>/`:
   - `<name>.schema.ts` — Zod schemas for body/params
   - `<name>.service.ts` — Prisma calls + business rules
   - `<name>.controller.ts` — req/res handling
   - `<name>.router.ts` — routes + `authenticate`/`requireAdmin` + `validate(...)`
3. Register it in `routeMounts` in `src/routes/index.ts`.

## Deploying to Render

`render.yaml` defines a Postgres DB and a web service that runs migrations on pre-deploy. JWT secrets are
generated automatically; set `CORS_ORIGIN` and the `GOOGLE_*` vars in the dashboard.
