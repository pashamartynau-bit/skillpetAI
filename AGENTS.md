<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **learnaiskillz** (API base `https://p38xiybh.us-west.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->

## Cursor Cloud specific instructions

Two independent npm apps live in this repo. Neither is a workspace package, and there is no test runner. Standard install and run commands are in `README.md`, `docs/setup.md`, and `mobile/package.json`.

- Web app: `npm run dev` from the repo root (Next.js 16 on http://127.0.0.1:3000). Lint with `npm run lint`. There is no `test` script.
- Mobile mock: from `mobile/`, `npm start` (or `npx expo start --web --port 8081`). Metro listens on IPv6 `localhost` only, so open http://localhost:8081. `http://127.0.0.1:8081` does not connect. `CI=1` boots non-interactively and disables Metro watch mode.

`npm ci` fails on Linux. The committed lockfiles omit optional `@emnapi/*` packages that npm 10.9 resolves here. Use `npm install` at the root and `npm install --prefix mobile`. That install can rewrite `package-lock.json`; leave the rewrite uncommitted unless you intend to update the lockfile.

The dev server boots with no env file. `.env.example` is mentioned in the docs and is not in the repo. Keys belong in gitignored `.env.local` (see the InsForge section above and `docs/setup.md`).

Without `NEXT_PUBLIC_INSFORGE_BASE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY`, sign-up uses a localStorage demo user (`demo-user-1` / `demo-token`). `POST /api/auth/sync` then returns `operation: "demo-mode"`. Strapi is not in this repo. Profile, courses, progress, achievements, and saving a study buddy call Strapi and return `Missing STRAPI_API_TOKEN` until `STRAPI_API_TOKEN` is set (`STRAPI_BASE_URL` defaults to `http://localhost:1337`). `/character-picker` still lists companions from `public/characters`. Stripe keys are only required for billing.

`/login?mode=sign-up` still opens the sign-in form. Switch with the "Create one" control.

`npm run lint` currently exits 1 on a pre-existing `react/no-unescaped-entities` error in `mobile/App.tsx`. The root ESLint config also lints `mobile/`.
