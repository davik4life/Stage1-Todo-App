# TaskFlow contributor instructions

This is the authoritative repository guide for coding agents. Read it before
editing. `AGENT.md` is a compatibility pointer; do not duplicate rules there.

## Scope and architecture

- React 18 UI, built with Vite. Entry: `index.html` → `src/index.jsx`.
- `src/App.jsx` owns fetching, mutations, filtering, and shared state.
- Small UI components live in `src/components/`; global tokens in
  `src/index.css`, component styling in `src/App.css`.
- Express 4 routes, validation, demo data, and startup are in `server/index.js`.
- `server/test/api.test.js` uses `node:test`, strict assertions, and Supertest.
- Express serves `build/` plus the API from the same origin in production.
- This is a shared, unauthenticated, in-memory demo. Records reset on restart.
  Do not claim persistence, offline support, user isolation, or production
  readiness. Private use requires authentication, authorization, and durable
  storage before deployment. Do not introduce paid infrastructure implicitly.

## Working rules

- Inspect `git status` first; preserve existing user changes and untracked files.
- Keep changes focused on the request. Never commit secrets, `.env` files,
  `node_modules/`, generated `build/`, or test artifacts.
- Use Node 24 (`.node-version`) and npm. Keep `package-lock.json` synchronized
  with `package.json`; use `npm ci` for reproducible installation.
- Do not run `npm audit fix --force`; assess advisory fixes and compatibility.
- Use CSS variables for shared design values; inline styles are appropriate for
  dynamic progress widths and user-selected note colors.
- Use same-origin API URLs. The Vite development proxy targets port 5001.
  `VITE_API_URL` is an optional public build-time setting, never a secret.
- A mutation is successful only after the server acknowledges it. Preserve form
  input and existing records on failure, show an actionable error, and prevent
  duplicate/out-of-order mutations. Never fabricate locally saved records.
- Keep pinned notes sorted first after creates and updates. Treat due dates as
  calendar dates; compare against the user's local day.

## API contract and validation

- `GET /api/health` returns 200 with `status: "ok"` and a timestamp.
- `/todos` and `/notes`: GET returns an array, POST creates (201).
  `PUT /:id` returns the updated record (200), DELETE returns an empty 204.
  Unknown records/routes return JSON 404.
- Todos support `priority`, `category`, `search`, and `completed` query filters;
  notes support `category` and `search`. Query values must be single strings;
  `completed` must be `true` or `false` when supplied.
- Validate the entire JSON object before mutating state. Reject malformed types
  with JSON 400 errors; updates must be atomic on validation failure.
- Title is required on creation, nonblank, trimmed, at most 200 characters.
  Category is a nonblank string of at most 100 characters, default `General`.
- Priority is a string: lowercase low/medium/high; unknown strings default to
  medium. Boolean fields accept actual JSON booleans, never truthy coercion.
- Due date is null or a valid YYYY-MM-DD calendar date. Notes accept string
  content up to 20000 characters and six-digit hex colors.
- Empty todo PUT retains the legacy completion-toggle behavior. Other partial
  updates preserve omitted fields. IDs/timestamps are server-owned.
- Errors have `{ error: "message" }`; do not leak stacks/internal details.

## Required verification

Run after backend/full-stack changes:

```sh
npm test
npm run build
```

Add regression cases for behavior changes, especially malformed inputs, atomic
updates, not-found responses, filtering, and create/update/delete paths. Tests
must not contact Render or mutate live data. Supertest opens local sockets; if
sandbox restrictions prevent that, use the approved execution path and report
any remaining blocker honestly. Do not mistake sandbox failures for app bugs.

For UI changes, exercise tasks and notes in the browser, including save failure,
retry, pin ordering, deletion, and narrow layouts. For dependency changes, run
`npm audit` and document unresolved advisories. Never claim checks passed without
running them.

## Commands and deployment

- `npm run dev`: Vite (3000) and Express (5001).
- `npm run build`: production assets in `build/`.
- `npm start`: Express on `PORT` or 5001. Build first for production preview.
- `render.yaml` is the Render Blueprint: free Node web service; build with
  `npm ci --include=dev && npm test && npm run build`; start with `npm start`;
  health path `/api/health`. Render provides `PORT`.
- Deploy only within the user's requested scope. Verify repository, branch,
  account, plan, health endpoint, and UI. Do not overwrite unrelated services.
- A prepared configuration or successful local build is not a live deployment.
  Report the live URL only after verifying it, or give the exact access blocker.
