# AgentForgeHQ Phase 2 Environment Validation

## Required toolchain

- Node.js 20.11.1
- pnpm 9.15.4
- disposable Supabase project
- test GitHub App installation or read-only token
- non-production model-provider credential

## Repository proof

Run from a clean checkout:

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

Generate and commit `pnpm-lock.yaml`, then repeat with:

```bash
pnpm install --frozen-lockfile
REQUIRE_LOCKFILE=1 pnpm audit:phase2
```

## Migration proof

1. Create an empty disposable Supabase database.
2. Apply every migration in filename order.
3. Confirm `execution_jobs` and `execution_correlations` exist.
4. Confirm authenticated users have read-only access to those tables.
5. Confirm service-role operations can claim jobs.
6. Reverse the disposable database to its pre-migration snapshot.
7. Reapply from empty state.

Record command output and schema diff in the pull request.

## Two-workspace RLS matrix

Create Workspace A and Workspace B with separate owners.

| Attempt | Expected result |
|---|---|
| Owner A reads Job A | Allowed |
| Owner A reads Job B | Denied or zero rows |
| Owner A inserts execution job directly | Denied |
| Service role inserts Job A linked to Execution A | Allowed |
| Service role inserts Job A linked to Execution B | Trigger rejects |
| Owner A reads Correlation A | Allowed |
| Owner A reads Correlation B | Denied or zero rows |
| Correlation A references Approval B | Trigger rejects |
| Correlation A references Evaluation B | Trigger rejects |

## Runtime proof

- Submit the same idempotency key twice and observe one queue publication.
- Restart the API after persistence but before worker completion.
- Lease a job and verify a second worker cannot claim it before expiry.
- Expire the lease and confirm recovery.
- Fail a job through the maximum attempt count and confirm dead-letter state.
- Submit malformed tool input and confirm the tool is not invoked.
- Approve a request with a changed payload hash and confirm rejection.
- Allow an approval to expire and confirm rejection.

## Playground proof

- Start a real execution.
- Observe queued, validating, compiling, and running states.
- Pause on approval.
- Approve and resume.
- Cancel a second execution with a recorded reason.
- Verify event sequence starts at 1 and remains contiguous.
- Verify no event from another execution appears.

## Provider proof

- Make one non-production provider request.
- Confirm provider credentials remain server-side.
- Confirm request timeout aborts the transport.
- Confirm prompt and completion token accounting is persisted.
- Confirm malformed provider usage is rejected.

## GitHub read proof

- Read repository metadata.
- Read the default-branch tree.
- Read one manifest file.
- Attempt `../` path traversal and confirm rejection.
- Confirm no write, branch, pull-request, merge, or deployment scope is present.

## Completion rule

The first half is environment-validated only when all sections above have evidence attached to the pull request and the Phase 2 workflow passes from a clean checkout.
