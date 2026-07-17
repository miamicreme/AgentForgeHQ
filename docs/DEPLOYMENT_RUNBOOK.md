# AgentForgeHQ Deployment Runbook

## Environments

Development, staging, and production must use separate credentials, databases, model-provider keys, and deployment records. Browser bundles may contain only public configuration.

## Pre-deployment gates

1. Agent Specification validates.
2. Required evaluation suite passes at or above its minimum score.
3. Tool permissions and approval policy are reviewed.
4. No unresolved critical security finding exists.
5. Database migrations have forward and rollback evidence.
6. Release notes and rollback target are recorded.

## Staging procedure

1. Install from the committed lockfile.
2. Run format, lint, typecheck, unit tests, build, foundation audit, and release-readiness audit.
3. Apply migrations to staging.
4. Seed a demonstration workspace.
5. Run the golden path and Repository Delivery evaluation suite.
6. Confirm execution metrics, approvals, and incidents remain workspace-scoped.

## Production procedure

1. Create an immutable approved release.
2. Deploy with rollout percentage 10.
3. Observe success rate, p95 latency, cost, and error rate.
4. Increase to 50 only when health gates pass.
5. Increase to 100 only after reviewer approval.

## Rollback

1. Stop rollout expansion.
2. Mark the deployment failed.
3. Activate the last healthy release.
4. Record the rollback release and reason.
5. Open an incident and preserve affected execution evidence.
6. Do not delete the failed release or its audit history.

## Smoke tests

- Authentication and workspace isolation
- Agent Registry read
- Playground execution
- Approval pause/resume
- Evaluation suite execution
- Release gate denial and success paths
- Observe metrics visibility
- Repository Delivery Agent read-only repository inspection
