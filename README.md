# Atlas Control Plane

Atlas is an operator dashboard and repository-visible governance layer for autonomous web application inspection, diagnosis, repair, review, and delivery. It is designed around a narrow safety principle: **discover against an explicit constitution, repair only on a durable `heal/*` branch, validate in preview, and promote only after independent review and every required gate passes.**

| Area | What is implemented |
| --- | --- |
| Application constitution | `autonomous/application-contract.yaml` declares routes, protected boundaries, repair rules, Vercel policy, autonomy modes, and the nightly scan posture. |
| Operator dashboard | The React dashboard presents health, correlated findings, repair candidates, review state, autonomy levels, preview-first flow, audit activity, and engineering memory. |
| Founder Layer | The structured AI analysis endpoint returns Architect, Inspector, Engineer, and Reviewer outputs using the server-side model integration. |
| Safety controls | Promotion policy requires a `heal/*` branch based on `main`, a minimal patch, every validation gate, and an independent approval. |
| Persistent records | Database tables and helpers are provided for audit events, engineering memory, and autonomy configuration. |
| Delivery workflow | GitHub Actions verify types, unit tests, and browser tests on `main` and `heal/**`; Vercel policy is represented in `vercel.json`. |

## Workflow

`main` represents production. A finding is correlated from multiple inspector evidence streams, then translated into a minimal candidate on a `heal/*` branch. The candidate must pass build, unit, E2E, visual, preview-browser, and independent-review gates. Only then can the policy engine regard it as eligible for production promotion. A failed gate or rejected review blocks promotion and preserves the audit record.

The initial dashboard intentionally surfaces seeded control-plane evidence so that its governing workflow is inspectable before Git and Vercel credentials are connected. Real Vercel promotion should be enabled only after the Vercel integration is connected and a protected production deployment is configured. The project currently detected an available but disabled Vercel integration; no external deployment has been triggered by this repository.

## Nightly scan

The scheduled callback is available at `/api/scheduled/nightly-scan` and accepts only authenticated platform cron calls. After publishing the site, create the project-level schedule from the repository root:

```bash
node scripts/create-nightly-scan.mjs
```

The job runs at `02:00 UTC` (`0 0 2 * * *`). It is intentionally not created during local development because scheduled callbacks must target a deployed application.

## Local checks

```bash
pnpm check
pnpm test
pnpm exec playwright test
```

Set `PLAYWRIGHT_BASE_URL` to a deployed Vercel Preview URL when running the browser checks against a candidate preview.
