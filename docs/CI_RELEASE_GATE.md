# Frontend CI and Release Gate

## Branch policy

- Work from feature branches based on `dev`.
- `main` is the only Vercel Production branch.
- `dev` is the integration branch and is intentionally disabled from Vercel
  Git deployments in `vercel.json`; use it for local development.
- Promote `dev` to `main` only through a pull request after both repositories'
  aggregate gates are green.

## Environment policy

| Context | Branch/source | Backend | Supabase |
|---|---|---|---|
| Production | Vercel `main` | Production Render service | Production project |
| Local development | Local `dev` checkout | Local/dev backend | Development project |
| GitHub Actions | Any checked branch | CI fixtures and pinned backend evidence | CI placeholders |

For local development, copy `.env.development.example` to
`.env.development.local` and fill it with the development Supabase URL and
publishable/anon key. This file is ignored by Git. Do not copy Production
credentials into a development environment file.

Vercel Production variables must target Production only. Preview or
Development variables must never point to the Production Render or Supabase
services. Until development values are configured in Vercel, use local
development rather than a Vercel Preview for workflows that read or mutate
business data.

## Required repository secret

Add a fine-grained GitHub token as:

`SCS_BACKEND_READ_TOKEN`

Minimum access:

- repository: `clyntu/scs-be`;
- contents: read;
- checks/statuses: read.

The workflow fails closed when this secret is absent or cannot read the pinned
private backend commit.

## Backend pin

`backend-version.json` records:

- backend repository;
- backend ref for human context;
- exact tested backend commit SHA;
- deterministic OpenAPI SHA-256.

Frontend production promotion must use that exact backend evidence, not an
unresolved “latest dev” reference.

## Required checks

- `frontend-quality`
- `frontend-browser-smoke`
- `frontend-backend-contract`
- `frontend-release-gate`

Vercel Deployment Checks require `frontend-release-gate` before assigning the
production alias. A failed backend module gate causes
`frontend-backend-contract` to fail and therefore blocks frontend production
promotion.

Configure Render to require the backend repository's `backend-release-gate`
using **After CI Checks Pass**.

## Production build enforcement

`next.config.js` no longer bypasses TypeScript or ESLint failures. This is
intentional: local, GitHub Actions, and Vercel production builds now fail on
the same type or lint errors. The feature branch resolves the errors that
were present when enforcement was enabled, and `frontend-quality` proves
typecheck, lint, tests, and the production build together.

## User-visible compatibility note

The type-safety fix changes CDR and Customer Return PDFs to read the current
`customer.address` field. Those PDFs previously used the removed
`building_address` property and therefore rendered a blank address line.

## Updating the backend pin

1. Merge and verify the backend change on backend `dev`.
2. Record the exact backend `dev` commit SHA.
3. Generate the deterministic OpenAPI SHA-256 from that commit.
4. Update `backend-version.json` on the frontend feature branch.
5. Run all frontend checks.
6. Review before any frontend `dev` merge.
