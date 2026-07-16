# AgentForge Naming Conventions

## Brand Rule

Use **AgentForge** as the only product name.

Do not use these as separate product brands:

- AgentForgeHQ
- Creme AI Agent Maker
- SkillForge
- GOD-Agent
- Super-Agent

They may appear only in migration history or attribution notes.

## User-Facing Product Areas

| Name | Purpose |
|---|---|
| AgentForge Studio | Build and configure agents |
| AgentForge Playground | Test chat, voice, tools, and workflows |
| AgentForge Registry | Browse agents, skills, tools, templates, and versions |
| AgentForge Evaluations | Run test suites and inspect scorecards |
| AgentForge Deployments | Release, canary, rollback, and scale agents |
| AgentForge Observability | View runs, traces, logs, outcomes, latency, and cost |
| AgentForge Control | Manage policies, approvals, permissions, and budgets |
| AgentForge Skills | Reusable workflow and domain skill library |
| AgentForge CLI | Local development and operations command line |
| AgentForge SDK | Programmatic integration package |

## Agent Type Names

Use these official names:

- `tool`
- `specialist`
- `workflow`
- `supervisor`

Avoid exaggerated or ambiguous labels such as `god`, `master`, `ultimate`, `omni`, `brain`, or `hq` in type names.

## Repository Names

Preferred repository pattern:

```text
agentforge
agentforge-skills
agentforge-sdk-js
agentforge-sdk-python
agentforge-examples
agentforge-docs
agentforge-deploy
```

For a monorepo, prefer the single canonical repository:

```text
miamicreme/AgentForge
```

## Directory Names

Use lowercase kebab-case for directories:

```text
agent-spec
skill-registry
tool-gateway
policy-engine
run-history
cost-controls
```

Applications and services should describe responsibility rather than technology:

```text
apps/studio
apps/playground
apps/admin
services/api
services/runtime
services/orchestrator
services/evaluator
services/worker
```

Avoid:

```text
apps/frontend
apps/backend
apps/new-ui
services/misc
packages/common
```

## Package Names

Use the `@agentforge` namespace:

```text
@agentforge/agent-spec
@agentforge/runtime
@agentforge/skill-registry
@agentforge/tool-registry
@agentforge/policy-engine
@agentforge/observability
@agentforge/sdk
@agentforge/ui
```

## Database Naming

Use plural snake_case table names:

```text
organizations
workspaces
agents
agent_versions
agent_skills
tools
agent_tools
knowledge_sources
runs
run_steps
tool_calls
evaluation_suites
evaluation_cases
evaluation_results
deployments
approval_requests
usage_events
cost_events
audit_events
```

Primary keys use `id`. Foreign keys use `<entity>_id`.

Timestamps use:

```text
created_at
updated_at
started_at
completed_at
archived_at
```

## API Naming

REST resource examples:

```text
/api/v1/agents
/api/v1/agents/{agentId}/versions
/api/v1/runs
/api/v1/evaluation-suites
/api/v1/deployments
/api/v1/approval-requests
```

Use nouns for resources and verbs only for explicit actions:

```text
POST /api/v1/agents/{agentId}/runs
POST /api/v1/deployments/{deploymentId}/rollback
POST /api/v1/approval-requests/{requestId}/approve
```

## Event Naming

Use past-tense dotted events:

```text
agent.created
agent.version.published
run.started
run.step.completed
tool.call.failed
evaluation.completed
deployment.promoted
approval.requested
approval.granted
budget.exceeded
```

## Environment Variables

Use the `AGENTFORGE_` prefix for platform variables:

```text
AGENTFORGE_ENV
AGENTFORGE_API_URL
AGENTFORGE_LOG_LEVEL
AGENTFORGE_ENCRYPTION_KEY
AGENTFORGE_DEFAULT_MODEL
AGENTFORGE_MAX_RUN_COST_USD
```

Provider variables retain provider names:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
```

Never expose secret keys through `VITE_`, `NEXT_PUBLIC_`, or other browser-visible prefixes.

## CLI Naming

The executable is `agentforge` with optional short alias `forge`.

```bash
agentforge agent create
agentforge agent run <agent-id>
agentforge agent validate <agent-id>
agentforge skill list
agentforge spec diff <agent-id>
agentforge eval run <suite-id>
agentforge deploy create <agent-id>
agentforge deploy rollback <deployment-id>
agentforge run logs <run-id>
agentforge usage report
```

Mutating commands should support `--dry-run` where practical.

## Versioning

- Platform releases: semantic versioning, such as `v1.4.0`.
- Agent specifications: semantic versioning per agent.
- Skills: semantic versioning per skill.
- APIs: URL major version, such as `/api/v1`.
- Evaluation suites: immutable versioned IDs, such as `repo-audit-v2`.

## UI Language

Prefer concrete action labels:

- Create agent
- Test agent
- Run evaluation
- Request approval
- Publish version
- Deploy agent
- Roll back deployment
- View trace

Avoid vague labels:

- Magic build
- Make smarter
- Ultimate mode
- God controls
- Auto everything

## Migration Mapping

| Previous term | New AgentForge term |
|---|---|
| Creme AI Agent Maker | AgentForge Playground prototype |
| SkillForge | AgentForge Skills |
| AgentForgeHQ | AgentForge |
| Context Blueprint | Agent Specification |
| Primitive Tool / Level 1 | Tool / T0 |
| Domain Agent / Level 2 | Specialist Agent / T1 |
| Super-Agent / Level 3 | Workflow Agent / T2 |
| GOD-Agent / Level 4 | Supervisor Agent / T3 |
| Omni-Capability Suite | AgentForge capability registry |
| Bulk Factory | Agent template and provisioning pipeline |
