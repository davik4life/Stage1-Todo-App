# TaskFlow & Notes

React and Express task management with priorities, categories, due dates,
filtering, progress tracking, and colored pinned notes.

**Demo limitations:** everyone shares the same unauthenticated workspace. Data
is held in server memory and resets whenever the process restarts or redeploys.
Do not enter private information. Private use needs authentication and durable
storage; a free Render web service does not provide a persistent disk.

## Local development

Use Node 24 and npm:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Vite proxies the API to Express at port 5001.
`PORT` overrides the Express port (update the dev proxy if changing it).

```sh
npm test
npm run build
npm start
```

The production preview is at http://localhost:5001. Vite builds into `build/`,
which Express serves alongside `/todos`, `/notes`, and `/api/health`.
`VITE_API_URL` optionally overrides the API origin at build time; same-origin is
the supported default. Never put secrets in Vite environment variables.

## Render deployment

Push the verified source and lockfile to the connected GitHub repository, then
create a Blueprint from `render.yaml` in the Render dashboard. It specifies:

- Free Node web service using Node 24.
- Build: `npm ci --include=dev && npm test && npm run build`.
- Start: `npm start`.
- Health check: `/api/health`.

Render supplies `PORT`; no frontend API URL is needed. Verify the health endpoint
and task/note flows at the assigned service URL. Free services sleep after idle
periods, and this app's in-memory records reset when the process restarts.
See [Render's free-service limits](https://render.com/docs/free).

Contributor rules and API contracts are in [AGENTS.md](./AGENTS.md).
