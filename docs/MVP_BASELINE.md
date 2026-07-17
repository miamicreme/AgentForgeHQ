# AgentForgeHQ MVP Baseline

## Golden path

A signed-in workspace member creates a draft agent, validates its Agent Specification, creates an immutable version, and later tests that exact version in Playground. All future executions must retain the version, workspace, actor, policy, and audit context.

## Canonical system boundaries

- `apps/web`: product UI and authenticated user flows
- `apps/api`: HTTP boundary and application services
- `apps/worker`: durable asynchronous work
- `packages/agent-spec`: specification types, validation, compilation, semantic diff
- `packages/auth`: workspace authorization primitives
- `packages/database`: generated database types and data access boundaries
- `supabase/migrations`: schema and RLS source of truth

## Non-negotiable requirements

1. Every request is workspace-scoped.
2. Published agent versions are immutable.
3. Agent Specifications are versioned and validated before persistence.
4. Authorization decisions are deny-by-default.
5. Secrets never enter public client bundles or audit payloads.
6. CI must run install, lint, type-check, test, and build.
7. Runtime success cannot be claimed without environment-backed verification.

## Definition of Done

A Days 1–7 deliverable is complete when:

- its public contract is documented;
- types and validation exist;
- relevant unit tests or database assertions exist;
- error behavior is explicit;
- tenant isolation is enforced at both API and database layers;
- CI has a command that verifies it;
- limitations are recorded.

## Known constraints

The repository contains legacy and duplicate application paths. This phase establishes canonical paths without deleting legacy code. Deletion requires migration evidence and a separate review.
