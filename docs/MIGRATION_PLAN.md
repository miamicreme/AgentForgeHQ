# AgentForgeHQ Repository Consolidation Plan

## Goal

Consolidate the strongest ideas and reusable implementation from AgentForgeHQ, AgentForge, Creme AI Agent Maker, and SkillForge into one coherent AgentForgeHQ product without blindly merging incompatible codebases.

## Source roles

### AgentForgeHQ

Becomes the primary product repository and system of record.

Retain or evaluate:

- monorepo foundation
- backend agent concepts
- context/versioning ideas
- CLI concepts
- evaluation and optimization concepts
- agent export concepts
- CI and containerization work

### AgentForge

Use as a clean-name reference and destination for any concepts that were drafted but not implemented. Do not maintain it as a competing active product repository once consolidation begins.

### Creme AI Agent Maker

Treat as the Playground prototype.

Migrate selectively:

- Supabase client patterns
- text chat experience
- browser voice input
- speech synthesis
- Edge Function invocation lessons
- simple responsive UI patterns

Do not copy prototype architecture wholesale.

### SkillForge

Convert into **AgentForge Skills**.

Migrate selectively:

- reusable workflow skills
- verification gates
- repository repair workflows
- production-readiness audits
- productization workflows
- upstream attribution and licensing records

Do not expose SkillForge as a separate competing product brand.

## Consolidation rules

1. AgentForgeHQ is the only master brand.
2. AgentForge is the platform name inside AgentForgeHQ.
3. No duplicate implementation is retained without an explicit owner and purpose.
4. Prototype code must pass architecture, security, and dependency review before migration.
5. Git history and attribution must be preserved where practical.
6. Secrets and `.env` files must never be migrated.
7. Every migrated module receives tests and ownership documentation.
8. Old repositories remain available until the replacement workflow is verified.

## Migration sequence

### Step 1 — Inventory

For every source repository, record:

- active applications
- packages and services
- runtime dependencies
- database dependencies
- external integrations
- environment variables
- tests
- deployment files
- useful documentation
- stale or duplicate components

### Step 2 — Classify

Classify each asset as:

- migrate
- rewrite
- reference only
- archive
- delete after verification

### Step 3 — Establish destination contracts

Before moving code, implement or document:

- package boundaries
- Agent Specification schema
- tool contract
- skill contract
- execution contract
- evaluation contract
- audit event contract

### Step 4 — Migrate Playground

Move the useful chat and voice experience into `apps/web` under AgentForge Playground.

Required improvements:

- authenticated workspace context
- streaming responses
- execution ID and status
- cancellation
- tool-call visualization
- error states
- accessibility
- no client-side secret handling

### Step 5 — Migrate skills

Create `skills/` and `packages/skill-registry`.

Each skill must include:

- name and version
- description and triggers
- input and output contracts
- required tools
- requested permissions
- workflow steps
- evaluation suite references
- provenance and license metadata

### Step 6 — Normalize runtime

Replace overlapping backend paths with a single execution architecture:

- execution API
- durable queue
- worker
- Tool Gateway
- model adapter
- execution timeline

### Step 7 — Archive legacy identities

After replacement capabilities are verified:

- update old READMEs with migration notices
- link to AgentForgeHQ
- mark repositories archived where appropriate
- preserve license and attribution notices
- disable obsolete deployments and secrets

## Naming migration

| Existing name | Destination |
|---|---|
| AgentForgeHQ | AgentForgeHQ master brand and repository |
| AgentForge | AgentForge platform |
| Creme AI Agent Maker | AgentForge Playground prototype |
| SkillForge | AgentForge Skills |
| Context Blueprint | Agent Specification |
| GOD-Agent | Supervisor Agent |
| Super-Agent | Coordinator Agent |
| Domain Agent | Specialist Agent |
| Primitive Wrapper | Tool |
| Bulk Factory | Agent Provisioning Pipeline |
| Omni-Capability Suite | Capability Registry |

## Repository cleanup targets

The current AgentForgeHQ structure should ultimately eliminate overlapping or ambiguous roots such as separate `client` and `backend` folders outside the canonical workspaces unless they have a documented transitional purpose.

Target active roots:

```text
apps/
packages/
services/
skills/
templates/
evals/
infrastructure/
docs/
```

## Verification gates

A migration unit is accepted only when:

- destination build passes
- tests pass
- behavior is demonstrated
- secrets scan passes
- dependency scan passes
- documentation exists
- source and attribution are recorded
- old path is not removed until replacement is confirmed

## Decommission checklist

Before archiving a source repository:

- all retained assets are migrated or documented
- active deployments are identified
- DNS and environment dependencies are resolved
- secrets are rotated or revoked
- users are redirected
- README contains migration status
- final tag or release is created
- repository is set read-only or archived