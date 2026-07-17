# AgentForgeHQ Days 1–7 — Twenty-Pass Hardening Audit

## Scope

This audit revisits the product and engineering foundation delivered during Days 1–7. It does not expand the MVP into later runtime features. It strengthens the baseline that later phases depend on.

## Twenty passes

1. **MVP boundary pass** — confirmed the golden path and deferred-scope boundaries remain consistent with the product foundation.
2. **Repository identity pass** — confirmed the root package is private and named `agentforgehq`.
3. **Runtime version pass** — pinned CI to Node 20.11.1 and pnpm 9.15.4.
4. **Workspace topology pass** — verified the canonical `apps/*`, `packages/*`, and `services/*` workspace patterns.
5. **CI trigger pass** — added manual `workflow_dispatch` while retaining branch and pull-request verification.
6. **CI gate pass** — added an executable foundation audit before formatting, linting, type checking, tests, and build.
7. **Dependency maintenance pass** — added grouped weekly Dependabot updates with a bounded PR limit.
8. **Secret exposure pass** — added checks that reject service-role, OpenAI, and Stripe secrets exposed through browser-prefixed environment variables.
9. **Required-file pass** — added deterministic checks for the minimum foundation file set.
10. **Schema strictness pass** — made nested Agent Specification objects strict, not only the top-level object.
11. **Input normalization pass** — trims human-entered strings before validation and compilation.
12. **Duplicate capability pass** — deduplicates skills, tools, approval requirements, success criteria, and system instructions.
13. **Numeric integrity pass** — rejects non-finite cost and evaluation score values.
14. **Execution-limit coherence pass** — prevents maximum tool calls from exceeding maximum total steps.
15. **Compiler determinism pass** — verifies ordering changes in skills and tools do not alter compiled output.
16. **Semantic-diff stability pass** — preserves stable top-level semantic change paths.
17. **Authorization vocabulary pass** — added explicit approval and evaluation actions to the workspace permission model.
18. **Authorization runtime-boundary pass** — added role/action guards and blank identifier rejection.
19. **Authorization matrix pass** — expanded tests for owner, builder, reviewer, and viewer boundaries.
20. **Database tenant-integrity pass** — added triggers preventing cross-workspace agent versions, mismatched current versions, and mutation of version identity fields.

## Concrete changes

- Hardened `packages/agent-spec` validation and tests.
- Hardened `packages/auth` permissions, runtime guards, and tests.
- Added `scripts/foundation-audit.mjs` and wired it into `pnpm verify` and CI.
- Added weekly Dependabot configuration.
- Added `202607170005_foundation_integrity.sql` for relational and tenant consistency.
- Added explicit update and delete policies where the foundation previously lacked them.

## Evidence status

The source changes, tests, workflow definitions, and migrations are present on the branch. The GitHub connector cannot execute package installation, TypeScript compilation, unit tests, or Supabase migrations locally. CI and database execution evidence remain required before merge.

## Remaining blockers

1. Generate and commit `pnpm-lock.yaml`, then restore frozen installs.
2. Confirm a compatible ESLint flat configuration exists and passes.
3. Run all migrations against a disposable Supabase project.
4. Add automated cross-workspace RLS integration tests.
5. Confirm the intended organization/workspace bootstrap path, since tenant creation should not rely on unrestricted client-side inserts.
