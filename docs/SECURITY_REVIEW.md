# AgentForgeHQ Security Review

## Trust boundaries

- Browser to application API
- Application API to Supabase
- Runtime to model providers
- Runtime to Tool Gateway
- Tool Gateway to external systems
- Human reviewer to approval decision

## Required controls

- Deny-by-default workspace authorization
- Row-level security on tenant data
- Server-only provider and service credentials
- Tool input/output validation
- Approval gates for writes, commands, messages, pull requests, and deployments
- Secret redaction before persistence and rendering
- Execution, tool-call, approval, evaluation, release, and deployment audit records
- Cost, step, tool-call, and timeout limits
- Protected-branch enforcement

## Day 26 review findings

### Addressed in source

- Release publishing fails closed on six mandatory gates.
- Repository Delivery explicitly forbids merge, production deploy, and secret-reader capabilities.
- Release, deployment, metrics, and incident tables are workspace-scoped with RLS.
- Production deployment is limited to workspace owners.
- Rollback records preserve prior releases and audit evidence.

### Environment-backed checks still required

- Dependency vulnerability scan
- Secret scanning across repository history
- RLS integration tests with two workspaces
- Migration apply and rollback testing
- Browser bundle inspection for service credentials
- Tool Gateway JSON Schema enforcement under malformed payloads

## Release policy

No production release may proceed with a known critical finding, a failed required evaluation, an unapproved permission set, or a missing rollback plan.
