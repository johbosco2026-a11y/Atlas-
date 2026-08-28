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
| Protected Preview browser suite | Operator runs from Windows Git Bash reached Vercel Authentication after the bypass value was unset before the effective launch | **Pending; no application failure established** |
| Authenticated Preview browser inspection | Preview `atlas-git-heal-production-va-364c01-johbosco2026-a11ys-projects.vercel.app` rendered the complete Atlas dashboard | Passed |
| Preview tRPC snapshot | Authenticated browser fetch to `/api/trpc/controlPlane.snapshot` returned `200 application/json` | Passed |
| Local type and focused unit tests | `pnpm check`; 10 focused tests across entrypoint, governance authorization, and Cron authorization | Passed |
| Remote GitHub Actions | Run `#6`, commit `01b716e` | Passed: install, type, unit, Chromium, desktop/mobile Playwright |

Vercel Authentication remains enabled. No bypass value is committed or documented in this repository. The secret-bearing assertion was removed in commit `da04d49` on `heal/production-validation-bypass`; the rotated value must not be pasted into chat, source, or application configuration. The archived one-time source synchronization mechanism is absent from the remote `main` tree.

The protected-browser diagnosis is an operator orchestration issue, not an application or guardrail-policy revision. The repository has no protected-Preview launcher: `package.json` exposes only the generic `test:e2e` script, and CI runs local Playwright without a Vercel bypass. A manual run must keep the hidden value exported in the same shell until Playwright exits.

The current isolated hardening branch also declares a Vercel Cron at `/api/scheduled/nightly-scan` for `0 2 * * *` UTC. The endpoint accepts Vercel Cron GET requests only when `Authorization: Bearer $CRON_SECRET` matches the configured secret, while retaining the existing Manus Heartbeat POST path. The secret must be configured in Vercel before enabling the schedule; no schedule was enabled by this change.

## Promotion status

The original runtime candidate is validated for **Level 1 human-approved Repair** and is already represented by the merged `main` deployment described above. The protected-browser reinspection remains pending because the operator-side secret sequencing was not demonstrated successfully. The current authentication/Cron hardening exists only on an isolated local `heal/authenticated-governance-2` checkpoint (`9035270f`); it has not been merged into `main`, and no production deployment or schedule was changed by the control plane. Any future production promotion requires a separate, explicit operator approval.

## Isolated hardening review

The isolated governance hardening review identified and corrected one deny-path issue in the first Cron implementation. An unauthorized `GET /api/scheduled/nightly-scan` previously fell through to Manus session authentication, which could produce a misleading `500` response. The handler now rejects every unauthorized GET immediately with `401 {"error":"invalid-cron-authorization"}` when `CRON_SECRET` is unset, the `Authorization` header is missing, or the bearer credential is wrong. A valid Vercel Cron bearer credential proceeds to the governed inspection path; the existing Manus Heartbeat POST path remains protected by `sdk.authenticateRequest`, `isCron`, and `taskUid`.

The review is covered by seven scheduler tests: three pure authorization checks, three independently named actual HTTP-handler deny-path checks, and one explicit Manus Heartbeat identity predicate check. Cron credentials are reduced to fixed-length SHA-256 digests before `timingSafeEqual`; missing values still return false, so the handler fails closed without a variable-length comparison path. `pnpm check` and the focused entrypoint, governance, and scheduler suite pass with 14 tests. The Vercel Cron code has not yet been pushed or deployed, and no schedule is enabled. Before Preview deployment, `CRON_SECRET` must be configured in the Vercel Preview environment outside source control; then the deployed endpoint should be probed unauthenticated and with an incorrect bearer credential to confirm the `401` contract.

The isolated persistence hardening adds a repository-level guard before state-changing control-plane and experiment operations. If `DATABASE_URL` is absent or the durable store cannot be initialized, the service refuses the mutation with `Durable control-plane storage is unavailable; refusing an in-memory-only mutation.` Read-only snapshot loading continues to support the seeded fallback so the dashboard can explain degraded persistence without claiming a durable write. This is a fail-closed safety boundary; full multi-operation database transactions and actor-attributed audit records remain a separate hardening task.

The Playwright contract test was also hardened: instead of matching variable names in raw source text, it imports the config with a mocked environment value and asserts the resolved `extraHTTPHeaders` object contains that value plus `x-vercel-set-bypass-cookie: true`. This verifies the configuration actually threads the runtime environment into the browser context without embedding any deployment secret.

The scheduled handler’s catch path now logs the full error server-side with `[NightlyScan] failed` but returns only `{ error: "nightly-scan-failed", timestamp }` to authorized callers. Stack traces, request context, and filesystem paths are no longer serialized into the response. A regression test asserts the generic error shape and absence of `stack` and `message`; the focused security suite now passes 15 tests.
