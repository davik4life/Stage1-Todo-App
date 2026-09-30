# TaskFlow & Notes

HNG 15 Todo App by Victor Adeshile. React frontend, Express API, and persistent
PostgreSQL storage for tasks and notes.

## Local development

Use Node 24 and npm:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Vite proxies API requests to port 5001. Local
PostgreSQL runs through PGlite and stores data in the ignored `.local-data/`
folder. Stopping and starting the app preserves records. Tests use separate
temporary databases and never contact the hosted database.

```sh
npm test
npm run build
```

For a production-like standalone server, configure `DATABASE_URL` with a
PostgreSQL connection string, apply the SQL migration in
`netlify/database/migrations/`, build, then run `npm start`. Never commit database
credentials or put them in frontend `VITE_*` variables. There is no in-memory
fallback: a missing or unavailable database causes an error instead of losing
saved records silently.

## Netlify deployment

Import this GitHub repository into Netlify and select the `main` branch. The
`netlify.toml` config sets build command `npm test && npm run build`, publish
directory `build`, and the Express function in `netlify/functions/api.js`.
API rewrites precede the SPA fallback. The frontend uses same-origin requests.

Netlify Database is automatically provisioned when supported by the team's
credit-based plan. Netlify supplies `NETLIFY_DB_URL` privately and applies the
versioned SQL migrations before publishing. Production uses its persistent
PostgreSQL database; deploy previews receive separate database branches. Never
seed or reset the production database during startup or deployment.

Confirm plan limits in the dashboard before provisioning. No paid plan upgrade
is required by this code. Netlify Functions and database compute may start cold,
but records remain in PostgreSQL across function restarts and deployments.

Verify `/api/health` returns `status: "ok"` and `storage: "postgresql"` after
publishing, then check task/note operations. Git-connected production deploys
should follow pushes to `main`.

The previous Render service is kept available during migration. Do not push the
new PostgreSQL backend to a Render service without a configured database; pause
its automatic deploys before publishing the migration to `main`.

## Existing data and access

Before switching, export `/todos` and `/notes` from the old service. Local
migration backups belong in ignored `migration-backups/`, never in Git. Import
records once, preserving IDs and timestamps, with conflict handling so retrying
does not duplicate records. Previously reset in-memory data cannot be recovered.

This app still has a shared, public workspace with no login or per-user access
control. Persistence does not provide privacy. Do not use it for private notes
until authentication and ownership checks are implemented.

Contributor rules are in [AGENTS.md](./AGENTS.md).
