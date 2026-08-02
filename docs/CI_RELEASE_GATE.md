# Frontend CI and Release Gate

## Branch policy

- Work from feature branches based on `dev`.
- `dev` is the current production frontend branch.
- Do not merge this feature branch into `dev` without explicit owner approval.

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

Configure Vercel Deployment Checks to require `frontend-release-gate`. A failed
backend module gate causes `frontend-backend-contract` to fail and therefore
blocks frontend production promotion.

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
