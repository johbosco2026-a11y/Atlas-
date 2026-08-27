# Autonomous Engineering Control Plane

This directory is the repository-visible control plane. The `application-contract.yaml` file is the versioned constitution that defines expected behavior, non-negotiable boundaries, repair authority, and the preview-first deployment policy. Runtime application code consumes the same rules through the server-side control-plane domain.

> `main` represents production. A repair candidate is never eligible for promotion until it originates on a `heal/*` branch, passes every required gate, and receives an independent approval decision.
