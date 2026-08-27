# Vercel Deployment Verification Record

## Linked services

| Service | Identifier | Status |
| --- | --- | --- |
| GitHub repository | `johbosco2026-a11y/Atlas-` | Linked to Vercel |
| Vercel project | `atlas` (`prj_jiht4VQO1c9mafWixdf3Cx8iriUw`) | Active |
| Production branch | `main` | Protected from ordinary autonomous repair writes |
| Repair branch | `heal/vercel-entrypoint` | Active Preview candidate |

## Original production defect

The initial Git-connected `main` deployment (`e075aaa`) completed successfully in Vercel but served the bundled Node server JavaScript at `/`, rather than the Atlas HTML dashboard. A **READY** deployment status was therefore not treated as a release approval.

## Isolated runtime repair

The approved repair branch separates the Vite static client from the serverless API runtime. Vercel serves `dist/public` at the dashboard root and routes `/api/*` to `api/[...path].ts`. The API function imports an ESM bundle of the Express and tRPC application and packages the application constitution for serverless use.

| Validation gate | Evidence | Outcome |
| --- | --- | --- |
| Static root response | Preview returns the Atlas HTML document, not JavaScript | Passed |
| tRPC snapshot | `/api/trpc/controlPlane.snapshot` returns `200 application/json` | Passed |
| Authenticated Preview inspection | Full operator dashboard rendered in the Vercel Preview | Passed |
| Protected Preview browser suite | Private bypass supplied only through process environment | Passed: desktop and mobile |
| Local type and unit tests | `pnpm check` and 13 Vitest tests | Passed |
| Remote GitHub Actions | Run `#6`, commit `01b716e` | Passed: install, type, unit, Chromium, desktop/mobile Playwright |

Vercel Authentication remains enabled. No bypass value is committed or documented in this repository. The archived one-time source synchronization mechanism was retired from the repair branch after its bootstrap purpose was complete.

## Promotion status

The candidate is validated for **Level 1 human-approved Repair**. It has not been merged into `main`, and no production deployment has been changed by the control plane. A separate, explicit operator approval is required before opening or merging the production pull request; production must then be re-inspected at its root and snapshot endpoint.
