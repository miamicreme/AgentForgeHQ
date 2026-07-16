# AgentForge Product Architecture

## Product Definition

**AgentForge** is the single product name for the platform that designs, tests, deploys, governs, and improves AI agents.

AgentForge combines four previously separate ideas:

1. **Agent Builder** — visual creation, templates, configuration, tools, knowledge, and testing.
2. **Agent Runtime** — execution, orchestration, memory, queues, retries, permissions, and deployments.
3. **Skill System** — reusable workflows, operating procedures, quality gates, and domain capabilities.
4. **Control Plane** — policies, evaluations, observability, cost controls, audit history, and lifecycle management.

No customer-facing sub-product should compete with the AgentForge name.

## Unified Platform Model

```text
AgentForge
├── Studio          Build and configure agents
├── Playground      Test conversations and workflows
├── Runtime         Execute agents and tools
├── Skills          Reusable capabilities and procedures
├── Registry        Store agents, tools, skills, and templates
├── Evaluations     Test quality, safety, and reliability
├── Observability   Logs, traces, metrics, cost, and outcomes
├── Deployments     Version, release, canary, rollback, scale
└── Control         Policy, permissions, approvals, and audit
```

## Agent Hierarchy

Replace the previous Level 1–4 and “GOD-Agent” terminology with production-safe names.

| Tier | Official name | Responsibility |
|---|---|---|
| T0 | Tool | One bounded operation such as HTTP, SQL, email, search, or file access |
| T1 | Specialist Agent | Performs one domain task using approved tools and skills |
| T2 | Workflow Agent | Coordinates several specialists to complete an end-to-end workflow |
| T3 | Supervisor Agent | Manages policies, budgets, routing, lifecycle, and escalation |

### Required rules

- Supervisors are internal control-plane actors, not hidden omnipotent agents.
- Every tier has explicit permissions, budgets, owners, and escalation rules.
- Human approval is required for destructive, financial, legal, production, or high-impact actions.
- Agents may invoke only registered tools and downstream agents allowed by policy.

## Context Model

Rename **Context Blueprints** to **Agent Specifications**.

Each versioned Agent Specification should define:

```yaml
apiVersion: agentforge.dev/v1
kind: Agent
metadata:
  id: buyer-scorer
  name: Buyer Scorer
  version: 1.0.0
spec:
  tier: specialist
  purpose: Score buyers against a property and seller strategy.
  owner: acquisitions
  model:
    provider: openai
    profile: balanced
  skills:
    - real-estate-underwriting
    - buyer-matching
  tools:
    - buyer-registry.read
    - property-records.read
  memory:
    mode: scoped
    retentionDays: 90
  policies:
    requireApprovalFor:
      - external_message
      - financial_commitment
  budgets:
    maxCostPerRunUsd: 1.50
    maxDurationSeconds: 120
  evaluationSuite: buyer-scorer-v1
  escalation:
    onFailure: deal-workflow-supervisor
```

## Core Runtime Flow

```text
User or Event
     ↓
AgentForge API
     ↓
Policy and Permission Check
     ↓
Run Created
     ↓
Agent Specification Loaded
     ↓
Skills Compiled into Execution Plan
     ↓
Tools and Downstream Agents Invoked
     ↓
Trace, Cost, Output, and Outcome Recorded
     ↓
Evaluation and Approval Gates
     ↓
Result Returned or Escalated
```

## Canonical Monorepo Structure

```text
apps/
├── studio/             # customer-facing builder and dashboard
├── admin/              # internal control plane
├── playground/         # chat, voice, and workflow testing
└── docs/               # product and developer documentation

services/
├── api/                 # public API and authentication boundary
├── runtime/             # agent execution engine
├── orchestrator/        # workflow and supervisor coordination
├── tool-gateway/        # controlled tool execution
├── evaluator/           # evaluation jobs and scorecards
└── worker/              # asynchronous jobs and queues

packages/
├── agent-spec/          # schemas and validators
├── skill-registry/      # reusable SkillForge-derived skills
├── tool-registry/       # tool contracts and permissions
├── prompt-compiler/     # deterministic instruction assembly
├── policy-engine/       # RBAC, approvals, budgets, restrictions
├── observability/       # logs, metrics, traces, cost events
├── sdk/                 # AgentForge SDK
└── ui/                  # shared design system
```

## Product Migration

- **AgentForgeHQ** becomes the implementation source for the unified AgentForge platform.
- **AgentForge** becomes the canonical repository name when the migration is ready.
- **Creme-AI-Agent-Maker** becomes a historical prototype; reuse its voice/chat and Supabase patterns.
- **SkillForge** becomes AgentForge Skills, preserving upstream license and attribution where required.

## Product Principles

1. One product name: AgentForge.
2. Specifications are versioned and validated.
3. Tools are permissioned, never implicitly available.
4. Every run is observable and auditable.
5. Quality is measured through evaluations, not claimed.
6. Deployment requires rollback and budget controls.
7. Human approval is a first-class platform feature.
8. Domain capabilities are packaged as reusable skills.
